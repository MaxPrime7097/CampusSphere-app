from django.db import models
from django.conf import settings
from django.utils import timezone


class Post(models.Model):
    # Backend/API contract values for post visibility.
    # Frontend UI labels must map to these exact persisted values.
    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('sphere', 'Sphère uniquement'),
        ('friends', 'Amis uniquement'),
    ]

    CATEGORY_CHOICES = [
        ('general', 'Général'),
        ('academic', 'Académique'),
        ('event', 'Événement'),
        ('marketplace', 'Marketplace'),
        ('help', 'Aide'),
        ('announcement', 'Annonce'),
    ]

    TYPE_CHOICES = [
        ('text', 'Texte'),
        ('cours', 'Cours'),
        ('td_tp', 'TD/TP'),
        ('exam', 'Examen'),
        ('project', 'Projet'),
        ('resource', 'Ressource'),
        ('other', 'Autre'),
    ]

    # Content
    content = models.TextField()
    author = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='posts', on_delete=models.CASCADE)

    # Sphere relation (optional for public posts)
    sphere = models.ForeignKey('spheres.Sphere', related_name='posts', on_delete=models.CASCADE, null=True, blank=True)

    # Metadata
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='public')
    subject = models.CharField(max_length=100, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='text')
    audience = models.CharField(max_length=200, blank=True)
    location = models.CharField(max_length=200, blank=True)

    # Tags and files
    tags = models.JSONField(default=list, blank=True)
    files = models.JSONField(default=list, blank=True)

    # Settings
    allow_comments = models.BooleanField(default=True)
    is_pinned = models.BooleanField(default=False)

    # Statistics
    likes_count = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    impact_score = models.IntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return f"Post by {self.author.username}: {self.content[:50]}..."

    def get_likes_count(self):
        return self.likes.count()

    def get_comments_count(self):
        return self.comments.count()

    def update_counts(self):
        self.likes_count = self.get_likes_count()
        self.comments_count = self.get_comments_count()
        self.save(update_fields=['likes_count', 'comments_count'])

    def recompute_impact_score(self):
        # Product rule: post impact score is the sum of all explicit user impact ratings
        self.impact_score = sum(self.impact_ratings.values_list('value', flat=True))
        self.save(update_fields=['impact_score'])


class PostLike(models.Model):
    post = models.ForeignKey(Post, related_name='likes', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='post_likes', on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['post', 'user']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} liked {self.post.id}"


class PostSave(models.Model):
    post = models.ForeignKey(Post, related_name='saves', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='saved_posts', on_delete=models.CASCADE)
    saved_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['post', 'user']
        ordering = ['-saved_at']

    def __str__(self):
        return f"{self.user.username} saved post {self.post.id}"


class PostImpactRating(models.Model):
    post = models.ForeignKey(Post, related_name='impact_ratings', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='post_impact_ratings', on_delete=models.CASCADE)
    value = models.IntegerField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['post', 'user']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} rated impact {self.value} on post {self.post.id}"


class Comment(models.Model):
    content = models.TextField()
    post = models.ForeignKey(Post, related_name='comments', on_delete=models.CASCADE)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='comments', on_delete=models.CASCADE)
    parent = models.ForeignKey('self', related_name='replies', on_delete=models.CASCADE, null=True, blank=True)

    # Statistics
    likes_count = models.IntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.username}: {self.content[:50]}..."

    def get_likes_count(self):
        return self.likes.count()

    def update_counts(self):
        self.likes_count = self.get_likes_count()
        self.save(update_fields=['likes_count'])

    @property
    def is_reply(self):
        return self.parent is not None

    def get_replies(self):
        return self.replies.all()


class CommentLike(models.Model):
    comment = models.ForeignKey(Comment, related_name='likes', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='comment_likes', on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['comment', 'user']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} liked comment {self.comment.id}"


class PostReport(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('dismissed', 'Dismissed'),
        ('action_taken', 'Action Taken'),
    ]

    post = models.ForeignKey(Post, related_name='reports', on_delete=models.CASCADE)
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='post_reports', on_delete=models.CASCADE)
    reason = models.CharField(max_length=120)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['post', 'reporter']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reporter.username} reported post {self.post.id} ({self.reason})"
