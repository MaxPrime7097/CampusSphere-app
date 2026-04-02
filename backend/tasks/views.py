from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
# from django_filters.rest_framework import DjangoFilterBackend  # Commented out - django_filters not installed
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.db import models
from django.utils import timezone
from .models import Task
from .serializers import (
    TaskSerializer, TaskCreateSerializer, TaskUpdateSerializer,
    TaskAssignSerializer
)
from spheres.permissions import IsSphereMember, IsSphereModerator
from users.impact_policy import TASK_COMPLETED, apply_impact_points
from notifications.services import create_task_assigned_notification


class TaskListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]  # Removed DjangoFilterBackend - not installed
    # filterset_fields = ['sphere', 'assigned_to', 'priority', 'is_completed']  # Commented out - django_filters not installed
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'priority', 'impact_points']
    ordering = ['-is_completed', 'due_date', '-priority', '-created_at']

    def get_queryset(self):
        # Only show tasks from spheres user is a member of
        from spheres.models import SphereMember
        user_spheres = SphereMember.objects.filter(
            user=self.request.user,
            status='active'
        ).values_list('sphere', flat=True)
        
        return Task.objects.filter(
            sphere__in=user_spheres
        ).select_related('assigned_to', 'created_by', 'sphere')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TaskCreateSerializer
        return TaskSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        task = Task.objects.select_related('assigned_to', 'created_by', 'sphere').get(pk=serializer.instance.pk)
        output_serializer = TaskSerializer(task, context={'request': request})
        headers = self.get_success_headers(output_serializer.data)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only show tasks from spheres user is a member of
        from spheres.models import SphereMember
        user_spheres = SphereMember.objects.filter(
            user=self.request.user,
            status='active'
        ).values_list('sphere', flat=True)
        
        return Task.objects.filter(sphere__in=user_spheres)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return TaskUpdateSerializer
        return TaskSerializer

    def perform_update(self, serializer):
        task = self.get_object()
        user = self.request.user
        
        # Check if user can edit (creator or sphere moderator/admin)
        can_edit = task.created_by == user
        if not can_edit:
            from spheres.models import SphereMember
            can_edit = SphereMember.objects.filter(
                sphere=task.sphere,
                user=user,
                role__in=['admin', 'moderator'],
                status='active'
            ).exists()

        if not can_edit:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to edit this task")

        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        
        # Check if user can delete (creator or sphere admin)
        can_delete = instance.created_by == user
        if not can_delete:
            from spheres.models import SphereMember
            can_delete = SphereMember.objects.filter(
                sphere=instance.sphere,
                user=user,
                role='admin',
                status='active'
            ).exists()

        if not can_delete:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to delete this task")

        instance.delete()


class TaskCompleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        user = request.user

        # Check if user is a member of the sphere
        from spheres.models import SphereMember
        if not SphereMember.objects.filter(
            sphere=task.sphere,
            user=user,
            status='active'
        ).exists():
            return Response(
                {'error': 'You must be a member of this sphere'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if user can complete the task
        can_complete = (
            task.assigned_to == user or
            SphereMember.objects.filter(
                sphere=task.sphere,
                user=user,
                role__in=['admin', 'moderator'],
                status='active'
            ).exists()
        )

        if not can_complete:
            return Response(
                {'error': 'You don\'t have permission to complete this task'},
                status=status.HTTP_403_FORBIDDEN
            )

        if task.is_completed:
            return Response(
                {'error': 'Task is already completed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Complete the task and award impact points
        impact_points_earned = task.complete()
        
        # Award impact points to assigned user or completer
        recipient = task.assigned_to if task.assigned_to else user
        apply_impact_points(recipient, impact_points_earned)

        return Response({
            'success': True,
            'data': {
                'task': TaskSerializer(task, context={'request': request}).data,
                'impactEvent': TASK_COMPLETED,
                'impactPointsEarned': impact_points_earned,
                'newImpactScore': recipient.impact_score
            },
            'message': 'Task completed successfully',
            'timestamp': timezone.now().isoformat()
        })


class TaskAssignView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        user = request.user

        # Check if user can assign tasks (creator or sphere moderator/admin)
        can_assign = task.created_by == user
        if not can_assign:
            from spheres.models import SphereMember
            can_assign = SphereMember.objects.filter(
                sphere=task.sphere,
                user=user,
                role__in=['admin', 'moderator'],
                status='active'
            ).exists()

        if not can_assign:
            return Response(
                {'error': 'You don\'t have permission to assign this task'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = TaskAssignSerializer(data=request.data, context={'task': task})
        serializer.is_valid(raise_exception=True)

        from users.models import User
        assigned_user = User.objects.get(id=serializer.validated_data['assigned_to_id'])
        task.assigned_to = assigned_user
        task.save(update_fields=['assigned_to', 'updated_at'])
        create_task_assigned_notification(task, user)

        return Response({
            'success': True,
            'data': TaskSerializer(task, context={'request': request}).data,
            'message': f'Task assigned to {assigned_user.full_name}',
            'timestamp': timezone.now().isoformat()
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def sphere_tasks(request, sphere_id):
    """Get tasks for a specific sphere"""
    from spheres.models import Sphere, SphereMember
    
    sphere = get_object_or_404(Sphere, pk=sphere_id)
    
    # Check if user is a member of the sphere
    if not SphereMember.objects.filter(sphere=sphere, user=request.user, status='active').exists():
        return Response(
            {'error': 'You must be a member of this sphere to view tasks'},
            status=status.HTTP_403_FORBIDDEN
        )

    tasks = Task.objects.filter(sphere=sphere).select_related('assigned_to', 'created_by')
    
    # Apply filters
    is_completed = request.query_params.get('is_completed')
    if is_completed is not None:
        tasks = tasks.filter(is_completed=is_completed.lower() == 'true')
    
    priority = request.query_params.get('priority')
    if priority:
        tasks = tasks.filter(priority=priority)
    
    assigned_to = request.query_params.get('assigned_to')
    if assigned_to:
        tasks = tasks.filter(assigned_to_id=assigned_to)

    tasks = tasks.order_by('-is_completed', 'due_date', '-priority', '-created_at')

    # Apply pagination
    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(tasks, request)
    
    serializer = TaskSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_tasks(request, user_id=None):
    """Get tasks assigned to a user or current user"""
    if user_id:
        from users.models import User
        user = get_object_or_404(User, pk=user_id)
    else:
        user = request.user

    # Get tasks assigned to the user from spheres current user is a member of
    from spheres.models import SphereMember
    user_spheres = SphereMember.objects.filter(
        user=request.user,
        status='active'
    ).values_list('sphere', flat=True)
    
    tasks = Task.objects.filter(
        assigned_to=user,
        sphere__in=user_spheres
    ).select_related('created_by', 'sphere')

    # Apply filters
    is_completed = request.query_params.get('is_completed')
    if is_completed is not None:
        tasks = tasks.filter(is_completed=is_completed.lower() == 'true')

    tasks = tasks.order_by('-is_completed', 'due_date', '-priority', '-created_at')

    # Apply pagination
    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(tasks, request)
    
    serializer = TaskSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)
