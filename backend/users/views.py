import logging
from django.conf import settings
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
# from django_filters.rest_framework import DjangoFilterBackend  # Commented out - django_filters not installed
from rest_framework.filters import SearchFilter
from django.db import models
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.contrib.auth.tokens import default_token_generator
from .models import User, Connection, UserBlock
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    UserUpdateSerializer, ConnectionSerializer, ConnectionCreateSerializer,
    UserSearchSerializer, ChangePasswordSerializer, ChangeEmailSerializer,
    LogoutSerializer, DeleteAccountSerializer, PrivacySettingsSerializer, PasswordResetSerializer,
    DataExportRequestSerializer, BlockListItemSerializer, BlockCreateSerializer
)
from campus_sphere.cache import CacheManager, CacheKeys
from notifications.services import create_connection_request_notification
from .throttles import AuthScopedRateThrottle

logger = logging.getLogger(__name__)


def _are_accepted_connections(user_a, user_b):
    return Connection.objects.filter(
        models.Q(requester=user_a, recipient=user_b) | models.Q(requester=user_b, recipient=user_a),
        status='accepted'
    ).exists()


def _can_view_sensitive_profile_fields(request_user, target_user):
    if not request_user or not request_user.is_authenticated:
        return False

    if request_user.id == target_user.id:
        return True

    return _are_accepted_connections(request_user, target_user)


def _apply_profile_privacy(user_data, request_user, target_user):
    """
    Redact sensitive fields for viewers who are not authorized by privacy policy.
    """
    if _can_view_sensitive_profile_fields(request_user, target_user):
        return user_data

    for field in ['email', 'phone_number', 'date_of_birth', 'student_id', 'data_export_requested_at']:
        user_data[field] = None

    return user_data


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthScopedRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'success': True,
            'data': {
                'user': UserProfileSerializer(user).data,
                'tokens': {
                    'accessToken': str(refresh.access_token),
                    'refreshToken': str(refresh),
                }
            },
            'message': 'User registered successfully',
            'timestamp': user.date_joined.isoformat()
        }, status=status.HTTP_201_CREATED)


class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthScopedRateThrottle]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)
        return Response({
            'success': True,
            'data': {
                'user': UserProfileSerializer(user).data,
                'tokens': {
                    'accessToken': str(refresh.access_token),
                    'refreshToken': str(refresh),
                }
            },
            'message': 'Login successful',
            'timestamp': user.date_joined.isoformat()
        })


class PasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthScopedRateThrottle]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()

        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            try:
                from notifications.tasks import send_password_reset_email_task
                send_password_reset_email_task.delay(str(user.id), reset_link)
            except Exception:
                logger.warning("Failed to queue password reset email task", exc_info=True)

        return Response({
            "success": True,
            "message": "If this email exists, a password reset link has been sent."
        }, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserProfileSerializer

    def perform_update(self, serializer):
        serializer.save()
        CacheManager.invalidate_user_profile(self.request.user.id)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        refresh_token = serializer.validated_data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                logger.info("Refresh token blacklist skipped during logout", exc_info=True)

        return Response({
            'success': True,
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password', 'updated_at'])

        return Response({
            'success': True,
            'message': 'Password updated successfully'
        }, status=status.HTTP_200_OK)


class ChangeEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangeEmailSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        request.user.email = serializer.validated_data['new_email']
        request.user.save(update_fields=['email', 'updated_at'])
        CacheManager.invalidate_user_profile(request.user.id)

        return Response({
            'success': True,
            'data': UserProfileSerializer(request.user).data,
            'message': 'Email updated successfully'
        }, status=status.HTTP_200_OK)


class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        serializer = DeleteAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        request.user.delete()
        return Response({
            'success': True,
            'message': 'Account deleted successfully'
        }, status=status.HTTP_200_OK)


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'

    def get_object(self):
        user_id = self.kwargs.get('id')
        cache_key = CacheKeys.user_profile(user_id)

        return CacheManager.get_or_set(
            cache_key,
            lambda: super().get_object(),
            CacheManager.USER_PROFILE_TTL
        )

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        user_data = UserProfileSerializer(user).data
        user_data = _apply_profile_privacy(user_data, request.user, user)
        return Response(user_data)


class UserSearchView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSearchSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['first_name', 'last_name', 'username', 'email']

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.exclude(id=self.request.user.id)


class ConnectionListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    # filter_backends = [DjangoFilterBackend]  # Commented out - django_filters not installed
    # filterset_fields = ['status']  # Commented out - django_filters not installed

    def _get_target_user(self):
        return User.objects.get(id=self.kwargs['id'])

    def _can_view_target_connections(self, target_user):
        if target_user == self.request.user:
            return True

        # Visibility policy:
        # - own_only (default): only the authenticated user can view their own connections
        # - public_profile: any authenticated user can view connections for a target user id
        policy = getattr(settings, 'CONNECTION_LIST_VISIBILITY_POLICY', 'own_only')
        return policy == 'public_profile'

    def get_queryset(self):
        if self.request.method == 'POST':
            return Connection.objects.none()

        target_user = self._get_target_user()
        if not self._can_view_target_connections(target_user):
            self.permission_denied(
                self.request,
                message='Not authorized to view this user\'s connections.'
            )

        return Connection.objects.filter(
            models.Q(requester=target_user) | models.Q(recipient=target_user)
        ).select_related('requester', 'recipient')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ConnectionCreateSerializer
        return ConnectionSerializer

    def perform_create(self, serializer):
        connection = serializer.save(requester=self.request.user)
        create_connection_request_notification(connection)


class ConnectionRelationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_target_user(self):
        return get_object_or_404(User, id=self.kwargs['id'])

    def _get_existing_connection(self, current_user, target_user):
        return Connection.objects.filter(
            models.Q(requester=current_user, recipient=target_user) |
            models.Q(requester=target_user, recipient=current_user)
        ).select_related('requester', 'recipient').first()

    def get(self, request, *args, **kwargs):
        target_user = self._get_target_user()
        if target_user == request.user:
            return Response({
                'success': True,
                'data': {
                    'target_user_id': target_user.id,
                    'is_self': True,
                    'is_connected': False,
                    'can_connect': False,
                    'can_disconnect': False,
                    'connection': None,
                }
            }, status=status.HTTP_200_OK)

        existing_connection = self._get_existing_connection(request.user, target_user)

        return Response({
            'success': True,
            'data': {
                'target_user_id': target_user.id,
                'is_self': False,
                'is_connected': existing_connection is not None,
                'can_connect': existing_connection is None,
                'can_disconnect': existing_connection is not None,
                'connection': ConnectionSerializer(existing_connection).data if existing_connection else None,
            }
        }, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        target_user = self._get_target_user()
        if target_user == request.user:
            return Response(
                {'detail': 'Cannot connect to yourself.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        existing_connection = self._get_existing_connection(request.user, target_user)
        if existing_connection:
            return Response({
                'success': True,
                'data': ConnectionSerializer(existing_connection).data,
                'message': 'Connection already exists.'
            }, status=status.HTTP_200_OK)

        connection = Connection.objects.create(
            requester=request.user,
            recipient=target_user,
            status='pending',
        )
        create_connection_request_notification(connection)

        return Response({
            'success': True,
            'data': ConnectionSerializer(connection).data,
            'message': 'Connection created successfully.'
        }, status=status.HTTP_201_CREATED)

    def delete(self, request, *args, **kwargs):
        target_user = self._get_target_user()
        if target_user == request.user:
            return Response(
                {'detail': 'Cannot disconnect from yourself.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        existing_connection = self._get_existing_connection(request.user, target_user)
        if not existing_connection:
            return Response(
                {'detail': 'Connection not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        existing_connection.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ConnectionDetailView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Connection.objects.filter(
            models.Q(requester=self.request.user) | models.Q(recipient=self.request.user)
        )

    def delete(self, request, *args, **kwargs):
        connection = self.get_object()
        # Only allow deletion if the current user is involved
        if request.user not in [connection.requester, connection.recipient]:
            return Response(
                {'error': 'Not authorized to delete this connection'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().delete(request, *args, **kwargs)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user_profile(request):
    cache_key = CacheKeys.user_profile(request.user.id)

    user_data = CacheManager.get_or_set(
        cache_key,
        lambda: UserProfileSerializer(request.user).data,
        CacheManager.USER_PROFILE_TTL
    )

    return Response({
        'success': True,
        'data': user_data,
        'timestamp': request.user.updated_at.isoformat()
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_user_by_username(request, username):
    """Get user profile by username"""
    try:
        user = User.objects.get(username=username)
        cache_key = CacheKeys.user_profile(user.id)

        user_data = CacheManager.get_or_set(
            cache_key,
            lambda: UserProfileSerializer(user).data,
            CacheManager.USER_PROFILE_TTL
        )
        user_data = _apply_profile_privacy(user_data, request.user, user)

        return Response({
            'success': True,
            'data': user_data,
            'timestamp': user.updated_at.isoformat()
        })
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': 'User not found'
        }, status=404)


class PrivacySettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'success': True,
            'data': PrivacySettingsSerializer(request.user).data,
        }, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = PrivacySettingsSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        CacheManager.invalidate_user_profile(request.user.id)

        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Privacy settings updated successfully',
        }, status=status.HTTP_200_OK)


class DataExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DataExportRequestSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        include_connections = serializer.validated_data.get('include_connections', True)
        include_posts = serializer.validated_data.get('include_posts', True)

        request.user.data_export_requested_at = timezone.now()
        request.user.save(update_fields=['data_export_requested_at', 'updated_at'])
        CacheManager.invalidate_user_profile(request.user.id)

        export_data = {
            'profile': UserProfileSerializer(request.user).data,
            'connections': [],
            'posts': [],
            'metadata': {
                'generated_at': timezone.now().isoformat(),
                'include_connections': include_connections,
                'include_posts': include_posts,
            }
        }

        if include_connections:
            connections = Connection.objects.filter(
                models.Q(requester=request.user) | models.Q(recipient=request.user),
                status='accepted'
            ).select_related('requester', 'recipient')
            export_data['connections'] = ConnectionSerializer(connections, many=True).data

        if include_posts:
            try:
                from posts.models import Post
                posts_qs = Post.objects.filter(author=request.user).order_by('-created_at')
                export_data['posts'] = [
                    {
                        'id': post.id,
                        'content': post.content,
                        'visibility': post.visibility,
                        'created_at': post.created_at.isoformat() if post.created_at else None,
                        'updated_at': post.updated_at.isoformat() if post.updated_at else None,
                    }
                    for post in posts_qs
                ]
            except Exception:
                export_data['posts'] = []

        return Response({
            'success': True,
            'data': export_data,
            'message': 'Data export generated successfully',
        }, status=status.HTTP_200_OK)


class BlockListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserBlock.objects.filter(blocker=self.request.user).select_related('blocked')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BlockCreateSerializer
        return BlockListItemSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        blocked_user = User.objects.get(id=serializer.validated_data['blocked_user_id'])
        block, created = UserBlock.objects.get_or_create(blocker=request.user, blocked=blocked_user)

        return Response({
            'success': True,
            'data': BlockListItemSerializer(block).data,
            'message': 'User blocked successfully' if created else 'User already blocked',
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class BlockDetailView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserBlock.objects.filter(blocker=self.request.user)

    def delete(self, request, *args, **kwargs):
        block = self.get_object()
        block.delete()
        return Response({
            'success': True,
            'message': 'User unblocked successfully',
        }, status=status.HTTP_200_OK)
