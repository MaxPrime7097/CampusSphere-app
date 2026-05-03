from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
# from django_filters.rest_framework import DjangoFilterBackend  # Commented out - django_filters not installed
from rest_framework.filters import OrderingFilter
from django.shortcuts import get_object_or_404
from django.db import models
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Conversation, Message, ConversationReadReceipt
from .serializers import (
    ConversationSerializer, ConversationCreateSerializer, ConversationUpdateSerializer,
    MessageSerializer, MessageCreateSerializer, MessageUpdateSerializer
)
from notifications.services import create_message_notification
from .errors import business_error_payload


def can_moderate_message(user, conversation):
    return bool(
        user and user.is_authenticated and (
            user.is_staff or
            user.is_superuser or
            (conversation.type == 'group' and conversation.created_by_id == user.id)
        )
    )


def publish_conversation_event(conversation_id, event_type, payload):
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            return
        async_to_sync(channel_layer.group_send)(
            f'conversation_{conversation_id}',
            {
                'type': 'conversation_event',
                'event_type': event_type,
                'payload': payload,
            }
        )
    except Exception:
        pass


class ConversationListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [OrderingFilter]  # Removed DjangoFilterBackend - not installed
    # filterset_fields = ['type']  # Commented out - django_filters not installed
    ordering = ['-updated_at']

    def get_queryset(self):
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants').distinct()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ConversationCreateSerializer
        return ConversationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        conversation = Conversation.objects.prefetch_related('participants', 'messages').get(pk=serializer.instance.pk)
        output_serializer = ConversationSerializer(conversation, context={'request': request})
        headers = self.get_success_headers(output_serializer.data)
        return Response({
            "success": True,
            "data": output_serializer.data
        }, status=status.HTTP_201_CREATED, headers=headers)


class ConversationDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ConversationUpdateSerializer
        return ConversationSerializer

    def perform_update(self, serializer):
        conversation = self.get_object()
        user = self.request.user
        
        # Only group conversation creators or participants can update
        if conversation.type == 'group':
            if conversation.created_by != user and user not in conversation.participants.all():
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(business_error_payload("permission_denied", "You don't have permission to update this conversation"))
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(business_error_payload("permission_denied", "Private conversations cannot be updated"))

        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        
        # Only group conversation creators can delete
        if instance.type == 'group' and instance.created_by == user:
            instance.delete()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(business_error_payload("permission_denied", "You don't have permission to delete this conversation"))


class ConversationMessagesView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [OrderingFilter]
    ordering = ['created_at']

    def get_queryset(self):
        conversation = get_object_or_404(
            Conversation,
            pk=self.kwargs['pk'],
            participants=self.request.user
        )
        return conversation.messages.select_related('author').prefetch_related('read_by')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MessageCreateSerializer
        return MessageSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['conversation'] = get_object_or_404(
            Conversation,
            pk=self.kwargs['pk'],
            participants=self.request.user
        )
        return context

    def list(self, request, *args, **kwargs):
        # Mark conversation as read when fetching messages
        conversation = get_object_or_404(
            Conversation,
            pk=self.kwargs['pk'],
            participants=request.user
        )
        conversation.mark_as_read(request.user)
        
        response = super().list(request, *args, **kwargs)
        return Response({
            "success": True,
            "data": response.data
        }, status=response.status_code)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        create_message_notification(serializer.instance)

        message = Message.objects.select_related('author', 'conversation').prefetch_related('read_by').get(
            pk=serializer.instance.pk
        )
        output_serializer = MessageSerializer(message, context=self.get_serializer_context())
        headers = self.get_success_headers(output_serializer.data)
        publish_conversation_event(
            self.kwargs['pk'],
            'message_created',
            {'message': output_serializer.data}
        )
        return Response({
            "success": True,
            "data": output_serializer.data
        }, status=status.HTTP_201_CREATED, headers=headers)


class MessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'patch', 'delete']
    lookup_url_kwarg = 'message_pk'

    def get_queryset(self):
        return Message.objects.select_related('conversation', 'author').filter(
            conversation__pk=self.kwargs['pk'],
            conversation__participants=self.request.user
        )

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return MessageUpdateSerializer
        return MessageSerializer

    def _check_permission(self, message):
        user = self.request.user
        if message.author_id == user.id or can_moderate_message(user, message.conversation):
            return
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied(
            business_error_payload("permission_denied", "You don't have permission to modify this message")
        )

    def update(self, request, *args, **kwargs):
        message = self.get_object()
        self._check_permission(message)
        super().update(request, *args, **kwargs)

        refreshed = Message.objects.select_related('author', 'conversation').prefetch_related('read_by').get(
            pk=message.pk
        )
        serialized = MessageSerializer(refreshed, context={'request': request}).data
        publish_conversation_event(
            refreshed.conversation_id,
            'message_updated',
            {'message': serialized}
        )
        return Response({'success': True, 'data': serialized}, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        message = self.get_object()
        self._check_permission(message)
        conversation_id = message.conversation_id
        message_id = message.id
        super().destroy(request, *args, **kwargs)
        Conversation.objects.filter(pk=conversation_id).update(updated_at=timezone.now())

        publish_conversation_event(
            conversation_id,
            'message_deleted',
            {'message_id': str(message_id), 'conversation_id': str(conversation_id)}
        )
        return Response({'success': True}, status=status.HTTP_200_OK)


class ConversationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        conversation = get_object_or_404(
            Conversation,
            pk=pk,
            participants=request.user
        )

        conversation.mark_as_read(request.user)

        try:
            publish_conversation_event(
                conversation.id,
                'conversation_read',
                {
                    'conversation_id': str(conversation.id),
                    'reader_id': str(request.user.id),
                    'timestamp': timezone.now().isoformat(),
                }
            )
        except Exception:
            pass

        return Response({
            'success': True,
            'message': 'Conversation marked as read',
            'timestamp': timezone.now().isoformat()
        })


class ConversationUnreadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        conversation = get_object_or_404(
            Conversation,
            pk=pk,
            participants=request.user
        )

        ConversationReadReceipt.objects.filter(
            conversation=conversation,
            user=request.user
        ).delete()

        return Response({
            'success': True,
            'message': 'Conversation marked as unread',
            'timestamp': timezone.now().isoformat()
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_conversations(request):
    """Get conversations for the current user"""
    conversations = Conversation.objects.filter(
        participants=request.user
    ).prefetch_related('participants').distinct().order_by('-updated_at')

    # Apply pagination
    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(conversations, request)
    
    serializer = ConversationSerializer(page, many=True, context={'request': request})
    return Response({
        'success': True,
        'data': serializer.data,
        'pagination': {
            'count': conversations.count(),
            'page_size': paginator.page_size,
        }
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_private_conversation(request):
    """Create a private conversation with another user"""
    recipient_id = request.data.get('recipient_id')
    
    if not recipient_id:
        return Response(
            business_error_payload('invalid_participant', 'recipient_id is required'),
            status=status.HTTP_400_BAD_REQUEST
        )

    from users.models import User
    try:
        recipient = User.objects.get(id=recipient_id)
    except User.DoesNotExist:
        return Response(
            business_error_payload('invalid_participant', 'Recipient not found'),
            status=status.HTTP_404_NOT_FOUND
        )

    if recipient == request.user:
        return Response(
            business_error_payload('invalid_participant', 'Cannot create conversation with yourself'),
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if private conversation already exists (robust check)
    existing_conversation = Conversation.objects.filter(
        type='private'
    ).filter(
        participants=request.user
    ).filter(
        participants=recipient
    ).first()

    if existing_conversation:
        return Response({
            'success': True,
            'data': ConversationSerializer(existing_conversation, context={'request': request}).data,
            'message': 'Existing conversation found',
            'timestamp': timezone.now().isoformat(),
            'error': {
                'code': 'conversation_exists',
                'message': 'Conversation déjà existante'
            }
        })

    # Create new private conversation
    conversation = Conversation.objects.create(type='private')
    conversation.participants.add(request.user, recipient)

    return Response({
        'success': True,
        'data': ConversationSerializer(conversation, context={'request': request}).data,
        'message': 'Private conversation created',
        'timestamp': timezone.now().isoformat()
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_group_conversation(request):
    """Create a group conversation"""
    serializer = ConversationCreateSerializer(
        data={**request.data, 'type': 'group'},
        context={'request': request}
    )
    serializer.is_valid(raise_exception=True)
    conversation = serializer.save()

    return Response({
        'success': True,
        'data': ConversationSerializer(conversation, context={'request': request}).data,
        'message': 'Group conversation created',
        'timestamp': timezone.now().isoformat()
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def conversation_participants(request, pk):
    """Get participants of a conversation"""
    conversation = get_object_or_404(
        Conversation,
        pk=pk,
        participants=request.user
    )

    from users.serializers import UserProfileSerializer
    participants = conversation.participants.all()
    serializer = UserProfileSerializer(participants, many=True)

    return Response({
        'success': True,
        'data': serializer.data,
        'timestamp': timezone.now().isoformat()
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_participant(request, pk):
    """Add participant to group conversation"""
    conversation = get_object_or_404(
        Conversation,
        pk=pk,
        participants=request.user,
        type='group'
    )

    # Only creator can add participants
    if conversation.created_by != request.user:
        return Response(
            business_error_payload('permission_denied', 'Only conversation creator can add participants'),
            status=status.HTTP_403_FORBIDDEN
        )

    user_id = request.data.get('user_id')
    if not user_id:
        return Response(
            business_error_payload('invalid_participant', 'user_id is required'),
            status=status.HTTP_400_BAD_REQUEST
        )

    from users.models import User
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            business_error_payload('invalid_participant', 'User not found'),
            status=status.HTTP_404_NOT_FOUND
        )

    if user in conversation.participants.all():
        return Response(
            business_error_payload('invalid_participant', 'User is already a participant'),
            status=status.HTTP_400_BAD_REQUEST
        )

    conversation.participants.add(user)

    return Response({
        'success': True,
        'message': f'{user.full_name} added to conversation',
        'timestamp': timezone.now().isoformat()
    })


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def remove_participant(request, pk, user_id):
    """Remove participant from group conversation"""
    conversation = get_object_or_404(
        Conversation,
        pk=pk,
        participants=request.user,
        type='group'
    )

    # Only creator can remove participants
    if conversation.created_by != request.user:
        return Response(
            business_error_payload('permission_denied', 'Only conversation creator can remove participants'),
            status=status.HTTP_403_FORBIDDEN
        )

    from users.models import User
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            business_error_payload('invalid_participant', 'User not found'),
            status=status.HTTP_404_NOT_FOUND
        )

    if user not in conversation.participants.all():
        return Response(
            business_error_payload('invalid_participant', 'User is not a participant'),
            status=status.HTTP_400_BAD_REQUEST
        )

    if user == conversation.created_by:
        return Response(
            business_error_payload('invalid_participant', 'Cannot remove conversation creator'),
            status=status.HTTP_400_BAD_REQUEST
        )

    conversation.participants.remove(user)

    return Response({
        'success': True,
        'message': f'{user.full_name} removed from conversation',
        'timestamp': timezone.now().isoformat()
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_conversation_avatar(request, pk):
    """Upload or remove avatar for a group conversation (creator only)."""
    conversation = get_object_or_404(
        Conversation, pk=pk, participants=request.user, type='group'
    )
    if conversation.created_by_id != request.user.id:
        return Response(
            business_error_payload('permission_denied', 'Only the group creator can change the avatar'),
            status=status.HTTP_403_FORBIDDEN
        )

    # DELETE avatar
    if request.method == 'DELETE' or request.data.get('remove'):
        if conversation.avatar:
            conversation.avatar.delete(save=False)
            conversation.avatar = None
            conversation.save(update_fields=['avatar'])
        return Response({'success': True, 'avatar_url': None})

    avatar_file = request.FILES.get('avatar')
    if not avatar_file:
        return Response(
            business_error_payload('invalid_file', 'No avatar file provided'),
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate type + size (max 5MB)
    if not avatar_file.content_type.startswith('image/'):
        return Response(
            business_error_payload('invalid_file', 'File must be an image'),
            status=status.HTTP_400_BAD_REQUEST
        )
    if avatar_file.size > 5 * 1024 * 1024:
        return Response(
            business_error_payload('invalid_file', 'Image must be under 5MB'),
            status=status.HTTP_400_BAD_REQUEST
        )

    if conversation.avatar:
        conversation.avatar.delete(save=False)
    conversation.avatar = avatar_file
    conversation.save(update_fields=['avatar'])

    avatar_url = request.build_absolute_uri(conversation.avatar.url)
    return Response({'success': True, 'avatar_url': avatar_url})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def leave_conversation(request, pk):
    """Remove current user from conversation."""
    conversation = get_object_or_404(
        Conversation,
        pk=pk,
        participants=request.user
    )
    user = request.user

    if conversation.type == 'group':
        participants = conversation.participants.all()

        if conversation.created_by == user:
            replacement_creator = participants.exclude(id=user.id).first()
            if replacement_creator:
                conversation.created_by = replacement_creator
                conversation.save(update_fields=['created_by', 'updated_at'])

        conversation.participants.remove(user)

        if conversation.participants.count() == 0:
            conversation.delete()
            return Response({
                'success': True,
                'message': 'Conversation deleted after leaving',
                'timestamp': timezone.now().isoformat()
            })

        return Response({
            'success': True,
            'message': 'You left the conversation',
            'timestamp': timezone.now().isoformat()
        })

    # Private: leaving removes participant, then conversation is deleted if orphaned.
    conversation.participants.remove(user)
    if conversation.participants.count() < 2:
        conversation.delete()

    return Response({
        'success': True,
        'message': 'You left the conversation',
        'timestamp': timezone.now().isoformat()
    })
