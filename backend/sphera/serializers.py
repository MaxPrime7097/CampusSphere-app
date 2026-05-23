from rest_framework import serializers
from .models import StudySession, AnnaleSession


# ---------------------------------------------------------------------------
# StudySession — V1 + Q&A
# ---------------------------------------------------------------------------

class StudySessionSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    resource_title = serializers.SerializerMethodField()
    sphere_name = serializers.SerializerMethodField()
    has_qa = serializers.SerializerMethodField()

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
            "qa_history",
            "has_qa",
            "is_shared",
            "shared_in_sphere",
            "sphere_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]
        extra_kwargs = {
            # extracted_text exclu des réponses API (trop volumineux)
            "extracted_text": {"write_only": True},
        }

    def get_resource_title(self, obj):
        if obj.resource:
            return obj.resource.title
        return obj.source_filename or ""

    def get_sphere_name(self, obj):
        if obj.shared_in_sphere:
            return obj.shared_in_sphere.name
        return None

    def get_has_qa(self, obj):
        return bool(obj.extracted_text)


class StudySessionListSerializer(serializers.ModelSerializer):
    """Sérialiseur allégé pour la liste (sans contenu JSON complet ni qa_history)."""

    resource_title = serializers.SerializerMethodField()
    sphere_name = serializers.SerializerMethodField()
    content_preview = serializers.SerializerMethodField()
    has_qa = serializers.SerializerMethodField()

    class Meta:
        model = StudySession
        fields = [
            "id",
            "resource",
            "resource_title",
            "source_filename",
            "tool_types",
            "content_preview",
            "has_qa",
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
        """Retourne le titre du premier outil disponible."""
        if isinstance(obj.content, dict):
            for key in obj.content:
                tool_content = obj.content[key]
                if isinstance(tool_content, dict) and "titre" in tool_content:
                    return tool_content.get("titre", "")
        return ""

    def get_has_qa(self, obj):
        """True si le texte extrait est disponible pour le Q&A."""
        return bool(obj.extracted_text)


# ---------------------------------------------------------------------------
# AnnaleSession — V2
# ---------------------------------------------------------------------------

class AnnaleSessionSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    sphere_name = serializers.SerializerMethodField()
    source_title = serializers.SerializerMethodField()
    cours_title = serializers.SerializerMethodField()

    class Meta:
        model = AnnaleSession
        fields = [
            "id",
            "owner",
            "owner_username",
            "mode",
            "source_filename",
            "resource",
            "source_title",
            "cours_resource",
            "cours_title",
            "content",
            "is_shared",
            "shared_in_sphere",
            "sphere_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]

    def get_sphere_name(self, obj):
        if obj.shared_in_sphere:
            return obj.shared_in_sphere.name
        return None

    def get_source_title(self, obj):
        if obj.resource:
            return obj.resource.title
        return obj.source_filename or "Annale"

    def get_cours_title(self, obj):
        if obj.cours_resource:
            return obj.cours_resource.title
        return None


class AnnaleSessionListSerializer(serializers.ModelSerializer):
    """Version allégée pour la liste des annales (sans le contenu complet)."""

    source_title = serializers.SerializerMethodField()
    sphere_name = serializers.SerializerMethodField()
    corrections_count = serializers.SerializerMethodField()

    class Meta:
        model = AnnaleSession
        fields = [
            "id",
            "mode",
            "source_filename",
            "resource",
            "source_title",
            "corrections_count",
            "is_shared",
            "shared_in_sphere",
            "sphere_name",
            "created_at",
        ]

    def get_source_title(self, obj):
        if obj.resource:
            return obj.resource.title
        return obj.source_filename or "Annale"

    def get_sphere_name(self, obj):
        if obj.shared_in_sphere:
            return obj.shared_in_sphere.name
        return None

    def get_corrections_count(self, obj):
        """Nombre de questions corrigées."""
        if isinstance(obj.content, dict):
            corrections = obj.content.get("corrections", [])
            return len(corrections)
        return 0
