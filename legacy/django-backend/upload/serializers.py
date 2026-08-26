from rest_framework import serializers
from .models import UploadedFile


class FileUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField()
    type = serializers.ChoiceField(choices=UploadedFile.TYPE_CHOICES, write_only=True)

    class Meta:
        model = UploadedFile
        fields = ['file', 'type']

    def validate_file(self, value):
        upload_type = self.initial_data.get('type')
        
        # File size validation based on type
        if upload_type == 'avatar':
            max_size = 5 * 1024 * 1024  # 5MB for avatars
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        elif upload_type == 'cover':
            max_size = 10 * 1024 * 1024  # 10MB for cover photos
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        elif upload_type == 'resource':
            max_size = 50 * 1024 * 1024  # 50MB for resources
            allowed_types = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/zip',
                'image/jpeg',
                'image/png',
                'image/gif'
            ]
        elif upload_type == 'post':
            max_size = 25 * 1024 * 1024  # 25MB for post attachments
            allowed_types = [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'video/mp4', 'video/webm',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]
        else:
            max_size = 10 * 1024 * 1024  # 10MB default
            allowed_types = ['image/jpeg', 'image/png', 'image/gif']

        # Check file size
        if value.size > max_size:
            max_size_mb = max_size / (1024 * 1024)
            raise serializers.ValidationError(f"File size cannot exceed {max_size_mb}MB")

        # Check file type
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                f"File type '{value.content_type}' not allowed for {upload_type} uploads"
            )

        return value

    def create(self, validated_data):
        file = validated_data['file']
        upload_type = validated_data.pop('type')
        
        uploaded_file = UploadedFile.objects.create(
            file=file,
            original_name=file.name,
            file_type=file.content_type,
            file_size=file.size,
            upload_type=upload_type,
            uploaded_by=self.context['request'].user
        )
        
        return uploaded_file


class UploadedFileSerializer(serializers.ModelSerializer):
    file_url = serializers.CharField(read_only=True)
    file_extension = serializers.CharField(read_only=True)
    is_image = serializers.BooleanField(read_only=True)
    is_document = serializers.BooleanField(read_only=True)
    is_archive = serializers.BooleanField(read_only=True)

    class Meta:
        model = UploadedFile
        fields = [
            'id', 'file', 'file_url', 'original_name', 'file_type', 'file_size',
            'upload_type', 'uploaded_by', 'is_processed', 'is_public',
            'file_extension', 'is_image', 'is_document', 'is_archive',
            'uploaded_at'
        ]
        read_only_fields = [
            'id', 'file_type', 'file_size', 'uploaded_by', 'is_processed',
            'uploaded_at'
        ]