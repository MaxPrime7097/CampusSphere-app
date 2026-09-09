import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        if isinstance(user, AnonymousUser):
            await self.close()
            return

        self.user_group_name = f'user_notifications_{user.id}'

        # Join user notification group
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )

    async def send_notification(self, event):
        # Send notification to WebSocket
        await self.send(text_data=json.dumps(event['payload']))
