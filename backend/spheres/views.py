import logging

from rest_framework import generics, status, permissions, serializers
from rest_framework.exceptions import APIException, PermissionDenied, ValidationError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
# from django_filters.rest_framework import DjangoFilterBackend  # Commented out - django_filters not installed
from rest_framework.filters import SearchFilter
from django.shortcuts import get_object_or_404
from django.db import models
from django.utils import timezone
from .models import Sphere, SphereMember
from .serializers import (
    SphereSerializer, SphereCreateSerializer, SphereUpdateSerializer,
    SphereMemberSerializer, SphereMemberCreateSerializer, SphereJoinSerializer,
    SphereMemberUpdateSerializer
)
from .permissions import IsSphereModerator, IsSphereMember
from campus_sphere.cache import CacheManager, CacheKeys


logger = logging.getLogger(__name__)



def filter_active_spheres(queryset):
    now = timezone.now()
    return queryset.filter(models.Q(expires_at__isnull=True) | models.Q(expires_at__gt=now))


class SphereExtendDurationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        sphere = get_object_or_404(Sphere, pk=pk)

        if sphere.created_by_id != request.user.id:
            return Response(
                {'error': 'Only the sphere creator can extend the duration'},
                status=status.HTTP_403_FORBIDDEN
            )

        duration = request.data.get('duration')
        if not duration:
            raise serializers.ValidationError({'duration': 'This field is required'})

        base_datetime = sphere.expires_at if sphere.expires_at and sphere.expires_at > timezone.now() else timezone.now()
        new_expiry = Sphere.compute_expiry_from_duration(duration, from_datetime=base_datetime)

        if new_expiry is None:
            return Response(
                {'error': 'Unsupported duration. Use finite duration values to extend the sphere.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        sphere.duration = duration
        sphere.expires_at = new_expiry
        sphere.save(update_fields=['duration', 'expires_at', 'updated_at'])

        serializer = SphereSerializer(sphere, context={'request': request})
        return Response({'success': True, 'data': serializer.data})

class SphereListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [SearchFilter]  # Removed DjangoFilterBackend - not installed
    # filterset_fields = ['category', 'type', 'is_private']  # Commented out - django_filters not installed
    search_fields = ['name', 'description']

    def get_queryset(self):
        # Filter out private spheres unless user is a member
        user = self.request.user
        private_spheres = Sphere.objects.filter(
            is_private=True,
            members__user=user,
            members__status='active'
        )
        public_spheres = Sphere.objects.filter(is_private=False)
        return filter_active_spheres((private_spheres | public_spheres).distinct())

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SphereCreateSerializer
        return SphereSerializer

    def perform_create(self, serializer):
        sphere = serializer.save()
        # Add creator as admin member
        SphereMember.objects.create(
            sphere=sphere,
            user=self.request.user,
            role='admin',
            status='active'
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        sphere = Sphere.objects.get(pk=serializer.instance.pk)
        output_serializer = SphereSerializer(sphere, context={'request': request})
        headers = self.get_success_headers(output_serializer.data)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class SphereDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Sphere.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        sphere_id = self.kwargs.get('pk')
        cache_key = CacheKeys.sphere_detail(sphere_id)
        user_id = getattr(self.request.user, 'id', None)

        try:
            sphere = CacheManager.get_or_set(
                cache_key,
                lambda: generics.RetrieveUpdateDestroyAPIView.get_object(self),
                CacheManager.SPHERE_DETAIL_TTL
            )

            if sphere.is_expired and self.request.method in ['GET', 'POST']:
                raise ValidationError({'detail': 'This sphere has expired'})

            if sphere.is_private and sphere.created_by_id != user_id:
                is_active_member = sphere.members.filter(user=self.request.user, status='active').exists()
                if not is_active_member:
                    raise PermissionDenied('This private sphere is only visible to active members')

            return sphere
        except Exception:
            logger.exception(
                'SphereDetailView.get_object failed (sphere_id=%s user_id=%s method=%s)',
                sphere_id,
                user_id,
                self.request.method,
            )
            raise

    def _error_response(self, error, detail, status_code):
        return Response(
            {
                'error': error,
                'detail': detail,
                'timestamp': timezone.now().isoformat(),
            },
            status=status_code,
        )

    def retrieve(self, request, *args, **kwargs):
        sphere_id = kwargs.get('pk')
        user_id = getattr(request.user, 'id', None)

        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except ValidationError as exc:
            logger.exception(
                'Sphere detail validation failed (sphere_id=%s user_id=%s method=%s)',
                sphere_id,
                user_id,
                request.method,
            )
            detail = exc.detail
            if isinstance(detail, dict) and 'detail' in detail:
                detail = detail['detail']
            return self._error_response('validation_error', detail, status.HTTP_400_BAD_REQUEST)
        except APIException as exc:
            logger.exception(
                'Sphere detail API exception (sphere_id=%s user_id=%s method=%s)',
                sphere_id,
                user_id,
                request.method,
            )
            return self._error_response('api_error', exc.detail, exc.status_code)
        except Exception:
            logger.exception(
                'Sphere detail serialization failed (sphere_id=%s user_id=%s method=%s)',
                sphere_id,
                user_id,
                request.method,
            )
            return self._error_response(
                'internal_server_error',
                'An unexpected error occurred while loading sphere details.',
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return SphereUpdateSerializer
        return SphereSerializer

    def _is_creator(self, sphere, user):
        return sphere.created_by_id == user.id

    def _forbidden_response(self):
        return Response(
            {'error': 'Only the sphere creator can modify or delete this sphere'},
            status=status.HTTP_403_FORBIDDEN
        )

    def update(self, request, *args, **kwargs):
        sphere = self.get_object()
        if not self._is_creator(sphere, request.user):
            return self._forbidden_response()
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        sphere = self.get_object()
        if not self._is_creator(sphere, request.user):
            return self._forbidden_response()
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        sphere = self.get_object()
        if not self._is_creator(sphere, request.user):
            return self._forbidden_response()
        return super().destroy(request, *args, **kwargs)


class SphereJoinView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        sphere = get_object_or_404(filter_active_spheres(Sphere.objects.all()), pk=pk)
        serializer = SphereJoinSerializer(data=request.data, context={'request': request, 'sphere': sphere})
        serializer.is_valid(raise_exception=True)

        # Determine membership status based on sphere settings
        membership_status = 'pending' if sphere.require_approval else 'active'

        existing_membership = SphereMember.objects.filter(
            sphere=sphere,
            user=request.user
        ).first()

        if existing_membership and existing_membership.status in ['pending', 'active']:
            return Response(
                {'error': 'You already have an active or pending membership for this sphere'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if existing_membership:
            existing_membership.role = 'member'
            existing_membership.status = membership_status
            existing_membership.joined_at = timezone.now()
            existing_membership.save(update_fields=['role', 'status', 'joined_at'])
            membership = existing_membership
        else:
            membership = SphereMember.objects.create(
                sphere=sphere,
                user=request.user,
                role='member',
                status=membership_status
            )

        # Update member count
        sphere.update_member_count()

        message = "Successfully joined the sphere" if membership_status == 'active' else "Join request sent for approval"

        return Response({
            'success': True,
            'data': {
                'status': membership_status,
                'message': message
            },
            'timestamp': membership.joined_at.isoformat()
        })


class SphereLeaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        sphere = get_object_or_404(filter_active_spheres(Sphere.objects.all()), pk=pk)
        membership = get_object_or_404(
            SphereMember,
            sphere=sphere,
            user=request.user,
            status='active'
        )

        # Check if user is the only admin
        if membership.role == 'admin':
            admin_count = sphere.members.filter(role='admin', status='active').count()
            if admin_count <= 1:
                return Response(
                    {'error': 'Cannot leave sphere as the only admin. Transfer admin rights first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        membership.delete()
        sphere.update_member_count()

        return Response({
            'success': True,
            'message': 'Successfully left the sphere',
            'timestamp': timezone.now().isoformat()
        })


class SphereCancelJoinRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        sphere = get_object_or_404(filter_active_spheres(Sphere.objects.all()), pk=pk)
        membership = SphereMember.objects.filter(
            sphere=sphere,
            user=request.user,
            status='pending'
        ).first()

        if membership is None:
            return Response(
                {'error': 'No pending join request found for this sphere'},
                status=status.HTTP_404_NOT_FOUND
            )

        membership.delete()

        return Response({
            'success': True,
            'message': 'Join request cancelled successfully',
            'timestamp': timezone.now().isoformat()
        })


class SphereMembersView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    # filter_backends = [DjangoFilterBackend]  # Commented out - django_filters not installed
    # filterset_fields = ['role', 'status']  # Commented out - django_filters not installed

    def get_queryset(self):
        sphere = get_object_or_404(filter_active_spheres(Sphere.objects.all()), pk=self.kwargs['pk'])
        return sphere.members.select_related('user').order_by('-joined_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SphereMemberCreateSerializer
        return SphereMemberSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['sphere'] = get_object_or_404(filter_active_spheres(Sphere.objects.all()), pk=self.kwargs['pk'])
        return context

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsSphereModerator()]
        return [IsSphereMember()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        membership = SphereMember.objects.select_related('user', 'sphere').get(pk=serializer.instance.pk)
        output_serializer = SphereMemberSerializer(membership, context=self.get_serializer_context())
        headers = self.get_success_headers(output_serializer.data)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class SphereMemberDetailView(generics.UpdateAPIView, generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        sphere = get_object_or_404(filter_active_spheres(Sphere.objects.all()), pk=self.kwargs['sphere_pk'])
        return SphereMember.objects.filter(sphere=sphere).select_related('user', 'sphere')

    def get_serializer_class(self):
        if self.request.method in ['PATCH', 'PUT']:
            return SphereMemberUpdateSerializer
        return SphereMemberSerializer

    def _get_actor_membership(self, request, sphere):
        return SphereMember.objects.filter(
            sphere=sphere,
            user=request.user,
            status='active'
        ).first()

    def _can_manage_members(self, request, sphere):
        actor_membership = self._get_actor_membership(request, sphere)
        return actor_membership and actor_membership.role in ['admin', 'moderator']

    def partial_update(self, request, *args, **kwargs):
        membership = self.get_object()
        sphere = membership.sphere
        actor_membership = self._get_actor_membership(request, sphere)

        if not self._can_manage_members(request, sphere):
            return Response(
                {'error': 'Only sphere admins or moderators can update members'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(membership, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updates = serializer.validated_data

        if 'role' in updates and actor_membership.role != 'admin':
            return Response(
                {'error': 'Only sphere admins can change member roles'},
                status=status.HTTP_403_FORBIDDEN
            )

        next_role = updates.get('role', membership.role)
        next_status = updates.get('status', membership.status)

        if membership.role == 'admin' and (next_role != 'admin' or next_status != 'active'):
            other_admin_count = sphere.members.filter(
                role='admin',
                status='active'
            ).exclude(id=membership.id).count()
            if other_admin_count == 0:
                return Response(
                    {'error': 'Cannot remove or demote the last admin from the sphere'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer.save()

        return Response({
            'success': True,
            'message': 'Member updated successfully',
            'data': SphereMemberSerializer(membership, context={'request': request}).data
        })

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        membership = self.get_object()
        sphere = membership.sphere
        actor_membership = self._get_actor_membership(request, sphere)

        if not actor_membership or actor_membership.role not in ['admin', 'moderator']:
            return Response(
                {'error': 'Only sphere moderators or admins can remove members'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Prevent removing the last admin
        if membership.role == 'admin':
            admin_count = sphere.members.filter(
                role='admin',
                status='active'
            ).exclude(id=membership.id).count()
            if admin_count == 0:
                return Response(
                    {'error': 'Cannot remove the last admin from the sphere'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        membership.delete()
        sphere.update_member_count()

        return Response({
            'success': True,
            'message': 'Member removed successfully'
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_spheres(request):
    """Get spheres where user is a member"""
    memberships = SphereMember.objects.filter(
        user=request.user,
        status='active'
    ).select_related('sphere')

    spheres = [membership.sphere for membership in memberships if not membership.sphere.is_expired]
    serializer = SphereSerializer(spheres, many=True, context={'request': request})

    return Response({
        'success': True,
        'data': serializer.data,
        'timestamp': timezone.now().isoformat()
    })
