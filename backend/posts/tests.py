from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

from posts.models import Post, PostSave, PostReport

User = get_user_model()


class PostSaveReportAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='post_save_report@example.com',
            username='post_save_report',
            first_name='Post',
            last_name='SaveReport',
            password='testpass123'
        )
        self.post = Post.objects.create(
            content='Post for save/report tests',
            author=self.user,
            category='general',
            visibility='public'
        )
        self.client.force_authenticate(user=self.user)

    @staticmethod
    def _with_trailing_slash(url: str) -> str:
        return url if url.endswith('/') else f'{url}/'

    def test_save_toggle_and_saved_posts_listing(self):
        save_url = self._with_trailing_slash(reverse('posts:post-save', kwargs={'pk': self.post.id}))
        saved_posts_url = self._with_trailing_slash(reverse('posts:user-saved-posts'))

        response = self.client.post(save_url, format='json', secure=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['data']['saved'])
        self.assertTrue(PostSave.objects.filter(post=self.post, user=self.user).exists())

        list_response = self.client.get(saved_posts_url, format='json', secure=True)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(list_response.data.get('results', [])), 1)

        unsave_response = self.client.delete(save_url, format='json', secure=True)
        self.assertEqual(unsave_response.status_code, status.HTTP_200_OK)
        self.assertFalse(unsave_response.data['data']['saved'])
        self.assertFalse(PostSave.objects.filter(post=self.post, user=self.user).exists())

    def test_report_post(self):
        report_url = self._with_trailing_slash(reverse('posts:post-report', kwargs={'pk': self.post.id}))
        payload = {'reason': 'Spam ou publicité', 'details': 'Contenu promotionnel répété'}

        response = self.client.post(report_url, payload, format='json', secure=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['data']['reported'])
        self.assertTrue(PostReport.objects.filter(post=self.post, reporter=self.user).exists())

    def test_report_requires_reason(self):
        report_url = self._with_trailing_slash(reverse('posts:post-report', kwargs={'pk': self.post.id}))

        response = self.client.post(report_url, {'details': 'missing reason'}, format='json', secure=True)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AdminReportedContentPathTest(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            email='staff_reports@example.com',
            username='staff_reports',
            first_name='Staff',
            last_name='Reports',
            password='testpass123',
            is_staff=True,
        )
        self.reporter = User.objects.create_user(
            email='reporter_reports@example.com',
            username='reporter_reports',
            first_name='Reporter',
            last_name='User',
            password='testpass123',
        )
        self.post = Post.objects.create(
            content='Reported content test payload',
            author=self.reporter,
            visibility='public',
        )
        PostReport.objects.create(
            post=self.post,
            reporter=self.reporter,
            reason='Contenu inapproprié',
            details='Detailed moderation context',
            status='pending',
        )

    def test_admin_reported_content_includes_post_reports(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get(PostSaveReportAPITest._with_trailing_slash(reverse('admin-reported-content')), format='json', secure=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertGreaterEqual(len(response.data.get('data', [])), 1)
        self.assertEqual(response.data['data'][0]['type'], 'Post')

    def test_non_staff_cannot_access_admin_reported_content(self):
        self.client.force_authenticate(user=self.reporter)
        response = self.client.get(PostSaveReportAPITest._with_trailing_slash(reverse('admin-reported-content')), format='json', secure=True)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
