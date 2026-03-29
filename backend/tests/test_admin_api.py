from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from posts.models import Post
from resources.models import Resource
from spheres.models import Sphere
from users.models import User


@override_settings(SECURE_SSL_REDIRECT=False)
class AdminEndpointsAPITest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='admin_user',
            first_name='Admin',
            last_name='User',
            password='testpass123',
            is_staff=True,
        )
        self.member = User.objects.create_user(
            email='member@example.com',
            username='member_user',
            first_name='Member',
            last_name='User',
            password='testpass123',
        )

        self.sphere = Sphere.objects.create(
            name='Admin Test Sphere',
            description='Sphere used for admin summary tests',
            category='academic',
            type='study',
            created_by=self.admin,
        )

        self.resource = Resource.objects.create(
            title='Moderation Candidate',
            description='Resource queued for moderation',
            author=self.member,
            file=SimpleUploadedFile('syllabus.pdf', b'fake-pdf-bytes', content_type='application/pdf'),
            file_size=2048,
            file_type='application/pdf',
            subject='computer-science',
            type='cours',
            visibility='public',
        )

        self.post = Post.objects.create(
            author=self.member,
            content='Potentially problematic content for review.',
            category='general',
            visibility='public',
            subject='general',
            type='text',
        )

    def test_admin_moderation_queue_requires_admin(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.get('/api/admin/moderation-queue/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_moderation_queue_returns_serializer_payload(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/moderation-queue/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertGreaterEqual(len(response.data['data']), 1)

        first_item = response.data['data'][0]
        self.assertSetEqual(
            set(first_item.keys()),
            {'id', 'title', 'type', 'subject', 'size', 'uploadDate', 'uploader'},
        )
        self.assertSetEqual(set(first_item['uploader'].keys()), {'name', 'avatar'})

    def test_admin_reported_content_returns_serializer_payload(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/reported-content/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        first_item = response.data['data'][0]

        self.assertSetEqual(
            set(first_item.keys()),
            {'id', 'type', 'content', 'reason', 'date', 'status', 'reporter'},
        )
        self.assertEqual(first_item['status'], 'pending')
        self.assertSetEqual(set(first_item['reporter'].keys()), {'name', 'avatar'})

    def test_admin_user_management_summary_returns_serializer_payload(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/user-management-summary/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

        summary = response.data['data']
        self.assertSetEqual(
            set(summary.keys()),
            {
                'totalUsers',
                'newUsersToday',
                'pendingResources',
                'reportedContent',
                'activeGroups',
                'totalResources',
            },
        )

        self.assertEqual(summary['totalUsers'], User.objects.count())
        self.assertEqual(
            summary['newUsersToday'],
            User.objects.filter(date_joined__date=timezone.localdate()).count(),
        )
        self.assertEqual(summary['pendingResources'], Resource.objects.count())
        self.assertEqual(summary['reportedContent'], Post.objects.count())
        self.assertEqual(summary['activeGroups'], Sphere.objects.count())
        self.assertEqual(summary['totalResources'], Resource.objects.count())
