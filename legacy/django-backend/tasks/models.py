from django.db import models
from django.conf import settings
from django.utils import timezone


class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Basse'),
        ('medium', 'Moyenne'),
        ('high', 'Haute'),
    ]

    KANBAN_STATUS_CHOICES = [
        ('todo', 'À faire'),
        ('in_progress', 'En cours'),
        ('review', 'En révision'),
        ('done', 'Terminé'),
    ]

    # Basic Information
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    # Assignment
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='assigned_tasks',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    # Settings
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    due_date = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    kanban_status = models.CharField(max_length=20, choices=KANBAN_STATUS_CHOICES, default='todo')
    impact_points = models.IntegerField(default=5)

    # Relations
    sphere = models.ForeignKey('spheres.Sphere', related_name='tasks', on_delete=models.CASCADE)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='created_tasks', on_delete=models.CASCADE)

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_completed', 'due_date', '-priority', '-created_at']

    def __str__(self):
        return self.title

    def complete(self):
        """Mark task as completed and return impact points earned"""
        if not self.is_completed:
            self.is_completed = True
            self.kanban_status = 'done'
            self.save(update_fields=['is_completed', 'kanban_status', 'updated_at'])
            return self.impact_points
        return 0

    def is_overdue(self):
        if self.due_date and not self.is_completed:
            return timezone.now() > self.due_date
        return False

    @property
    def status(self):
        if self.is_completed:
            return 'completed'
        elif self.is_overdue():
            return 'overdue'
        else:
            return 'pending'
