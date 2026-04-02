from django.db import models
from django.db.models import Q
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, username, first_name, last_name, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        if not username:
            raise ValueError('The Username field must be set')

        email = self.normalize_email(email)
        user = self.model(
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, first_name, last_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(email, username, first_name, last_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    MOOD_EXCITED = 'excited'
    MOOD_FOCUSED = 'focused'
    MOOD_COLLABORATING = 'collaborating'
    MOOD_LEARNING = 'learning'
    MOOD_INSPIRED = 'inspired'
    MOOD_DETERMINED = 'determined'

    CURRENT_MOOD_CHOICES = [
        (MOOD_EXCITED, 'Excited'),
        (MOOD_FOCUSED, 'Focused'),
        (MOOD_COLLABORATING, 'Collaborating'),
        (MOOD_LEARNING, 'Learning'),
        (MOOD_INSPIRED, 'Inspired'),
        (MOOD_DETERMINED, 'Determined'),
    ]

    PROFILE_VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('connections', 'Connections only'),
        ('private', 'Private'),
    ]

    POST_VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('connections', 'Connections only'),
        ('private', 'Private'),
    ]

    # Basic Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(unique=True)

    # Academic Information
    university = models.CharField(max_length=100, blank=True)
    faculty = models.CharField(max_length=100, blank=True)
    study_year = models.CharField(max_length=20, blank=True)
    student_id = models.CharField(max_length=50, blank=True)
    campus = models.CharField(max_length=100, blank=True)
    town = models.CharField(max_length=100, blank=True)

    # Profile Information
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    cover_photo = models.ImageField(upload_to='covers/', blank=True, null=True)
    language = models.CharField(max_length=10, default='fr')
    profile_visibility = models.CharField(max_length=20, choices=PROFILE_VISIBILITY_CHOICES, default='public')
    post_visibility = models.CharField(max_length=20, choices=POST_VISIBILITY_CHOICES, default='public')
    data_export_requested_at = models.DateTimeField(blank=True, null=True)

    # Impact and Mood
    impact_score = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    current_mood = models.CharField(
        max_length=50,
        default=MOOD_EXCITED,
        choices=CURRENT_MOOD_CHOICES,
    )

    # Skills and Interests
    skills = models.JSONField(default=list, blank=True)
    interests = models.JSONField(default=list, blank=True)

    # Previous Education
    previous_education = models.JSONField(default=list, blank=True)

    # Experiences
    experiences = models.JSONField(default=list, blank=True)

    # Portfolio Links
    portfolio_links = models.JSONField(default=list, blank=True)

    # Django fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.username})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def get_joined_spheres_count(self):
        return self.sphere_memberships.filter(status='active').count()

    def get_connections_count(self):
        """
        Business rule: only accepted connections are counted.
        """
        return Connection.objects.filter(
            Q(requester=self) | Q(recipient=self),
            status='accepted'
        ).count()


class Connection(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('blocked', 'Blocked'),
    ]

    requester = models.ForeignKey(User, related_name='sent_connections', on_delete=models.CASCADE)
    recipient = models.ForeignKey(User, related_name='received_connections', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['requester', 'recipient']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.requester.username} -> {self.recipient.username} ({self.status})"


class UserBlock(models.Model):
    blocker = models.ForeignKey(User, related_name='initiated_blocks', on_delete=models.CASCADE)
    blocked = models.ForeignKey(User, related_name='received_blocks', on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['blocker', 'blocked']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"

class AdminAuditLog(models.Model):
    actor = models.ForeignKey(
        User,
        related_name='admin_audit_logs',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    action = models.CharField(max_length=50)
    target_type = models.CharField(max_length=100)
    target_id = models.CharField(max_length=100, blank=True)
    payload_diff = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['action']),
            models.Index(fields=['target_type']),
        ]

    def __str__(self):
        actor_label = self.actor.username if self.actor else 'unknown'
        return f"{self.action} by {actor_label} on {self.target_type}:{self.target_id}"

