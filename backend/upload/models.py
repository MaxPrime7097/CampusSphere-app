from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


class UploadedFile(models.Model):
    TYPE_CHOICES = [
        ('avatar', 'Avatar'),
        ('cover', 'Cover Photo'),
        ('post', 'Post Attachment'),
        ('resource', 'Resource File'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to='uploads/%Y/%m/%d/')
    original_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    file_size = models.IntegerField()
    upload_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    
    # Relations
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # Metadata
    is_processed = models.BooleanField(default=False)
    is_public = models.BooleanField(default=False)
    
    # Timestamps
    uploaded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.original_name} ({self.upload_type})"

    @property
    def file_url(self):
        return self.file.url if self.file else None

    @property
    def file_extension(self):
        return self.original_name.split('.')[-1].lower() if '.' in self.original_name else ''

    def is_image(self):
        image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
        return self.file_extension in image_extensions

    def is_document(self):
        document_extensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'rtf']
        return self.file_extension in document_extensions

    def is_archive(self):
        archive_extensions = ['zip', 'rar', '7z', 'tar', 'gz']
        return self.file_extension in archive_extensions
