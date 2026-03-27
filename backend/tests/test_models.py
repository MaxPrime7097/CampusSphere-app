import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from users.models import User, Connection
from spheres.models import Sphere, SphereMember
from posts.models import Post, Comment, PostLike
from resources.models import Resource, ResourceSave
from tasks.models import Task
from messaging.models import Conversation, Message
from notifications.models import Notification

User = get_user_model()


class UserModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            first_name='Test',
            last_name='User',
            password='testpass123'
        )

    def test_user_creation(self):
        """Test user model creation"""
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertEqual(self.user.username, 'testuser')
        self.assertEqual(self.user.full_name, 'Test User')
        self.assertEqual(self.user.impact_score, 0)
        self.assertEqual(self.user.current_mood, 'excited')

    def test_user_str(self):
        """Test user string representation"""
        self.assertEqual(str(self.user), 'Test User (testuser)')


class SphereModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='admin@example.com',
            username='admin',
            first_name='Admin',
            last_name='User',
            password='testpass123'
        )
        self.sphere = Sphere.objects.create(
            name='Test Sphere',
            description='A test sphere',
            category='academic',
            type='study',
            created_by=self.user
        )

    def test_sphere_creation(self):
        """Test sphere model creation"""
        self.assertEqual(self.sphere.name, 'Test Sphere')
        self.assertEqual(self.sphere.category, 'academic')
        self.assertEqual(self.sphere.member_count, 0)
        self.assertEqual(self.sphere.created_by, self.user)

    def test_sphere_member_management(self):
        """Test sphere member count updates"""
        member = SphereMember.objects.create(
            sphere=self.sphere,
            user=self.user,
            role='admin',
            status='active'
        )
        self.sphere.update_member_count()
        self.sphere.refresh_from_db()
        self.assertEqual(self.sphere.member_count, 1)


class PostModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='author@example.com',
            username='author',
            first_name='Author',
            last_name='User',
            password='testpass123'
        )
        self.post = Post.objects.create(
            content='Test post content',
            author=self.user,
            category='academic',
            visibility='public'
        )

    def test_post_creation(self):
        """Test post model creation"""
        self.assertEqual(self.post.content, 'Test post content')
        self.assertEqual(self.post.author, self.user)
        self.assertEqual(self.post.likes_count, 0)
        self.assertEqual(self.post.comments_count, 0)

    def test_post_likes(self):
        """Test post likes functionality"""
        like = PostLike.objects.create(post=self.post, user=self.user)
        self.post.update_counts()
        self.post.refresh_from_db()
        self.assertEqual(self.post.likes_count, 1)


class ResourceModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='resource_author@example.com',
            username='resource_author',
            first_name='Resource',
            last_name='Author',
            password='testpass123'
        )

    def test_resource_creation(self):
        """Test resource model creation"""
        from django.core.files.base import ContentFile
        resource = Resource.objects.create(
            title='Test Resource',
            description='A test resource',
            file=ContentFile('test content', name='test.pdf'),
            file_size=1024,
            file_type='application/pdf',
            author=self.user,
            subject='informatique',
            type='cours',
            visibility='public'
        )
        self.assertEqual(resource.title, 'Test Resource')
        self.assertEqual(resource.author, self.user)
        self.assertEqual(resource.downloads_count, 0)


class TaskModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='task_creator@example.com',
            username='task_creator',
            first_name='Task',
            last_name='Creator',
            password='testpass123'
        )
        self.sphere = Sphere.objects.create(
            name='Task Sphere',
            description='Sphere for tasks',
            category='academic',
            type='project',
            created_by=self.user
        )
        self.task = Task.objects.create(
            title='Test Task',
            description='A test task',
            assigned_to=self.user,
            priority='high',
            impact_points=10,
            sphere=self.sphere,
            created_by=self.user
        )

    def test_task_creation(self):
        """Test task model creation"""
        self.assertEqual(self.task.title, 'Test Task')
        self.assertEqual(self.task.assigned_to, self.user)
        self.assertEqual(self.task.impact_points, 10)
        self.assertFalse(self.task.is_completed)

    def test_task_completion(self):
        """Test task completion functionality"""
        points = self.task.complete()
        self.assertEqual(points, 10)
        self.assertTrue(self.task.is_completed)


class ConversationModelTest(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            email='user1@example.com',
            username='user1',
            first_name='User',
            last_name='One',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            email='user2@example.com',
            username='user2',
            first_name='User',
            last_name='Two',
            password='testpass123'
        )
        self.conversation = Conversation.objects.create(type='private')
        self.conversation.participants.add(self.user1, self.user2)

    def test_conversation_creation(self):
        """Test conversation model creation"""
        self.assertEqual(self.conversation.type, 'private')
        self.assertEqual(self.conversation.participants.count(), 2)

    def test_message_creation(self):
        """Test message creation in conversation"""
        message = Message.objects.create(
            content='Test message',
            conversation=self.conversation,
            author=self.user1
        )
        self.assertEqual(message.content, 'Test message')
        self.assertEqual(message.author, self.user1)
        self.assertEqual(message.conversation, self.conversation)


class NotificationModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='notify@example.com',
            username='notify_user',
            first_name='Notify',
            last_name='User',
            password='testpass123'
        )
        self.notification = Notification.objects.create(
            type='system',
            title='Test Notification',
            message='This is a test notification',
            recipient=self.user
        )

    def test_notification_creation(self):
        """Test notification model creation"""
        self.assertEqual(self.notification.type, 'system')
        self.assertEqual(self.notification.title, 'Test Notification')
        self.assertFalse(self.notification.is_read)
        self.assertIsNone(self.notification.read_at)

    def test_notification_mark_read(self):
        """Test marking notification as read"""
        self.notification.mark_as_read()
        self.assertTrue(self.notification.is_read)
        self.assertIsNotNone(self.notification.read_at)