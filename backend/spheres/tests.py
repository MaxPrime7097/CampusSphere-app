from datetime import timedelta

from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User
from .models import Sphere, SphereMember


class SphereDetailViewTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.owner = User.objects.create_user(
            email='owner@example.com',
            username='owner',
            first_name='Owner',
            last_name='User',
            password='pass12345'
        )
        self.member = User.objects.create_user(
            email='member@example.com',
            username='member',
            first_name='Member',
            last_name='User',
            password='pass12345'
        )
        self.non_member = User.objects.create_user(
            email='outsider@example.com',
            username='outsider',
            first_name='Out',
            last_name='Sider',
            password='pass12345'
        )

    def _create_sphere(self, **kwargs):
        defaults = {
            'name': 'Sphere test',
            'description': 'Description',
            'category': 'academic',
            'type': 'study',
            'created_by': self.owner,
            'is_private': False,
        }
        defaults.update(kwargs)
        sphere = Sphere.objects.create(**defaults)
        SphereMember.objects.create(sphere=sphere, user=self.owner, role='admin', status='active')
        return sphere

    def test_get_detail_returns_active_sphere_for_authenticated_user(self):
        sphere = self._create_sphere()
        self.client.force_authenticate(user=self.owner)

        url = f'/api/spheres/{sphere.pk}/'
        response = self.client.get(url, secure=True)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], sphere.pk)

    def test_get_detail_returns_structured_error_for_expired_sphere(self):
        sphere = self._create_sphere(expires_at=timezone.now() - timedelta(days=1))
        self.client.force_authenticate(user=self.owner)

        url = f'/api/spheres/{sphere.pk}/'
        response = self.client.get(url, secure=True)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'validation_error')
        self.assertEqual(response.data['detail'], 'This sphere has expired')
        self.assertIn('timestamp', response.data)

    def test_get_detail_private_sphere_denies_non_member(self):
        sphere = self._create_sphere(is_private=True)
        self.client.force_authenticate(user=self.non_member)

        url = f'/api/spheres/{sphere.pk}/'
        response = self.client.get(url, secure=True)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error'], 'api_error')
        self.assertEqual(response.data['detail'], 'This private sphere is only visible to active members')
        self.assertIn('timestamp', response.data)

    def test_get_detail_private_sphere_allows_active_member(self):
        sphere = self._create_sphere(is_private=True)
        SphereMember.objects.create(sphere=sphere, user=self.member, role='member', status='active')
        self.client.force_authenticate(user=self.member)

        url = f'/api/spheres/{sphere.pk}/'
        response = self.client.get(url, secure=True)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], sphere.pk)
