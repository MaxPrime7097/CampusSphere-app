from rest_framework import serializers
from django.utils import timezone
from .models import Conversation, Message, ConversationReadReceipt
from .errors import business_validation_error


class MessageSerializer(serializers.ModelSerializer):
    author_info = serializers.SerializerMethodField()
    is_read_by_user = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'content', 'author', 'author_info', 'conversation',
            'is_read', 'is_read_by_user', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'conversation', 'is_read', 'created_at', 'updated_at']

    def get_author_info(self, obj):
        from users.serializers import UserProfileSerializer
        return UserProfileSerializer(obj.author).data

    def get_is_read_by_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.read_by.filter(id=request.user.id).exists()
        return False


class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['content']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        validated_data['conversation'] = self.context['conversation']
        message = super().create(validated_data)
        
        # Update conversation timestamp
        message.conversation.updated_at = timezone.now()
        message.conversation.save(update_fields=['updated_at'])
        
        return message


class ConversationSerializer(serializers.ModelSerializer):
    participants_info = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    created_by_info = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'type', 'name', 'participants', 'participants_info',
            'created_by', 'created_by_info', 'last_message', 'unread_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_participants_info(self, obj):
        from users.serializers import UserProfileSerializer
        return UserProfileSerializer(obj.participants.all(), many=True).data

    def get_last_message(self, obj):
        last_message = obj.get_last_message()
        if last_message:
            return MessageSerializer(last_message, context=self.context).data
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_unread_count(request.user)
        return 0

    def get_created_by_info(self, obj):
        if obj.created_by:
            from users.serializers import UserProfileSerializer
            return UserProfileSerializer(obj.created_by).data
        return None


class ConversationCreateSerializer(serializers.ModelSerializer):
    participant_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True
    )

    class Meta:
        model = Conversation
        fields = ['type', 'name', 'participant_ids']

    def validate_participant_ids(self, value):
        from users.models import User
        
        # Check if all participants exist
        existing_users = User.objects.filter(id__in=value)
        if len(existing_users) != len(value):
            business_validation_error("invalid_participant", "One or more participants not found")

        # For private conversations, only 2 participants allowed (including creator)
        if self.initial_data.get('type') == 'private' and len(value) != 1:
            business_validation_error("invalid_participant", "Private conversations must have exactly 2 participants")

        # For group conversations, at least 2 participants (excluding creator)
        if self.initial_data.get('type') == 'group' and len(value) < 2:
            business_validation_error("invalid_participant", "Group conversations must have at least 3 participants")

        return value

    def validate(self, data):
        # For private conversations, check if conversation already exists
        if data['type'] == 'private':
            participant_ids = data['participant_ids']
            current_user = self.context['request'].user
            
            # Check if private conversation already exists between these users
            from django.db.models import Q, Count
            existing_conversation = Conversation.objects.filter(
                type='private'
            ).annotate(
                participant_count=Count('participants')
            ).filter(
                participant_count=2,
                participants=current_user
            ).filter(
                participants__in=participant_ids
            ).first()

            if existing_conversation:
                business_validation_error("conversation_exists", "Private conversation already exists between these users")

        return data

    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids')
        current_user = self.context['request'].user
        
        # Set created_by for group conversations
        if validated_data['type'] == 'group':
            validated_data['created_by'] = current_user

        conversation = super().create(validated_data)
        
        # Add participants
        from users.models import User
        participants = User.objects.filter(id__in=participant_ids)
        conversation.participants.add(current_user, *participants)
        
        return conversation


class ConversationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ['name']

    def validate(self, data):
        # Only group conversations can be updated
        if self.instance.type != 'group':
            business_validation_error("permission_denied", "Only group conversations can be updated")
        return data