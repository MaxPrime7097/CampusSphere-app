from django.db import models
from django.conf import settings
from django.utils import timezone


class Conversation(models.Model):
    TYPE_CHOICES = [
        ('private', 'Privé'),
        ('group', 'Groupe'),
    ]

    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='private')
    name = models.CharField(max_length=100, blank=True)
    avatar = models.ImageField(upload_to='conversations/avatars/', null=True, blank=True)

    # Participants (for private conversations, only 2 users)
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')

    # Group settings (only for group conversations)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='created_conversations',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        if self.type == 'private':
            participants_names = [user.username for user in self.participants.all()]
            return f"Private: {', '.join(participants_names)}"
        else:
            return self.name or f"Group conversation ({self.id})"

    def get_last_message(self):
        return self.messages.order_by('-created_at').first()

    def get_unread_count(self, user):
        """Get unread messages count for a specific user"""
        last_read = self.read_receipts.filter(user=user).first()
        if last_read:
            return self.messages.filter(created_at__gt=last_read.last_read_at).count()
        return self.messages.count()

    def mark_as_read(self, user):
        """Mark conversation as read for a user"""
        receipt, created = ConversationReadReceipt.objects.get_or_create(
            conversation=self,
            user=user,
            defaults={'last_read_at': timezone.now()}
        )
        if not created:
            receipt.last_read_at = timezone.now()
            receipt.save()


class Message(models.Model):
    content = models.TextField()
    conversation = models.ForeignKey(Conversation, related_name='messages', on_delete=models.CASCADE)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='messages', on_delete=models.CASCADE)

    # Metadata
    is_read = models.BooleanField(default=False)
    read_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='read_messages', blank=True)

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message by {self.author.username}: {self.content[:50]}..."

    def mark_as_read(self, user):
        """Mark message as read by a user"""
        if user not in self.read_by.all():
            self.read_by.add(user)
            # Update conversation read receipt
            self.conversation.mark_as_read(user)


class ConversationReadReceipt(models.Model):
    conversation = models.ForeignKey(Conversation, related_name='read_receipts', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='read_receipts', on_delete=models.CASCADE)
    last_read_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['conversation', 'user']

    def __str__(self):
        return f"{self.user.username} read {self.conversation} at {self.last_read_at}"
