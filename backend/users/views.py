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
from .models import User, Connection
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    UserUpdateSerializer, ConnectionSerializer, ConnectionCreateSerializer,
    UserSearchSerializer, ChangePasswordSerializer, ChangeEmailSerializer,
    LogoutSerializer, DeleteAccountSerializer
)
from campus_sphere.cache import CacheManager, CacheKeys

logger = logging.getLogger(__name__)


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

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


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserProfileSerializer


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
        serializer.save(requester=self.request.user)


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
