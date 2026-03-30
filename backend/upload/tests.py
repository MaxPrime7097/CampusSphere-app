from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory, force_authenticate

from users.models import User
from upload.views import upload_avatar, upload_cover_photo


class UploadFileFieldContractTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="uploader@example.com",
            username="uploader",
            first_name="Upload",
            last_name="Tester",
            password="strong-password-123",
        )
        self.factory = APIRequestFactory()

    def _make_test_image(self, name: str):
        return SimpleUploadedFile(
            name=name,
            content=b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00",
            content_type="image/png",
        )

    def test_avatar_upload_accepts_file_field(self):
        request = self.factory.post(
            f"/api/users/{self.user.id}/avatar/",
            {"file": self._make_test_image("avatar.png")},
            format="multipart",
        )
        force_authenticate(request, user=self.user)

        response = upload_avatar(request, user_id=self.user.id)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data.get("success"))
        self.assertIn("avatar_url", response.data["data"])

    def test_cover_upload_accepts_file_field(self):
        request = self.factory.post(
            f"/api/users/{self.user.id}/cover/",
            {"file": self._make_test_image("cover.png")},
            format="multipart",
        )
        force_authenticate(request, user=self.user)

        response = upload_cover_photo(request, user_id=self.user.id)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data.get("success"))
        self.assertIn("cover_photo_url", response.data["data"])
