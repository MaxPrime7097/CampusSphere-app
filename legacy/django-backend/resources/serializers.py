from rest_framework import serializers
from .models import Resource, ResourceFolder, ResourceSave, ResourceView
from .constants import ACCEPTED_RESOURCE_MIME_TYPES
from users.impact_policy import RESOURCE_UPLOADED, apply_impact_event

LEGACY_VISIBILITY_MAP = {'private': 'friends'}


def normalize_visibility(value):
    if isinstance(value, str):
        return LEGACY_VISIBILITY_MAP.get(value, value)
    return value


# ─────────────────────────────────────────────
# Folder serializers
# ─────────────────────────────────────────────

class ResourceFolderSerializer(serializers.ModelSerializer):
    resource_count = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = ResourceFolder
        fields = [
            'id', 'name', 'description', 'visibility',
            'resource_count', 'can_edit', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_resource_count(self, obj):
        return obj.resources.count()

    def get_can_edit(self, obj):
        request = self.context.get('request')
        return bool(request and request.user.is_authenticated and obj.owner == request.user)


class ResourceFolderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceFolder
        fields = ['name', 'description', 'visibility']

    def validate(self, attrs):
        request = self.context.get('request')
        if request:
            existing_count = ResourceFolder.objects.filter(owner=request.user).count()
            if existing_count >= 4:
                raise serializers.ValidationError(
                    "Vous avez atteint la limite de 4 dossiers."
                )
        return attrs

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class ResourceFolderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceFolder
        fields = ['name', 'description', 'visibility']


# ─────────────────────────────────────────────
# Resource serializers
# ─────────────────────────────────────────────

class ResourceSerializer(serializers.ModelSerializer):
    author_info = serializers.SerializerMethodField()
    file_info = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()
    sphere_id = serializers.SerializerMethodField()
    folder_id = serializers.SerializerMethodField()
    folder_info = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'description', 'author', 'author_info', 'file', 'file_info',
            'file_size', 'file_type', 'subject', 'type', 'visibility', 'audience',
            'sphere_id', 'folder_id', 'folder_info', 'tags', 'impact_score', 'stats',
            'is_saved', 'can_edit', 'can_delete',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'author', 'file_size', 'file_type', 'impact_score',
            'downloads_count', 'views_count', 'saves_count', 'created_at', 'updated_at'
        ]

    def get_sphere_id(self, obj):
        try:
            return obj.sphere_id
        except Exception:
            return None

    def get_folder_id(self, obj):
        return obj.folder_id

    def get_folder_info(self, obj):
        if not obj.folder_id:
            return None
        return {'id': obj.folder_id, 'name': obj.folder.name}

    def get_author_info(self, obj):
        from users.serializers import UserProfileSerializer
        return UserProfileSerializer(obj.author).data

    def get_file_info(self, obj):
        if not obj.file:
            return None
        request = self.context.get('request')
        try:
            url = request.build_absolute_uri(obj.file.url) if request else obj.file.url
        except Exception:
            url = None
        return {
            'id': str(obj.id),
            'name': obj.file.name.split('/')[-1],
            'url': url,
            'size': obj.file_size,
            'type': obj.file_type,
        }

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.saves.filter(user=request.user).exists()
        return False

    def get_can_edit(self, obj):
        request = self.context.get('request')
        return bool(request and request.user.is_authenticated and obj.author == request.user)

    def get_can_delete(self, obj):
        request = self.context.get('request')
        return bool(request and request.user.is_authenticated and obj.author == request.user)

    def get_stats(self, obj):
        return {
            'downloads': obj.downloads_count,
            'views': obj.views_count,
            'saves': obj.saves_count,
        }


class ResourceCreateSerializer(serializers.ModelSerializer):
    file = serializers.FileField()
    subject = serializers.CharField(default='other', required=False, allow_blank=True)
    visibility = serializers.CharField(default='public', required=False)
    audience = serializers.CharField(default='', required=False, allow_blank=True)
    sphere = serializers.IntegerField(required=False, allow_null=True)
    folder_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_visibility(self, value):
        return normalize_visibility(value)

    def validate_file(self, value):
        if value.size > 50 * 1024 * 1024:
            raise serializers.ValidationError("File size cannot exceed 50MB")
        if value.content_type not in ACCEPTED_RESOURCE_MIME_TYPES:
            raise serializers.ValidationError("File type not allowed.")
        return value

    def validate(self, attrs):
        folder_id = attrs.get('folder_id')
        if folder_id:
            try:
                folder = ResourceFolder.objects.get(pk=folder_id, owner=self.context['request'].user)
                if folder.resources.count() >= 20:
                    raise serializers.ValidationError(
                        {"folder_id": "Ce dossier a atteint la limite de 20 fichiers."}
                    )
            except ResourceFolder.DoesNotExist:
                raise serializers.ValidationError(
                    {"folder_id": "Dossier introuvable ou non autorisé."}
                )
        return attrs

    class Meta:
        model = Resource
        fields = ['title', 'description', 'file', 'subject', 'type', 'visibility',
                  'audience', 'sphere', 'folder_id', 'tags']

    def create(self, validated_data):
        file = validated_data['file']
        sphere_id = validated_data.pop('sphere', None)
        folder_id = validated_data.pop('folder_id', None)
        validated_data['author'] = self.context['request'].user
        validated_data['file_size'] = file.size
        validated_data['file_type'] = file.content_type
        if sphere_id:
            try:
                from spheres.models import Sphere
                validated_data['sphere'] = Sphere.objects.get(pk=sphere_id)
            except Exception:
                pass
        if folder_id:
            try:
                validated_data['folder'] = ResourceFolder.objects.get(
                    pk=folder_id, owner=validated_data['author']
                )
            except ResourceFolder.DoesNotExist:
                pass
        resource = super().create(validated_data)
        apply_impact_event(resource.author, RESOURCE_UPLOADED)
        return resource


class ResourceUpdateSerializer(serializers.ModelSerializer):
    folder_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_visibility(self, value):
        return normalize_visibility(value)

    def validate_folder_id(self, value):
        if value is None:
            return value
        request = self.context.get('request')
        try:
            folder = ResourceFolder.objects.get(pk=value, owner=request.user)
            # Check limit only if this resource isn't already in this folder
            instance = self.instance
            current_folder_id = instance.folder_id if instance else None
            if current_folder_id != value and folder.resources.count() >= 20:
                raise serializers.ValidationError("Ce dossier a atteint la limite de 20 fichiers.")
        except ResourceFolder.DoesNotExist:
            raise serializers.ValidationError("Dossier introuvable ou non autorisé.")
        return value

    class Meta:
        model = Resource
        fields = ['title', 'description', 'subject', 'type', 'visibility', 'audience',
                  'tags', 'folder_id']

    def update(self, instance, validated_data):
        folder_id = validated_data.pop('folder_id', 'UNSET')
        if folder_id != 'UNSET':
            if folder_id is None:
                instance.folder = None
            else:
                instance.folder_id = folder_id
        return super().update(instance, validated_data)


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
