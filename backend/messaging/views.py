from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
# from django_filters.rest_framework import DjangoFilterBackend  # Commented out - django_filters not installed
from rest_framework.filters import OrderingFilter
from django.shortcuts import get_object_or_404
from django.db import models
from django.utils import timezone
from .models import Conversation, Message, ConversationReadReceipt
from .serializers import (
    ConversationSerializer, ConversationCreateSerializer, ConversationUpdateSerializer,
    MessageSerializer, MessageCreateSerializer
)
from notifications.services import create_message_notification


class ConversationListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [OrderingFilter]  # Removed DjangoFilterBackend - not installed
    # filterset_fields = ['type']  # Commented out - django_filters not installed
    ordering = ['-updated_at']

    def get_queryset(self):
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants', 'messages').distinct()

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
        return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


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
                raise PermissionDenied("You don't have permission to update this conversation")
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Private conversations cannot be updated")

        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        
        # Only group conversation creators can delete
        if instance.type == 'group' and instance.created_by == user:
            instance.delete()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to delete this conversation")


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
        
        return super().list(request, *args, **kwargs)

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
        return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ConversationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        conversation = get_object_or_404(
            Conversation,
            pk=pk,
            participants=request.user
        )
        
        # Mark conversation as read
        conversation.mark_as_read(request.user)
        
        # Mark all messages as read by this user
        unread_messages = conversation.messages.exclude(read_by=request.user)
        for message in unread_messages:
            message.mark_as_read(request.user)

        return Response({
            'success': True,
            'message': 'Conversation marked as read',
            'timestamp': timezone.now().isoformat()
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_conversations(request):
    """Get conversations for the current user"""
    conversations = Conversation.objects.filter(
        participants=request.user
    ).prefetch_related('participants', 'messages').distinct().order_by('-updated_at')

    # Apply pagination
    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(conversations, request)
    
    serializer = ConversationSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_private_conversation(request):
    """Create a private conversation with another user"""
    recipient_id = request.data.get('recipient_id')
    
    if not recipient_id:
        return Response(
            {'error': 'recipient_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    from users.models import User
    try:
        recipient = User.objects.get(id=recipient_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Recipient not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if recipient == request.user:
        return Response(
            {'error': 'Cannot create conversation with yourself'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if private conversation already exists
    existing_conversation = Conversation.objects.filter(
        type='private',
        participants=request.user
    ).filter(
        participants=recipient
    ).annotate(
        participant_count=models.Count('participants')
    ).filter(participant_count=2).first()

    if existing_conversation:
        return Response({
            'success': True,
            'data': ConversationSerializer(existing_conversation, context={'request': request}).data,
            'message': 'Existing conversation found',
            'timestamp': timezone.now().isoformat()
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
            {'error': 'Only conversation creator can add participants'},
            status=status.HTTP_403_FORBIDDEN
        )

    user_id = request.data.get('user_id')
    if not user_id:
        return Response(
            {'error': 'user_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    from users.models import User
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if user in conversation.participants.all():
        return Response(
            {'error': 'User is already a participant'},
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
            {'error': 'Only conversation creator can remove participants'},
            status=status.HTTP_403_FORBIDDEN
        )

    from users.models import User
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if user not in conversation.participants.all():
        return Response(
            {'error': 'User is not a participant'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if user == conversation.created_by:
        return Response(
            {'error': 'Cannot remove conversation creator'},
            status=status.HTTP_400_BAD_REQUEST
        )

    conversation.participants.remove(user)

    return Response({
        'success': True,
        'message': f'{user.full_name} removed from conversation',
        'timestamp': timezone.now().isoformat()
    })
