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
