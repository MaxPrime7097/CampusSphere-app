from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User
from .models import Resource, ResourceReport, ResourceShareEvent


@override_settings(SECURE_SSL_REDIRECT=False)
class ResourceModerationEndpointsTests(APITestCase):
    def setUp(self):
        self.author = User.objects.create_user(
            email='author@example.com',
            username='resource_author',
            first_name='Resource',
            last_name='Author',
            password='testpass123',
        )
        self.reporter = User.objects.create_user(
            email='reporter@example.com',
            username='resource_reporter',
            first_name='Resource',
            last_name='Reporter',
            password='testpass123',
        )
        self.resource = Resource.objects.create(
            title='Resource to report',
            description='Reportable resource',
            author=self.author,
            file=SimpleUploadedFile('resource.pdf', b'pdf-bytes', content_type='application/pdf'),
            file_size=1200,
            file_type='application/pdf',
            subject='computer-science',
            type='notes',
            visibility='public',
        )

    def test_report_resource_creates_pending_report(self):
        self.client.force_authenticate(user=self.reporter)
        response = self.client.post(
            f'/api/resources/{self.resource.id}/report/',
            {'reason': 'copyright', 'details': 'Uncredited material'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertTrue(ResourceReport.objects.filter(resource=self.resource, reporter=self.reporter).exists())

    def test_share_resource_tracks_event(self):
        self.client.force_authenticate(user=self.reporter)
        response = self.client.post(
            f'/api/resources/{self.resource.id}/share/',
            {'channel': 'copy_link'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertTrue(ResourceShareEvent.objects.filter(resource=self.resource, user=self.reporter).exists())
