from rest_framework import serializers
from django.utils import timezone
from .models import Resource, ResourceSave, ResourceView
from .constants import ACCEPTED_RESOURCE_MIME_TYPES
from users.impact_policy import RESOURCE_UPLOADED, apply_impact_event


class ResourceSerializer(serializers.ModelSerializer):
    author_info = serializers.SerializerMethodField()
    file_info = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'description', 'author', 'author_info', 'file', 'file_info',
            'file_size', 'file_type', 'subject', 'type', 'visibility', 'audience',
            'tags', 'impact_score', 'stats', 'is_saved', 'can_edit', 'can_delete',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'author', 'file_size', 'file_type', 'impact_score',
            'downloads_count', 'views_count', 'saves_count', 'created_at', 'updated_at'
        ]

    def get_author_info(self, obj):
        from users.serializers import UserProfileSerializer
        return UserProfileSerializer(obj.author).data

    def get_file_info(self, obj):
        if obj.file:
            return {
                'id': str(obj.id),
                'name': obj.file.name.split('/')[-1],
                'url': obj.file.url if obj.file else None,
                'size': obj.file_size,
                'type': obj.file_type
            }
        return None

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.saves.filter(user=request.user).exists()
        return False

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.author == request.user
        return False

    def get_can_delete(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.author == request.user
        return False

    def get_stats(self, obj):
        return {
            'downloads': obj.downloads_count,
            'views': obj.views_count,
            'saves': obj.saves_count
        }


class ResourceCreateSerializer(serializers.ModelSerializer):
    file = serializers.FileField()

    class Meta:
        model = Resource
        fields = [
            'title', 'description', 'file', 'subject', 'type', 'visibility',
            'audience', 'tags'
        ]

    def validate_file(self, value):
        # File size validation (50MB max)
        max_size = 50 * 1024 * 1024  # 50MB
        if value.size > max_size:
            raise serializers.ValidationError("File size cannot exceed 50MB")

        # File type validation
        if value.content_type not in ACCEPTED_RESOURCE_MIME_TYPES:
            raise serializers.ValidationError(
                "File type not allowed. Supported types: PDF, DOC, DOCX, PPT, PPTX, ZIP, JPG, PNG, GIF"
            )

        return value

    def create(self, validated_data):
        file = validated_data['file']
        validated_data['author'] = self.context['request'].user
        validated_data['file_size'] = file.size
        validated_data['file_type'] = file.content_type
        
        resource = super().create(validated_data)
        
        # Apply impact for uploading a resource.
        apply_impact_event(resource.author, RESOURCE_UPLOADED)
        
        return resource


class ResourceUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = [
            'title', 'description', 'subject', 'type', 'visibility',
            'audience', 'tags'
        ]


class ResourceSaveSerializer(serializers.ModelSerializer):
    resource_info = serializers.SerializerMethodField()

    class Meta:
        model = ResourceSave
        fields = ['id', 'resource', 'resource_info', 'saved_at']
        read_only_fields = ['id', 'saved_at']

    def get_resource_info(self, obj):
        return ResourceSerializer(obj.resource, context=self.context).data


class ResourceViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceView
        fields = ['id', 'resource', 'user', 'viewed_at']
        read_only_fields = ['id', 'user', 'viewed_at']