from rest_framework import serializers
from .models import StudySession


class StudySessionSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    resource_title = serializers.SerializerMethodField()
    sphere_name = serializers.SerializerMethodField()

    class Meta:
        model = StudySession
        fields = [
            "id",
            "owner",
            "owner_username",
            "resource",
            "resource_title",
            "source_filename",
            "tool_types",
            "content",
            "is_shared",
            "shared_in_sphere",
            "sphere_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]

    def get_resource_title(self, obj):
        if obj.resource:
            return obj.resource.title
        return obj.source_filename or ""

    def get_sphere_name(self, obj):
        if obj.shared_in_sphere:
            return obj.shared_in_sphere.name
        return None


class StudySessionListSerializer(serializers.ModelSerializer):
    """Sérialiseur allégé pour la liste (sans le contenu JSON complet)."""

    resource_title = serializers.SerializerMethodField()
    sphere_name = serializers.SerializerMethodField()
    content_preview = serializers.SerializerMethodField()

    class Meta:
        model = StudySession
        fields = [
            "id",
            "resource",
            "resource_title",
            "source_filename",
            "tool_types",
            "content_preview",
            "is_shared",
            "shared_in_sphere",
            "sphere_name",
            "created_at",
        ]

    def get_resource_title(self, obj):
        if obj.resource:
            return obj.resource.title
        return obj.source_filename or "Document personnel"

    def get_sphere_name(self, obj):
        if obj.shared_in_sphere:
            return obj.shared_in_sphere.name
        return None

    def get_content_preview(self, obj):
        """Retourne juste le titre du contenu généré pour l'aperçu, en prenant le premier outil disponible."""
        if isinstance(obj.content, dict):
            # Prendre le titre du premier outil disponible
            for key in obj.content:
                tool_content = obj.content[key]
                if isinstance(tool_content, dict) and "titre" in tool_content:
                    return tool_content.get("titre", "")
        return ""
