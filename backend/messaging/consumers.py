import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.conversation_group_name = f'conversation_{self.conversation_id}'

        # Check if user is authenticated and is a participant
        user = self.scope["user"]
        if isinstance(user, AnonymousUser):
            await self.close()
            return

        # Check if user is a participant of this conversation
        is_participant = await self.is_conversation_participant(user, self.conversation_id)
        if not is_participant:
            await self.close()
            return

        # Join conversation group
        await self.channel_layer.group_add(
            self.conversation_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave conversation group
        await self.channel_layer.group_discard(
            self.conversation_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type', 'chat_message')
            
            if message_type == 'chat_message':
                content = text_data_json['content']
                
                # Save message to database
                message = await self.save_message(content)
                
                # Send message to conversation group
                await self.channel_layer.group_send(
                    self.conversation_group_name,
                    {
                        'type': 'conversation_event',
                        'event_type': 'message_created',
                        'payload': {
                            'message': {
                                'id': str(message.id),
                                'content': message.content,
                                'author': {
                                    'id': str(message.author.id),
                                    'username': message.author.username,
                                    'first_name': message.author.first_name,
                                    'last_name': message.author.last_name,
                                    'avatar': message.author.avatar.url if message.author.avatar else None,
                                },
                                'created_at': message.created_at.isoformat(),
                            }
                        }
                    }
                )
            elif message_type == 'typing':
                # Handle typing indicators
                await self.channel_layer.group_send(
                    self.conversation_group_name,
                    {
                        'type': 'typing_indicator',
                        'user': {
                            'id': str(self.scope["user"].id),
                            'username': self.scope["user"].username,
                        },
                        'is_typing': text_data_json.get('is_typing', False)
                    }
                )
        except Exception as e:
            await self.send(text_data=json.dumps({
                'error': 'Invalid message format'
            }))

    async def conversation_event(self, event):
        await self.send(text_data=json.dumps({
            'type': event.get('event_type', 'conversation_event'),
            'payload': event.get('payload', {})
        }))

    async def typing_indicator(self, event):
        # Don't send typing indicator to the sender
        if event['user']['id'] != str(self.scope["user"].id):
            await self.send(text_data=json.dumps({
                'type': 'typing_indicator',
                'user': event['user'],
                'is_typing': event['is_typing']
            }))

    @database_sync_to_async
    def is_conversation_participant(self, user, conversation_id):
        from .models import Conversation
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            return conversation.participants.filter(id=user.id).exists()
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content):
        from .models import Conversation, Message
        conversation = Conversation.objects.get(id=self.conversation_id)
        message = Message.objects.create(
            content=content,
            author=self.scope["user"],
            conversation=conversation
        )
        
        # Update conversation timestamp
        conversation.updated_at = message.created_at
        conversation.save(update_fields=['updated_at'])
        
        return message
