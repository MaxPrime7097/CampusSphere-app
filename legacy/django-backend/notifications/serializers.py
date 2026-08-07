from rest_framework import serializers
from django.utils import timezone
from .models import Notification, NotificationSettings


class NotificationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    is_recent = serializers.BooleanField(read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'type_display', 'title', 'message', 'recipient',
            'data', 'is_read', 'read_at', 'is_recent', 'created_at'
        ]
        read_only_fields = ['id', 'recipient', 'created_at']


class NotificationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['is_read']

    def update(self, instance, validated_data):
        if validated_data.get('is_read') and not instance.is_read:
            instance.mark_as_read()
        elif not validated_data.get('is_read') and instance.is_read:
            instance.mark_as_unread()
        return instance


class NotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSettings
        fields = [
            'email_post_likes', 'email_post_comments', 'email_sphere_invitations',
            'email_task_assignments', 'email_messages', 'push_post_likes',
            'push_post_comments', 'push_sphere_invitations', 'push_task_assignments',
            'push_messages', 'in_app_post_likes', 'in_app_post_comments',
            'in_app_sphere_invitations', 'in_app_task_assignments', 'in_app_messages',
            'system_updates', 'marketing_emails'
        ]


class NotificationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['type', 'title', 'message', 'recipient', 'data']

    def create(self, validated_data):
        return super().create(validated_data)