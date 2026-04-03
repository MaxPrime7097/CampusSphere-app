import pytest
from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
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

    def test_invalid_login(self):
        """Test invalid login credentials"""
        login_data = {
            'email': 'nonexistent@example.com',
            'password': 'wrongpassword'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

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
