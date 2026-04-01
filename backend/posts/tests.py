from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User
from .models import Post, Comment
from notifications.models import Notification


class PostCommentsIntegrationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='comment_test@example.com',
            username='comment_test',
            first_name='Comment',
            last_name='Tester',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        self.post = Post.objects.create(
            content='Post for comment integration tests',
            author=self.user,
            category='academic',
            visibility='public'
        )

    def test_create_reply_with_parent_linkage(self):
        parent_comment = Comment.objects.create(
            content='Top-level comment',
            author=self.user,
            post=self.post
        )
        url = reverse('posts:post-comments', kwargs={'pk': self.post.id})

        response = self.client.post(
            url,
            {'content': 'This is a reply', 'parent': parent_comment.id},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['parent'], parent_comment.id)

        created_reply = Comment.objects.get(pk=response.data['id'])
        self.assertEqual(created_reply.parent_id, parent_comment.id)
        self.assertEqual(created_reply.post_id, self.post.id)


class MentionNotificationsIntegrationTests(APITestCase):
    def setUp(self):
        self.author = User.objects.create_user(
            email='author@example.com',
            username='author_user',
            first_name='Author',
            last_name='User',
            password='testpass123'
        )
        self.mentioned = User.objects.create_user(
            email='mentioned@example.com',
            username='mentioned_user',
            first_name='Mentioned',
            last_name='User',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.author)
        self.post = Post.objects.create(
            content='Initial post content',
            author=self.author,
            category='general',
            visibility='public'
        )

    def test_post_creation_creates_mention_notification_for_existing_user_only(self):
        url = reverse('posts:post-list')
        payload = {
            'content': 'Bonjour @mentioned_user et @unknown_user',
            'visibility': 'public'
        }

        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            Notification.objects.filter(
                type='mention_post',
                recipient=self.mentioned,
            ).count(),
            1
        )
        self.assertEqual(Notification.objects.filter(type='mention_post').count(), 1)

    def test_comment_creation_creates_mention_comment_notification(self):
        url = reverse('posts:post-comments', kwargs={'pk': self.post.id})
        payload = {'content': 'Merci @mentioned_user pour ton aide'}

        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            Notification.objects.filter(
                type='mention_comment',
                recipient=self.mentioned,
            ).count(),
            1
        )
