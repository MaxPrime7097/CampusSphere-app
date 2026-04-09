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


class SupabaseProfileCompletionValidationTests(APITestCase):
    def setUp(self):
        self.url = reverse("users:supabase-complete-profile")
        if not self.url.endswith("/"):
            self.url = f"{self.url}/"
        self.user = User.objects.create_user(
            email="supabase-profile@example.com",
            username="supabase-temp",
            first_name="Supabase",
            last_name="User",
            password="irrelevant-password",
            supabase_uid="supabase-profile-uid",
            is_profile_complete=False,
        )
        self.client.force_authenticate(user=self.user)
        self.valid_payload = {
            "username": "student.valid",
            "university": "Université de Douala",
            "faculty": "Informatique",
            "study_year": "L3",
            "student_id": "STU-2026-001",
            "language": "fr",
            "phone_number": "+237 699 11 22 33",
            "previous_education": [
                {"school": "Lycée Leclerc", "year": "2021", "degree": "Baccalauréat"}
            ],
            "experiences": [
                {"company": "Campus Labs", "role": "Stagiaire backend", "duration": "3 mois"}
            ],
            "portfolio_links": [
                {"url": "https://portfolio.example.com", "label": "Portfolio"}
            ],
        }

    def test_profile_completion_rejects_invalid_scalar_formats(self):
        payload = {
            **self.valid_payload,
            "phone_number": "abc###",
            "language": "french",
            "student_id": "!!",
            "study_year": "@@@",
            "username": "x",
        }

        response = self.client.post(self.url, payload, format="json", secure=True)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone_number", response.data)
        self.assertIn("language", response.data)
        self.assertIn("student_id", response.data)
        self.assertIn("study_year", response.data)
        self.assertIn("username", response.data)

    def test_profile_completion_rejects_invalid_json_structures(self):
        payload = {
            **self.valid_payload,
            "previous_education": [{"school": "Lycée A"}],
            "experiences": ["not-an-object"],
            "portfolio_links": [{"url": "invalid-url"}],
        }

        response = self.client.post(self.url, payload, format="json", secure=True)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("previous_education", response.data)
        self.assertIn("experiences", response.data)
        self.assertIn("portfolio_links", response.data)

    def test_profile_completion_rejects_oversized_json_payloads(self):
        oversized_previous_education = [{"school": "Lycée", "year": "2020"}] * 11
        too_long_label = "x" * 260
        payload = {
            **self.valid_payload,
            "previous_education": oversized_previous_education,
            "portfolio_links": [{"url": "https://portfolio.example.com", "label": too_long_label}],
        }

        response = self.client.post(self.url, payload, format="json", secure=True)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("previous_education", response.data)
        self.assertIn("portfolio_links", response.data)
