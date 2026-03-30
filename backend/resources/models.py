from django.db import models
from django.conf import settings
from django.utils import timezone


class Resource(models.Model):
    CANONICAL_TYPES = [
        ('cours', 'Cours'),
        ('notes', 'Notes'),
        ('resumes', 'Résumés'),
        ('exercises', 'Exercices'),
        ('projects', 'Projets'),
        ('presentations', 'Présentations'),
        ('other', 'Autre'),
    ]
    TYPE_CHOICES = CANONICAL_TYPES

    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('university', 'Université uniquement'),
        ('friends', 'Amis uniquement'),
    ]

    # Basic Information
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='resources', on_delete=models.CASCADE)

    # File Information
    file = models.FileField(upload_to='resources/')
    file_size = models.IntegerField()
    file_type = models.CharField(max_length=50)

    # Metadata
    subject = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='public')
    audience = models.CharField(max_length=200, blank=True)

    # Tags
    tags = models.JSONField(default=list, blank=True)

    # Statistics
    impact_score = models.IntegerField(default=0)
    downloads_count = models.IntegerField(default=0)
    views_count = models.IntegerField(default=0)
    saves_count = models.IntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def increment_downloads(self):
        self.downloads_count += 1
        self.save(update_fields=['downloads_count'])

    def increment_views(self):
        self.views_count += 1
        self.save(update_fields=['views_count'])

    def increment_saves(self):
        self.saves_count += 1
        self.save(update_fields=['saves_count'])

    def decrement_saves(self):
        if self.saves_count > 0:
            self.saves_count -= 1
            self.save(update_fields=['saves_count'])


class ResourceSave(models.Model):
    resource = models.ForeignKey(Resource, related_name='saves', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='saved_resources', on_delete=models.CASCADE)
    saved_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['resource', 'user']
        ordering = ['-saved_at']

    def __str__(self):
        return f"{self.user.username} saved {self.resource.title}"


class ResourceView(models.Model):
    resource = models.ForeignKey(Resource, related_name='views', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='viewed_resources', on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['resource', 'user']
        ordering = ['-viewed_at']

    def __str__(self):
        return f"{self.user.username} viewed {self.resource.title}"


class ResourceReport(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('dismissed', 'Dismissed'),
        ('action_taken', 'Action Taken'),
    ]

    resource = models.ForeignKey(Resource, related_name='reports', on_delete=models.CASCADE)
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='resource_reports', on_delete=models.CASCADE)
    reason = models.CharField(max_length=120)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['resource', 'reporter']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reporter.username} reported resource {self.resource.id} ({self.reason})"


class ResourceShareEvent(models.Model):
    CHANNEL_CHOICES = [
        ('copy_link', 'Copy link'),
        ('unknown', 'Unknown'),
    ]

    resource = models.ForeignKey(Resource, related_name='share_events', on_delete=models.CASCADE)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='resource_share_events',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    channel = models.CharField(max_length=40, choices=CHANNEL_CHOICES, default='copy_link')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Share event for resource {self.resource.id} via {self.channel}"
