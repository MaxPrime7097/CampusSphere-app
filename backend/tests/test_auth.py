import pytest
from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
from django.core.cache import cache
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from users.models import User

User = get_user_model()


class InMemoryCacheService:
    def __init__(self):
        self._store = {}

    def get(self, key):
        return self._store.get(key)

    def set(self, key, value, timeout=None):
        self._store[key] = value
        return True

    def delete(self, key):
        return self._store.pop(key, None) is not None

    def delete_pattern(self, pattern):
        if pattern.endswith('*'):
            prefix = pattern[:-1]
            keys_to_delete = [key for key in self._store if key.startswith(prefix)]
        else:
            keys_to_delete = [pattern] if pattern in self._store else []
        for key in keys_to_delete:
            self._store.pop(key, None)
        return len(keys_to_delete)


class AuthTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('users:register')
        self.login_url = reverse('users:login')
        self.password_reset_url = reverse('users:password-reset')
        self.check_availability_url = reverse('users:check-availability')
        self.me_url = reverse('users:current-user')

        self.user_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'username': 'johndoe',
            'email': 'john@example.com',
            'password': 'password123',
            'confirm_password': 'password123',
            'university': 'douala',
            'faculty': 'informatique',
            'study_year': 'l3',
            'student_id': '2021001234',
            'campus': 'Campus Principal',
            'town': 'douala',
            'language': 'fr'
        }

    def _assert_throttle_after_five_requests(self, url, payload):
        cache.clear()

        for _ in range(5):
            response = self.client.post(url, payload, format='json')
            self.assertNotEqual(
                response.status_code,
                status.HTTP_429_TOO_MANY_REQUESTS,
                msg=f"{url} returned 429 before reaching the 6th request",
            )

        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_auth_endpoints_are_throttled_after_five_requests_per_minute(self):
        endpoints = [
            (self.register_url, self.user_data),
            (self.login_url, {'email': 'john@example.com', 'password': 'wrongpassword'}),
            (self.password_reset_url, {'email': 'john@example.com'}),
        ]

        for url, payload in endpoints:
            with self.subTest(url=url):
                self._assert_throttle_after_five_requests(url, payload)

    def test_user_registration(self):
        """Test user registration"""
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('user', response.data['data'])
        self.assertIn('tokens', response.data['data'])

        # Check user was created
        user = User.objects.get(email='john@example.com')
        self.assertEqual(user.first_name, 'John')
        self.assertEqual(user.username, 'johndoe')

    def test_user_login(self):
        """Test user login"""
        # First register user
        self.client.post(self.register_url, self.user_data, format='json')

        # Then login
        login_data = {
            'email': 'john@example.com',
            'password': 'password123'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('user', response.data['data'])
        self.assertIn('tokens', response.data['data'])

    @patch('campus_sphere.supabase_views._decode_token_unverified')
    @patch('campus_sphere.supabase_views.verify_supabase_token')
    def test_existing_user_with_complete_profile_does_not_require_profile_completion(self, mock_verify, mock_decode):
        user = User.objects.create_user(
            email='google-existing@example.com',
            username='googleexisting',
            first_name='Google',
            last_name='User',
            password='password123',
            university='Université Test',
            faculty='Informatique',
            study_year='L3',
            student_id='STU-123456',
            is_profile_complete=False,
        )

        payload = {
            'sub': 'google-uid-2',
            'email': user.email,
            'user_metadata': {'first_name': user.first_name, 'last_name': user.last_name},
        }
        mock_decode.return_value = payload
        mock_verify.return_value = payload

        url = reverse('supabase-exchange')
        response = self.client.post(url, {'access_token': 'dummy-token'}, format='json', secure=True)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['data']['needs_profile_completion'])

        user.refresh_from_db()
        self.assertEqual(user.supabase_uid, 'google-uid-2')
        self.assertTrue(user.is_profile_complete)

    def test_invalid_login(self):
        """Test invalid login credentials"""
        login_data = {
            'email': 'nonexistent@example.com',
            'password': 'wrongpassword'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_check_availability_endpoint(self):
        User.objects.create_user(
            email='taken@example.com',
            username='takenusername',
            password='password123',
            is_profile_complete=True,
        )
        response = self.client.post(
            self.check_availability_url,
            {'email': 'taken@example.com', 'username': 'takenusername'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['data']['email_available'])
        self.assertFalse(response.data['data']['username_available'])

    def test_get_current_user_profile(self):
        """Test getting current user profile"""
        # Register and login
        self.client.post(self.register_url, self.user_data, format='json')
        login_response = self.client.post(self.login_url, {
            'email': 'john@example.com',
            'password': 'password123'
        }, format='json')
        token = login_response.data['data']['tokens']['accessToken']

        # Get profile
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['email'], 'john@example.com')

    def test_unauthorized_access(self):
        """Test accessing protected endpoint without authentication"""
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_update_invalidates_cached_profile_for_me_and_username_reads(self):
        """Updating profile arrays should be immediately reflected in cached read endpoints."""
        self.client.post(self.register_url, self.user_data, format='json')
        login_response = self.client.post(self.login_url, {
            'email': 'john@example.com',
            'password': 'password123'
        }, format='json')
        token = login_response.data['data']['tokens']['accessToken']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        by_username_url = reverse('users:user-by-username', kwargs={'username': 'johndoe'})
        profile_url = reverse('users:user-profile')

        cache_service = InMemoryCacheService()
        with patch('campus_sphere.cache.cache_service', cache_service):
            # Prime cache with initial profile
            me_before = self.client.get(self.me_url)
            self.assertEqual(me_before.status_code, status.HTTP_200_OK)
            self.assertEqual(me_before.data['data']['skills'], [])

            by_username_before = self.client.get(by_username_url)
            self.assertEqual(by_username_before.status_code, status.HTTP_200_OK)
            self.assertEqual(by_username_before.data['data']['interests'], [])

            payload = {
                'skills': ['Python', 'Django'],
                'interests': ['AI', 'Backend'],
                'previous_education': [{'school': 'Lycée X', 'year': 2020}],
                'experiences': [{'company': 'Acme', 'role': 'Intern'}],
                'portfolio_links': ['https://example.dev'],
            }
            update_response = self.client.patch(profile_url, payload, format='json')
            self.assertEqual(update_response.status_code, status.HTTP_200_OK)

            me_after = self.client.get(self.me_url)
            self.assertEqual(me_after.status_code, status.HTTP_200_OK)
            self.assertEqual(me_after.data['data']['skills'], payload['skills'])
            self.assertEqual(me_after.data['data']['interests'], payload['interests'])
            self.assertEqual(me_after.data['data']['previous_education'], payload['previous_education'])
            self.assertEqual(me_after.data['data']['experiences'], payload['experiences'])
            self.assertEqual(me_after.data['data']['portfolio_links'], payload['portfolio_links'])

            by_username_after = self.client.get(by_username_url)
            self.assertEqual(by_username_after.status_code, status.HTTP_200_OK)
            self.assertEqual(by_username_after.data['data']['skills'], payload['skills'])
            self.assertEqual(by_username_after.data['data']['interests'], payload['interests'])
            self.assertEqual(by_username_after.data['data']['previous_education'], payload['previous_education'])
            self.assertEqual(by_username_after.data['data']['experiences'], payload['experiences'])
            self.assertEqual(by_username_after.data['data']['portfolio_links'], payload['portfolio_links'])

    def test_profile_put_update_invalidates_cached_profile_for_me_and_username_reads(self):
        """PUT profile update should invalidate cache for JSON profile fields."""
        self.client.post(self.register_url, self.user_data, format='json')
        login_response = self.client.post(self.login_url, {
            'email': 'john@example.com',
            'password': 'password123'
        }, format='json')
        token = login_response.data['data']['tokens']['accessToken']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        by_username_url = reverse('users:user-by-username', kwargs={'username': 'johndoe'})
        profile_url = reverse('users:user-profile')

        cache_service = InMemoryCacheService()
        with patch('campus_sphere.cache.cache_service', cache_service):
            self.assertEqual(self.client.get(self.me_url).status_code, status.HTTP_200_OK)
            self.assertEqual(self.client.get(by_username_url).status_code, status.HTTP_200_OK)

            payload = {
                'first_name': 'John',
                'last_name': 'Doe',
                'username': 'johndoe',
                'bio': 'Updated bio',
                'university': 'douala',
                'faculty': 'informatique',
                'study_year': 'l3',
                'student_id': '2021001234',
                'campus': 'Campus Principal',
                'town': 'douala',
                'language': 'fr',
                'skills': ['Python'],
                'interests': ['Backend'],
                'current_mood': 'focused',
                'previous_education': [{'school': 'Lycée Y', 'year': 2021}],
                'experiences': [{'company': 'Beta', 'role': 'Junior Dev'}],
                'portfolio_links': ['https://example.org'],
                'profile_visibility': 'public',
                'post_visibility': 'public',
            }
            update_response = self.client.put(profile_url, payload, format='json')
            self.assertEqual(update_response.status_code, status.HTTP_200_OK)

            me_after = self.client.get(self.me_url)
            by_username_after = self.client.get(by_username_url)
            self.assertEqual(me_after.data['data']['previous_education'], payload['previous_education'])
            self.assertEqual(me_after.data['data']['experiences'], payload['experiences'])
            self.assertEqual(me_after.data['data']['portfolio_links'], payload['portfolio_links'])
            self.assertEqual(by_username_after.data['data']['previous_education'], payload['previous_education'])
            self.assertEqual(by_username_after.data['data']['experiences'], payload['experiences'])
            self.assertEqual(by_username_after.data['data']['portfolio_links'], payload['portfolio_links'])

    def test_by_username_returns_404_for_incomplete_profile_to_other_users(self):
        owner = User.objects.create_user(
            email='incomplete-owner@example.com',
            username='incomplete_owner',
            first_name='Incomplete',
            last_name='Owner',
            password='password123',
            is_profile_complete=False,
        )
        viewer = User.objects.create_user(
            email='viewer@example.com',
            username='viewer_user',
            first_name='Viewer',
            last_name='User',
            password='password123',
            is_profile_complete=True,
        )
        self.client.force_authenticate(user=viewer)

        url = reverse('users:user-by-username', kwargs={'username': owner.username})
        response = self.client.get(url, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_detail_returns_404_for_incomplete_profile_to_other_users(self):
        owner = User.objects.create_user(
            email='hidden-owner@example.com',
            username='hidden_owner',
            first_name='Hidden',
            last_name='Owner',
            password='password123',
            is_profile_complete=False,
        )
        viewer = User.objects.create_user(
            email='viewer-two@example.com',
            username='viewer_two',
            first_name='Viewer',
            last_name='Two',
            password='password123',
            is_profile_complete=True,
        )
        self.client.force_authenticate(user=viewer)

        url = reverse('users:user-detail', kwargs={'id': owner.id})
        response = self.client.get(url, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
