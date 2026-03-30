from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework import serializers

from resources.constants import ACCEPTED_RESOURCE_MIME_TYPES
from resources.serializers import ResourceCreateSerializer


class ResourceCreateSerializerFileValidationTests(TestCase):
    def setUp(self):
        self.serializer = ResourceCreateSerializer()

    def _build_upload(self, content_type: str) -> SimpleUploadedFile:
        return SimpleUploadedFile(
            name=f"sample-{content_type.replace('/', '-')}.bin",
            content=b"file-bytes",
            content_type=content_type,
        )

    def test_validate_file_accepts_each_allowed_mime_type(self):
        for content_type in ACCEPTED_RESOURCE_MIME_TYPES:
            with self.subTest(content_type=content_type):
                upload = self._build_upload(content_type)
                validated_file = self.serializer.validate_file(upload)
                self.assertEqual(validated_file.content_type, content_type)

    def test_validate_file_rejects_disallowed_mime_types(self):
        rejected_types = [
            "text/plain",
            "application/vnd.ms-excel",
            "application/x-rar-compressed",
            "image/webp",
            "application/octet-stream",
        ]

        for content_type in rejected_types:
            with self.subTest(content_type=content_type):
                upload = self._build_upload(content_type)
                with self.assertRaises(serializers.ValidationError):
                    self.serializer.validate_file(upload)

    def test_validate_file_rejects_too_large_file(self):
        upload = SimpleUploadedFile(
            name="large.pdf",
            content=b"0" * (50 * 1024 * 1024 + 1),
            content_type="application/pdf",
        )

        with self.assertRaises(serializers.ValidationError):
            self.serializer.validate_file(upload)
