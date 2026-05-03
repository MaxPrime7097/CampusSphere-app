import logging
from django.conf import settings
from django.http import Http404
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
from .models import User, Connection, UserBlock, ContactMessage
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    UserUpdateSerializer, ConnectionSerializer, ConnectionCreateSerializer,
    UserSearchSerializer, ChangePasswordSerializer, ChangeEmailSerializer,
    LogoutSerializer, DeleteAccountSerializer, PrivacySettingsSerializer, PasswordResetSerializer,
    DataExportRequestSerializer, BlockListItemSerializer, BlockCreateSerializer,
    SupabaseProfileCompletionSerializer, normalize_email_for_lookup, normalize_username_for_lookup,
    ContactMessageSerializer
)
from campus_sphere.cache import CacheManager, CacheKeys
from notifications.services import create_connection_request_notification
from .throttles import AuthScopedRateThrottle

logger = logging.getLogger(__name__)


INCOMPLETE_PROFILE_NOT_ACCESSIBLE_MESSAGE = "This profile is not accessible until onboarding is completed."


def _are_accepted_connections(user_a, user_b):
    return Connection.objects.filter(
        models.Q(requester=user_a, recipient=user_b) | models.Q(requester=user_b, recipient=user_a),
        status='accepted'
    ).exists()


def _can_view_sensitive_profile_fields(request_user, target_user):
    return bool(
        request_user
        and request_user.is_authenticated
        and request_user.id == target_user.id
    )


def _apply_profile_privacy(user_data, request_user, target_user):
    """
    Redact sensitive profile fields for everyone except the profile owner.

    Note: `profile_visibility` can remain configurable for non-sensitive sections of
    the profile, but sensitive personal data now follows a strict `self` policy
    (no `connections` access).
    """
    if _can_view_sensitive_profile_fields(request_user, target_user):
        return user_data

    sensitive_fields = [
        'email',
        'phone_number',
        'phoneNumber',
        'date_of_birth',
        'dateOfBirth',
        'student_id',
        'studentId',
        'town',
        'language',
        'data_export_requested_at',
    ]
    for field in sensitive_fields:
        user_data[field] = None

    return user_data


def _can_access_profile(request_user, target_user):
    if target_user.is_profile_complete:
        return True

    if not request_user or not request_user.is_authenticated:
        return False

    return request_user.id == target_user.id


def _enforce_profile_access(request_user, target_user):
    if not _can_access_profile(request_user, target_user):
        raise Http404(INCOMPLETE_PROFILE_NOT_ACCESSIBLE_MESSAGE)


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


class CheckAvailabilityView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthScopedRateThrottle]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        email = (request.data.get("email") or "").strip().lower()

        response_data = {}
        if username:
            response_data["username_available"] = not User.objects.filter(
                username__iexact=username
            ).exists()
        if email:
            response_data["email_available"] = not User.objects.filter(
                email__iexact=email
            ).exists()

        if not response_data:
            return Response(
                {
                    "success": False,
                    "error": "Provide username and/or email to check availability.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"success": True, "data": response_data}, status=status.HTTP_200_OK)


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


def _delete_supabase_user(supabase_uid: str) -> None:
    """Best-effort deletion of the Supabase Auth user via the admin API."""
    from django.conf import settings as django_settings
    supabase_url = getattr(django_settings, "SUPABASE_URL", "").strip().rstrip("/")
    service_key = getattr(django_settings, "SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not supabase_url or not service_key or not supabase_uid:
        return
    try:
        import requests as req
        req.delete(
            f"{supabase_url}/auth/v1/admin/users/{supabase_uid}",
            headers={
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
            },
            timeout=5,
        )
    except Exception:
        logger.warning("Failed to delete Supabase user %s", supabase_uid, exc_info=True)


class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        serializer = DeleteAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        supabase_uid = getattr(request.user, "supabase_uid", None)
        request.user.delete()
        if supabase_uid:
            _delete_supabase_user(supabase_uid)

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
        _enforce_profile_access(request.user, user)
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
        return queryset.filter(
            is_profile_complete=True
        ).exclude(id=self.request.user.id)


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

    def patch(self, request, *args, **kwargs):
        target_user = self._get_target_user()
        existing_connection = self._get_existing_connection(request.user, target_user)
        
        if not existing_connection:
            return Response(
                {'detail': 'Connection not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        if existing_connection.recipient != request.user:
            return Response(
                {'detail': 'Only the recipient can accept the connection request.'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        if existing_connection.status == 'accepted':
            return Response(
                {'detail': 'Connection is already accepted.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        existing_connection.status = 'accepted'
        existing_connection.save()
        
        try:
            from notifications.services import create_connection_accepted_notification
            create_connection_accepted_notification(existing_connection)
        except ImportError:
            pass

        return Response({
            'success': True,
            'data': ConnectionSerializer(existing_connection).data,
            'message': 'Connection accepted successfully.'
        }, status=status.HTTP_200_OK)


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
@permission_classes([permissions.AllowAny])
def current_user_profile(request):
    if not request.user or not request.user.is_authenticated:
        return Response({
            'success': True,
            'authenticated': False,
            'data': None
        })

    cache_key = CacheKeys.user_profile(request.user.id)

    user_data = CacheManager.get_or_set(
        cache_key,
        lambda: UserProfileSerializer(request.user).data,
        CacheManager.USER_PROFILE_TTL
    )

    return Response({
        'success': True,
        'authenticated': True,
        'data': user_data,
        'timestamp': request.user.updated_at.isoformat()
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_user_by_username(request, username):
    """Get user profile by username"""
    try:
        user = User.objects.get(username=username)
        _enforce_profile_access(request.user, user)
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


class SupabaseTokenExchangeView(APIView):
    """Échanger un token Supabase contre un token Django JWT"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        access_token = request.data.get('access_token')
        if not access_token:
            return Response({'error': 'access_token requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from supabase import create_client
            from django.conf import settings
            
            # Vérifier le token avec Supabase
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
            user_response = supabase.auth.get_user(access_token)
            
            if not user_response.user:
                return Response({'error': 'Token invalide'}, status=status.HTTP_401_UNAUTHORIZED)
            
            supabase_user = user_response.user
            
            # Chercher ou créer l'utilisateur Django
            supabase_email = normalize_email_for_lookup(supabase_user.email)
            default_username = normalize_username_for_lookup(
                supabase_user.user_metadata.get('username') or (supabase_email.split('@')[0] if supabase_email else '')
            )
            user, created = User.objects.get_or_create(
                supabase_uid=supabase_user.id,
                defaults={
                    'email': supabase_email,
                    'username': default_username,  # Temporaire
                    'first_name': supabase_user.user_metadata.get('first_name', ''),
                    'last_name': supabase_user.user_metadata.get('last_name', ''),
                    'is_profile_complete': False,
                }
            )
            
            # Déterminer si le profil doit être complété.
            # Important: this must be data-driven (required fields), not provider-driven,
            # otherwise OAuth users can be redirected to home before finishing onboarding.
            required_fields = ['username', 'university', 'faculty', 'study_year', 'student_id']
            is_complete = all(getattr(user, field, None) for field in required_fields)

            if user.is_profile_complete != is_complete:
                user.is_profile_complete = is_complete
                user.save(update_fields=['is_profile_complete'])

            needs_completion = not is_complete
            
            # Générer les tokens JWT Django
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'success': True,
                'data': {
                    'user': UserProfileSerializer(user).data,
                    'tokens': {
                        'accessToken': str(refresh.access_token),
                        'refreshToken': str(refresh),
                    },
                    'needs_profile_completion': needs_completion,
                    'is_new_user': created
                }
            })
            
        except Exception as e:
            logger.error(f"Erreur lors de l'échange de token Supabase: {e}")
            return Response({'error': 'Erreur serveur'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CompleteSupabaseProfileView(APIView):
    """Compléter le profil après inscription Supabase"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.is_profile_complete:
            return Response({'error': 'Profil déjà complet'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = SupabaseProfileCompletionSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        CacheManager.invalidate_user_profile(user.id)
        
        return Response({
            'success': True,
            'data': UserProfileSerializer(user).data,
            'message': 'Profil complété avec succès'
        })

class UserVerificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        student_id = request.data.get('student_id')
        card_image = request.FILES.get('card_image')

        if not student_id or not card_image:
            return Response({
                'success': False,
                'error': 'student_id and card_image are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Update user fields
        user.student_id = student_id
        user.card_image = card_image
        user.save()

        # Automatic AI Verification
        from .verification_service import analyze_student_card
        
        # We use a copy of the file for analysis because it might be closed/consumed
        analysis_result = analyze_student_card(
            card_image, 
            user.full_name, 
            user.university
        )

        if analysis_result.get("verified"):
            user.is_verified = True
            user.save(update_fields=['is_verified'])
            
            # Instant real-time notification
            try:
                from notifications.services import create_verification_notification
                create_verification_notification(user, success=True)
            except Exception:
                pass
                
            return Response({
                'success': True,
                'verified': True,
                'message': 'Votre compte a été certifié instantanément par notre IA ! 🎉'
            }, status=status.HTTP_200_OK)

        return Response({
            'success': True,
            'verified': False,
            'message': 'Demande soumise. Notre équipe va vérifier votre carte manuellement.',
            'ai_reason': analysis_result.get("reason")
        }, status=status.HTTP_200_OK)


class ContactMessageCreateView(generics.CreateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]

class ContactMessageListView(generics.ListAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [SearchFilter]
    search_fields = ['name', 'email', 'subject', 'message']

class ContactMessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.IsAdminUser]
