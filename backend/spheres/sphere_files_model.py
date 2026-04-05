from django.db import models
from django.conf import settings
from django.utils import timezone


class SphereFile(models.Model):
    sphere = models.ForeignKey(
        'spheres.Sphere',
        related_name='files',
        on_delete=models.CASCADE
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='sphere_files',
        on_delete=models.CASCADE
    )
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='spheres/files/')
    file_size = models.IntegerField(default=0)
    file_type = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.sphere.name})"
