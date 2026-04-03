import pytest
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from users.models import User, Connection
from spheres.models import Sphere, SphereMember
from posts.models import Post
from resources.models import Resource
from tasks.models import Task

User = get_user_model()


class SphereAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='sphere_test@example.com',
            username='sphere_test',
            first_name='Sphere',
            last_name='Test',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_sphere(self):
        """Test sphere creation"""
        url = reverse('spheres:sphere-list')
        data = {
            'name': 'Test Sphere',
            'description': 'A test sphere for API testing',
            'category': 'academic',
            'type': 'study',
            'color': '#10b981',
            'icon': 'code',
            'is_private': False,
            'require_approval': True
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Test Sphere')

    def test_join_sphere(self):
        """Test joining a sphere"""
        # Create a sphere
        sphere = Sphere.objects.create(
            name='Join Test Sphere',
            description='Sphere for join testing',
            category='academic',
            type='study',
            created_by=self.user
        )

        url = reverse('spheres:sphere-join', kwargs={'pk': sphere.id})
        response = self.client.post(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

        # Check membership was created
        membership = SphereMember.objects.get(sphere=sphere, user=self.user)
        self.assertEqual(membership.status, 'active')

    def test_cancel_pending_join_request(self):
        """Test cancelling a pending join request"""
        sphere = Sphere.objects.create(
            name='Approval Sphere',
            description='Sphere with approval requirement',
            category='academic',
            type='study',
            require_approval=True,
            created_by=self.user
        )

        join_url = reverse('spheres:sphere-join', kwargs={'pk': sphere.id})
        join_response = self.client.post(join_url, format='json')
        self.assertEqual(join_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            SphereMember.objects.get(sphere=sphere, user=self.user).status,
            'pending'
        )

        cancel_url = reverse('spheres:sphere-cancel-request', kwargs={'pk': sphere.id})
        cancel_response = self.client.delete(cancel_url, format='json')
        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)
        self.assertTrue(cancel_response.data['success'])
        self.assertFalse(SphereMember.objects.filter(sphere=sphere, user=self.user).exists())

    def test_cancel_pending_join_request_not_found(self):
        """Test cancelling pending join request when no pending request exists"""
        sphere = Sphere.objects.create(
            name='No Pending Sphere',
            description='Sphere without pending membership',
            category='academic',
            type='study',
            created_by=self.user
        )

        cancel_url = reverse('spheres:sphere-cancel-request', kwargs={'pk': sphere.id})
        cancel_response = self.client.delete(cancel_url, format='json')
        self.assertEqual(cancel_response.status_code, status.HTTP_404_NOT_FOUND)


class PostAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='post_test@example.com',
            username='post_test',
            first_name='Post',
            last_name='Test',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_post(self):
        """Test post creation"""
        url = reverse('posts:post-list')
        data = {
            'content': 'This is a test post',
            'category': 'academic',
            'visibility': 'public',
            'subject': 'informatique',
            'type': 'text',
            'audience': 'Étudiants en informatique',
            'allow_comments': True
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], 'This is a test post')

    def test_like_post(self):
        """Test liking a post"""
        # Create a post
        post = Post.objects.create(
            content='Test post for liking',
            author=self.user,
            category='academic',
            visibility='public'
        )

        url = reverse('posts:post-like', kwargs={'pk': post.id})
        response = self.client.post(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertTrue(response.data['data']['liked'])


class ResourceAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='resource_test@example.com',
            username='resource_test',
            first_name='Resource',
            last_name='Test',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def _resource_payload(self, visibility):
        return {
            'title': f'Test Resource {visibility}',
            'description': 'A test resource description',
            'subject': 'informatique',
            'type': 'cours',
            'visibility': visibility,
            'audience': 'Étudiants en informatique',
            'file': SimpleUploadedFile(
                name=f'resource-{visibility}.pdf',
                content=b'%PDF-1.4 test resource content',
                content_type='application/pdf',
            ),
        }

    def test_create_resource_accepts_supported_visibility_values(self):
        """Test resource creation for each supported visibility value."""
        url = reverse('resources:resource-list')

        for visibility in ['public', 'university', 'friends']:
            response = self.client.post(url, self._resource_payload(visibility), format='multipart')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertEqual(response.data['visibility'], visibility)

    def test_create_resource_legacy_private_visibility_maps_to_friends(self):
        """Test backward compatibility for legacy private visibility payloads."""
        url = reverse('resources:resource-list')
        response = self.client.post(url, self._resource_payload('private'), format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['visibility'], 'friends')


class TaskAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='task_test@example.com',
            username='task_test',
            first_name='Task',
            last_name='Test',
            password='testpass123'
        )
        self.sphere = Sphere.objects.create(
            name='Task Test Sphere',
            description='Sphere for task testing',
            category='academic',
            type='project',
            created_by=self.user
        )
        SphereMember.objects.create(
            sphere=self.sphere,
            user=self.user,
            role='admin',
            status='active'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_task(self):
        """Test task creation"""
        url = reverse('tasks:task-list')
        data = {
            'title': 'Test Task',
            'description': 'A test task for API testing',
            'priority': 'high',
            'due_date': '2024-12-31T23:59:59Z',
            'impact_points': 10,
            'sphere': str(self.sphere.id)
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Test Task')

    def test_complete_task(self):
        """Test task completion"""
        # Create a task
        task = Task.objects.create(
            title='Complete Test Task',
            description='Task to be completed',
            assigned_to=self.user,
            priority='medium',
            impact_points=5,
            sphere=self.sphere,
            created_by=self.user
        )

        url = reverse('tasks:task-complete', kwargs={'pk': task.id})
        response = self.client.post(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['impactPointsEarned'], 5)


class SearchAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='search_test@example.com',
            username='search_test',
            first_name='Search',
            last_name='Test',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_global_search(self):
        """Test global search functionality"""
        url = reverse('global-search')
        response = self.client.get(url, {'q': 'test', 'type': 'all'}, follow=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('success', response.data)
        self.assertIn('users', response.data['data'])
        self.assertIn('spheres', response.data['data'])
        self.assertIn('posts', response.data['data'])
        self.assertIn('resources', response.data['data'])

    def test_search_suggestions(self):
        """Test search suggestions"""
        url = reverse('search-suggestions')
        response = self.client.get(url, {'q': 'test'}, follow=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('success', response.data)

    def test_global_search_returns_results_for_all_entities_with_minimal_data(self):
        """Regression test: global search returns users/spheres/posts/resources."""
        sphere = Sphere.objects.create(
            name='Test Search Sphere',
            description='Minimal sphere for search regression tests',
            category='academic',
            type='study',
            is_private=False,
            created_by=self.user
        )
        Post.objects.create(
            author=self.user,
            sphere=sphere,
            content='Test search post content',
            category='academic',
            visibility='public',
            tags=['test-search-tag'],
        )
        Resource.objects.create(
            title='Test Search Resource',
            description='Minimal resource for search regression tests',
            author=self.user,
            file=SimpleUploadedFile(
                name='search-resource.pdf',
                content=b'%PDF-1.4 search regression resource',
                content_type='application/pdf',
            ),
            file_size=1024,
            file_type='application/pdf',
            subject='informatique',
            type='cours',
            visibility='public',
            tags=['test-search-tag'],
        )

        url = reverse('global-search')
        response = self.client.get(url, {'q': 'test search', 'type': 'all', 'limit': 10}, follow=True)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data.get('errors', {}), {})
        self.assertGreaterEqual(len(response.data['data']['users']), 1)
        self.assertGreaterEqual(len(response.data['data']['spheres']), 1)
        self.assertGreaterEqual(len(response.data['data']['posts']), 1)
        self.assertGreaterEqual(len(response.data['data']['resources']), 1)

    def test_entity_specific_search_routes_return_200(self):
        """Regression test: users/spheres/posts/resources searches never return 500."""
        sphere = Sphere.objects.create(
            name='Search Route Sphere',
            description='Entity route sphere',
            category='academic',
            type='study',
            is_private=False,
            created_by=self.user
        )
        Post.objects.create(
            author=self.user,
            sphere=sphere,
            content='Search route post',
            category='academic',
            visibility='public',
            tags=['route-tag'],
        )
        Resource.objects.create(
            title='Search Route Resource',
            description='Entity route resource',
            author=self.user,
            file=SimpleUploadedFile(
                name='search-route-resource.pdf',
                content=b'%PDF-1.4 entity route resource',
                content_type='application/pdf',
            ),
            file_size=2048,
            file_type='application/pdf',
            subject='informatique',
            type='cours',
            visibility='public',
            tags=['route-tag'],
        )

        url = reverse('global-search')
        for entity_type in ['users', 'spheres', 'posts', 'resources']:
            response = self.client.get(url, {'q': 'search', 'type': entity_type}, follow=True)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data['success'])
            self.assertIn('errors', response.data)
            self.assertIn(entity_type, response.data['data'])


class ConnectionAPITest(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            email='connection1@example.com',
            username='connection1',
            first_name='Connection',
            last_name='One',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            email='connection2@example.com',
            username='connection2',
            first_name='Connection',
            last_name='Two',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user1)

    def test_send_connection_request(self):
        """Test sending connection request"""
        url = reverse('users:user-connections', kwargs={'id': self.user1.id})
        data = {'recipient': self.user2.id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Check connection was created
        connection = Connection.objects.get(requester=self.user1, recipient=self.user2)
        self.assertEqual(connection.status, 'pending')

    def test_list_own_connections(self):
        """Authenticated users can list their own connections."""
        Connection.objects.create(requester=self.user1, recipient=self.user2, status='accepted')

        url = reverse('users:user-connections', kwargs={'id': self.user1.id})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    @override_settings(CONNECTION_LIST_VISIBILITY_POLICY='public_profile')
    def test_list_another_users_connections_allowed_for_public_profile_policy(self):
        """When visibility policy is public_profile, other users can list target user's connections."""
        user3 = User.objects.create_user(
            email='connection3@example.com',
            username='connection3',
            first_name='Connection',
            last_name='Three',
            password='testpass123'
        )
        Connection.objects.create(requester=self.user2, recipient=user3, status='accepted')

        url = reverse('users:user-connections', kwargs={'id': self.user2.id})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_another_users_connections_denied_for_own_only_policy(self):
        """When visibility policy is own_only (default), users cannot list someone else's connections."""
        user3 = User.objects.create_user(
            email='connection4@example.com',
            username='connection4',
            first_name='Connection',
            last_name='Four',
            password='testpass123'
        )
        Connection.objects.create(requester=self.user2, recipient=user3, status='accepted')

        url = reverse('users:user-connections', kwargs={'id': self.user2.id})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
