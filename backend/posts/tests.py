from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User
from .models import Post, Comment


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

    def test_create_nested_reply_with_parent_linkage(self):
        parent_comment = Comment.objects.create(
            content='Top-level comment',
            author=self.user,
            post=self.post
        )
        first_reply = Comment.objects.create(
            content='First reply',
            author=self.user,
            post=self.post,
            parent=parent_comment
        )
        url = reverse('posts:post-comments', kwargs={'pk': self.post.id})

        response = self.client.post(
            url,
            {'content': 'Nested reply', 'parent': first_reply.id},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['parent'], first_reply.id)

        created_reply = Comment.objects.get(pk=response.data['id'])
        self.assertEqual(created_reply.parent_id, first_reply.id)
        self.assertEqual(created_reply.post_id, self.post.id)

    def test_create_reply_rejects_parent_from_other_post(self):
        other_post = Post.objects.create(
            content='Another post',
            author=self.user,
            category='academic',
            visibility='public'
        )
        foreign_parent = Comment.objects.create(
            content='Comment from another post',
            author=self.user,
            post=other_post
        )
        url = reverse('posts:post-comments', kwargs={'pk': self.post.id})

        response = self.client.post(
            url,
            {'content': 'Invalid reply', 'parent': foreign_parent.id},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('parent', response.data)
