import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory

from resources.models import Resource
from resources.serializers import ResourceCreateSerializer


User = get_user_model()


def build_payload(resource_type: str):
    return {
        "title": "Algorithmes avancés",
        "description": "Ressource de test pour la validation du type.",
        "subject": "informatique",
        "type": resource_type,
        "visibility": "public",
        "audience": "l3",
        "tags": ["algo", "python"],
        "file": SimpleUploadedFile("resource.pdf", b"pdf-bytes", content_type="application/pdf"),
    }


@pytest.mark.django_db
@pytest.mark.parametrize("resource_type", [choice for choice, _ in Resource.TYPE_CHOICES])
def test_resource_create_serializer_accepts_all_canonical_types(resource_type):
    user = User.objects.create_user(
        email=f"{resource_type}@example.com",
        username=f"user_{resource_type}",
        first_name="Type",
        last_name="Tester",
        password="testpass123",
    )
    request = RequestFactory().post("/api/resources/")
    request.user = user

    serializer = ResourceCreateSerializer(data=build_payload(resource_type), context={"request": request})

    assert serializer.is_valid(), serializer.errors


@pytest.mark.django_db
@pytest.mark.parametrize("legacy_type", ["summary", "slides"])
def test_resource_create_serializer_rejects_legacy_alias_types(legacy_type):
    user = User.objects.create_user(
        email=f"{legacy_type}@example.com",
        username=f"user_{legacy_type}",
        first_name="Legacy",
        last_name="Tester",
        password="testpass123",
    )
    request = RequestFactory().post("/api/resources/")
    request.user = user

    serializer = ResourceCreateSerializer(data=build_payload(legacy_type), context={"request": request})

    assert not serializer.is_valid()
    assert "type" in serializer.errors
