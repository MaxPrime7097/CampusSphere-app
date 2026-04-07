from types import SimpleNamespace
from unittest.mock import patch

from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User


@override_settings(SUPABASE_URL="https://example.supabase.co", SUPABASE_ANON_KEY="anon-test-key")
class SupabaseTokenExchangeTests(APITestCase):
    def setUp(self):
        self.url = reverse("users:supabase-token-exchange")
        if not self.url.endswith("/"):
            self.url = f"{self.url}/"

    @staticmethod
    def _supabase_payload(*, uid: str, email: str, metadata=None, identities=None):
        return SimpleNamespace(
            user=SimpleNamespace(
                id=uid,
                email=email,
                user_metadata=metadata or {},
                identities=identities or [],
            )
        )

    @patch("supabase.create_client")
    def test_new_oauth_user_requires_profile_completion(self, mock_create_client):
        mock_create_client.return_value.auth.get_user.return_value = self._supabase_payload(
            uid="google-uid-1",
            email="google-new@example.com",
            metadata={"first_name": "Google", "last_name": "User"},
            identities=[{"provider": "google"}],
        )

        response = self.client.post(self.url, {"access_token": "supabase-token"}, format="json", secure=True)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["data"]["needs_profile_completion"])

    @patch("supabase.create_client")
    def test_existing_incomplete_user_still_requires_profile_completion(self, mock_create_client):
        user = User.objects.create_user(
            email="google-existing@example.com",
            username="google-existing",
            first_name="Existing",
            last_name="User",
            password="irrelevant-password",
            supabase_uid="google-uid-2",
            university="",
            faculty="",
            study_year="",
            student_id="",
            is_profile_complete=True,
        )

        mock_create_client.return_value.auth.get_user.return_value = self._supabase_payload(
            uid=user.supabase_uid,
            email=user.email,
            metadata={"first_name": user.first_name, "last_name": user.last_name},
            identities=[{"provider": "google"}],
        )

        response = self.client.post(self.url, {"access_token": "supabase-token"}, format="json", secure=True)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["data"]["needs_profile_completion"])

        user.refresh_from_db()
        self.assertFalse(user.is_profile_complete)
