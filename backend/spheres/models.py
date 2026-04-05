from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class Sphere(models.Model):
    CATEGORY_CHOICES = [
        ('academic', 'Académique'),
        ('professional', 'Professionnel'),
        ('social', 'Social'),
        ('sports', 'Sports'),
        ('arts', 'Arts'),
        ('technology', 'Technologie'),
        ('other', 'Autre'),
    ]

    TYPE_CHOICES = [
        ('study', 'Étude'),
        ('project', 'Projet'),
        ('club', 'Club'),
        ('event', 'Événement'),
        ('networking', 'Réseautage'),
        ('other', 'Autre'),
    ]

    # Basic Information
    name = models.CharField(max_length=100)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    color = models.CharField(max_length=20, default='#10b981')
    icon = models.CharField(max_length=50, default='users')
    banner_image = models.ImageField(upload_to='spheres/banners/', null=True, blank=True)

    # Settings
    is_private = models.BooleanField(default=False)
    require_approval = models.BooleanField(default=False)

    # Additional Information
    objective = models.TextField(blank=True)
    target_audience = models.CharField(max_length=200, blank=True)
    duration = models.CharField(max_length=50, default='permanent')
    expires_at = models.DateTimeField(null=True, blank=True)
    auto_delete_on_expiry = models.BooleanField(default=False)
    collaboration_types = models.JSONField(default=list, blank=True)

    # Statistics
    member_count = models.IntegerField(default=0)
    impact_score = models.IntegerField(default=0)

    # Relations
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def is_expired(self):
        return bool(self.expires_at and self.expires_at <= timezone.now())

    @staticmethod
    def compute_expiry_from_duration(duration, from_datetime=None):
        if not duration:
            return None

        normalized = str(duration).strip().lower()
        start_at = from_datetime or timezone.now()

        # Common app values (FR/EN)
        mappings = [
            (('court terme', '1-3 mois', 'short term'), timedelta(days=90)),
            (('moyen terme', '3-6 mois', 'medium term'), timedelta(days=180)),
            (('long terme', '6-12 mois', 'long term'), timedelta(days=365)),
            (('1 semaine', 'week'), timedelta(days=7)),
            (('1 mois', 'month'), timedelta(days=30)),
            (('3 mois',), timedelta(days=90)),
            (('6 mois',), timedelta(days=180)),
            (('12 mois', '1 an', '1 year'), timedelta(days=365)),
        ]

        for keywords, delta in mappings:
            if any(keyword in normalized for keyword in keywords):
                return start_at + delta

        if any(token in normalized for token in ('permanent', 'flexible', 'illimité', 'illimite', 'none')):
            return None

        return None

    def get_active_members_count(self):
        return self.members.filter(status='active').count()

    def update_member_count(self):
        self.member_count = self.get_active_members_count()
        self.save(update_fields=['member_count'])


class SphereMember(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('moderator', 'Modérateur'),
        ('member', 'Membre'),
    ]

    STATUS_CHOICES = [
        ('active', 'Actif'),
        ('pending', 'En attente'),
        ('inactive', 'Inactif'),
        ('banned', 'Banni'),
    ]

    sphere = models.ForeignKey(Sphere, related_name='members', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sphere_memberships', on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    joined_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['sphere', 'user']
        ordering = ['-joined_at']

    def __str__(self):
        return f"{self.user.username} in {self.sphere.name} ({self.role})"

    def is_admin(self):
        return self.role == 'admin'

    def is_moderator(self):
        return self.role in ['admin', 'moderator']

    def can_manage_members(self):
        return self.is_moderator()

    def can_manage_content(self):
        return self.is_moderator()

    def can_delete_sphere(self):
        return self.is_admin()
