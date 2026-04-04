from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User
from messaging.models import Conversation, Message


class MessagingApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='sender@example.com',
            username='sender',
            first_name='Send',
            last_name='Er',
            password='testpass123',
        )
        self.other_user = User.objects.create_user(
            email='recipient@example.com',
            username='recipient',
            first_name='Re',
            last_name='Cipient',
            password='testpass123',
        )
        self.third_user = User.objects.create_user(
            email='third@example.com',
            username='third',
            first_name='Third',
            last_name='User',
            password='testpass123',
        )
        self.client.force_authenticate(user=self.user)

    def test_create_private_conversation_success_payload(self):
        url = reverse('messaging:create-private-conversation')

        response = self.client.post(url, {'recipient_id': str(self.other_user.id)}, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('data', response.data)
        self.assertEqual(response.data['data']['type'], 'private')

    def test_create_private_conversation_existing_returns_business_error_code(self):
        conv = Conversation.objects.create(type='private')
        conv.participants.add(self.user, self.other_user)

        url = reverse('messaging:create-private-conversation')
        response = self.client.post(url, {'recipient_id': str(self.other_user.id)}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['error']['code'], 'conversation_exists')

    def test_create_group_conversation_success_payload(self):
        url = reverse('messaging:create-group-conversation')

        response = self.client.post(
            url,
            {
                'name': 'Team Alpha',
                'participant_ids': [str(self.other_user.id), str(self.third_user.id)],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['type'], 'group')
        self.assertEqual(response.data['data']['name'], 'Team Alpha')

    def test_send_message_and_read_conversation(self):
        conversation = Conversation.objects.create(type='private')
        conversation.participants.add(self.user, self.other_user)

        messages_url = reverse('messaging:conversation-messages', kwargs={'pk': conversation.id})
        send_response = self.client.post(messages_url, {'content': 'Bonjour'}, format='json')

        self.assertEqual(send_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(send_response.data['success'])
        self.assertEqual(send_response.data['data']['content'], 'Bonjour')
        self.assertEqual(Message.objects.filter(conversation=conversation).count(), 1)

        self.client.force_authenticate(user=self.other_user)
        read_url = reverse('messaging:conversation-read', kwargs={'pk': conversation.id})
        read_response = self.client.post(read_url, format='json')

        self.assertEqual(read_response.status_code, status.HTTP_200_OK)
        self.assertTrue(read_response.data['success'])
        self.assertEqual(conversation.get_unread_count(self.other_user), 0)

    def test_message_crud_author_permissions(self):
        conversation = Conversation.objects.create(type='private')
        conversation.participants.add(self.user, self.other_user)
        message = Message.objects.create(conversation=conversation, author=self.user, content='Initial')

        detail_url = reverse(
            'messaging:message-detail',
            kwargs={'pk': conversation.id, 'message_pk': message.id}
        )

        patch_response = self.client.patch(detail_url, {'content': 'Edited'}, format='json')
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        message.refresh_from_db()
        self.assertEqual(message.content, 'Edited')

        delete_response = self.client.delete(detail_url, format='json')
        self.assertEqual(delete_response.status_code, status.HTTP_200_OK)
        self.assertFalse(Message.objects.filter(id=message.id).exists())

    def test_message_crud_non_author_forbidden(self):
        conversation = Conversation.objects.create(type='private')
        conversation.participants.add(self.user, self.other_user)
        message = Message.objects.create(conversation=conversation, author=self.user, content='Initial')

        self.client.force_authenticate(user=self.other_user)
        detail_url = reverse(
            'messaging:message-detail',
            kwargs={'pk': conversation.id, 'message_pk': message.id}
        )

        patch_response = self.client.patch(detail_url, {'content': 'Hack'}, format='json')
        self.assertEqual(patch_response.status_code, status.HTTP_403_FORBIDDEN)

        delete_response = self.client.delete(detail_url, format='json')
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_group_creator_can_moderate_messages(self):
        group = Conversation.objects.create(type='group', name='Mods', created_by=self.user)
        group.participants.add(self.user, self.other_user, self.third_user)
        message = Message.objects.create(conversation=group, author=self.other_user, content='Post')

        detail_url = reverse(
            'messaging:message-detail',
            kwargs={'pk': group.id, 'message_pk': message.id}
        )

        patch_response = self.client.patch(detail_url, {'content': 'Moderated'}, format='json')
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        message.refresh_from_db()
        self.assertEqual(message.content, 'Moderated')
