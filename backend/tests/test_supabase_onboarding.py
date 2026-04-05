from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class SupabaseOnboardingTests(APITestCase):
    def setUp(self):
        self.exchange_url = reverse('supabase-exchange')
        self.complete_profile_url = reverse('supabase-complete-profile')
        self.supabase_uid = 'supabase-user-123'
        self.email = 'oauth-user@example.com'
        self.base_payload = {
            'sub': self.supabase_uid,
            'email': self.email,
            'user_metadata': {
                'first_name': 'OAuth',
                'last_name': 'User',
                'username': 'oauthuser',
            }
        }

    def _exchange_and_authenticate(self):
        with patch('campus_sphere.supabase_views._decode_token_unverified', return_value=self.base_payload), \
             patch('campus_sphere.supabase_views.verify_supabase_token', return_value=self.base_payload):
            response = self.client.post(self.exchange_url, {'supabase_token': 'fake-token'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        access_token = response.data['data']['tokens']['accessToken']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        return response

    def test_oauth_user_created_as_not_fully_onboarded(self):
        response = self._exchange_and_authenticate()

        created_user = User.objects.get(email=self.email)
        self.assertFalse(created_user.profile_completed)
        self.assertFalse(created_user.is_fully_onboarded)
        self.assertFalse(response.data['data']['user']['profile_completed'])
        self.assertFalse(response.data['data']['user']['is_fully_onboarded'])

    def test_complete_profile_rejects_missing_required_onboarding_fields(self):
        self._exchange_and_authenticate()
        response = self.client.post(
            self.complete_profile_url,
            {'university': 'Université de Douala', 'faculty': 'Informatique', 'study_year': 'L3'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('student_id', response.data['errors'])

        user = User.objects.get(email=self.email)
        self.assertFalse(user.profile_completed)
        self.assertFalse(user.is_fully_onboarded)

    def test_complete_profile_marks_user_as_fully_onboarded_when_required_fields_present(self):
        self._exchange_and_authenticate()
        payload = {
            'university': 'Université de Douala',
            'faculty': 'Informatique',
            'study_year': 'L3',
            'student_id': '2021001234',
            'campus': 'Campus Principal',
        }
        response = self.client.post(self.complete_profile_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['data']['profile_completed'])
        self.assertTrue(response.data['data']['is_fully_onboarded'])

        user = User.objects.get(email=self.email)
        self.assertTrue(user.profile_completed)
        self.assertTrue(user.is_fully_onboarded)
