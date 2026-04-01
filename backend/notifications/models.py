from django.db import models
from django.conf import settings
from django.utils import timezone


class Notification(models.Model):
    CANONICAL_TYPES = [
        ('post_like', 'Like sur post'),
        ('post_comment', 'Commentaire sur post'),
        ('comment_reply', 'Réponse à commentaire'),
        ('sphere_invitation', 'Invitation à une sphère'),
        ('sphere_join_request', 'Demande d\'adhésion'),
        ('task_assigned', 'Tâche assignée'),
        ('task_completed', 'Tâche terminée'),
        ('resource_shared', 'Ressource partagée'),
        ('connection_request', 'Demande de connexion'),
        ('connection_accepted', 'Connexion acceptée'),
        ('message', 'Message reçu'),
        ('system', 'Notification système'),
    ]
    TYPE_CHOICES = CANONICAL_TYPES

    # Basic Information
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()

    # Recipient
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='notifications', on_delete=models.CASCADE)

    # Related data (JSON for flexibility)
    data = models.JSONField(default=dict, blank=True)

    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.title}"

    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

    def mark_as_unread(self):
        """Mark notification as unread"""
        if self.is_read:
            self.is_read = False
            self.read_at = None
            self.save(update_fields=['is_read', 'read_at'])

    @property
    def is_recent(self):
        """Check if notification is recent (less than 24 hours)"""
        return (timezone.now() - self.created_at).total_seconds() < 86400  # 24 hours


class NotificationSettings(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='notification_settings', on_delete=models.CASCADE)

    # Email notifications
    email_post_likes = models.BooleanField(default=True)
    email_post_comments = models.BooleanField(default=True)
    email_sphere_invitations = models.BooleanField(default=True)
    email_task_assignments = models.BooleanField(default=True)
    email_messages = models.BooleanField(default=True)

    # Push notifications
    push_post_likes = models.BooleanField(default=False)
    push_post_comments = models.BooleanField(default=True)
    push_sphere_invitations = models.BooleanField(default=True)
    push_task_assignments = models.BooleanField(default=True)
    push_messages = models.BooleanField(default=True)

    # In-app notifications
    in_app_post_likes = models.BooleanField(default=True)
    in_app_post_comments = models.BooleanField(default=True)
    in_app_sphere_invitations = models.BooleanField(default=True)
    in_app_task_assignments = models.BooleanField(default=True)
    in_app_messages = models.BooleanField(default=True)

    # System notifications
    system_updates = models.BooleanField(default=True)
    marketing_emails = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Notification Settings'
        verbose_name_plural = 'Notification Settings'

    def __str__(self):
        return f"Notification settings for {self.user.username}"
