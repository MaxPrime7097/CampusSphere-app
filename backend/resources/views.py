from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.http import HttpResponse, Http404, StreamingHttpResponse
from django.db import models
from django.utils import timezone
import zipfile
import io
from .models import Resource, ResourceFolder, ResourceSave, ResourceView, ResourceReport, ResourceShareEvent
from .serializers import (
    ResourceSerializer, ResourceCreateSerializer, ResourceUpdateSerializer,
    ResourceSaveSerializer,
    ResourceFolderSerializer, ResourceFolderCreateSerializer, ResourceFolderUpdateSerializer,
)
from users.impact_policy import RESOURCE_DOWNLOADED, apply_impact_event


def _can_access_resource(resource, user):
    if resource.visibility == 'public':
        return True
    
    if not user.is_authenticated:
        return False

    if resource.author == user:
        return True
    
    if resource.visibility == 'university':
        return user.university and resource.author.university == user.university
    
    if resource.visibility == 'friends':
        from users.models import Connection
        return Connection.objects.filter(
            models.Q(requester=user, recipient=resource.author) |
            models.Q(requester=resource.author, recipient=user),
            status='accepted'
        ).exists()
    return False


def _can_access_folder(folder, user):
    if folder.visibility == 'public':
        return True
    
    if not user.is_authenticated:
        return False

    if folder.owner == user:
        return True
    
    if folder.visibility == 'university':
        return user.university and folder.owner.university == user.university
    
    if folder.visibility == 'friends':
        from users.models import Connection
        return Connection.objects.filter(
            models.Q(requester=user, recipient=folder.owner) |
            models.Q(requester=folder.owner, recipient=user),
            status='accepted'
        ).exists()
    return False


# ─────────────────────────────────────────────
# Folder views
# ─────────────────────────────────────────────

class FolderListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ResourceFolderCreateSerializer
        return ResourceFolderSerializer

    def get_queryset(self):
        return ResourceFolder.objects.filter(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        folder = serializer.save()
        output = ResourceFolderSerializer(folder, context={'request': request})
        return Response(
            {'success': True, 'data': output.data},
            status=status.HTTP_201_CREATED,
        )

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = ResourceFolderSerializer(qs, many=True, context={'request': request})
        return Response({'success': True, 'data': serializer.data})


class FolderDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ResourceFolderUpdateSerializer
        return ResourceFolderSerializer

    def get_queryset(self):
        return ResourceFolder.objects.filter(owner=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        folder = self.get_object()
        folder_data = ResourceFolderSerializer(folder, context={'request': request}).data
        # Include the folder's resources
        resources = folder.resources.select_related('author').all()
        resources_data = ResourceSerializer(resources, many=True, context={'request': request}).data
        return Response({
            'success': True,
            'data': {**folder_data, 'resources': resources_data},
        })

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        folder = self.get_object()
        serializer = self.get_serializer(folder, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        folder = serializer.save()
        output = ResourceFolderSerializer(folder, context={'request': request})
        return Response({'success': True, 'data': output.data})

    def destroy(self, request, *args, **kwargs):
        folder = self.get_object()
        # Resources stay, just lose their folder reference (SET_NULL)
        folder.delete()
        return Response({'success': True, 'message': 'Dossier supprimé.'}, status=status.HTTP_200_OK)


class FolderDownloadZipView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        # Allow owner AND users who can access the folder
        folder = get_object_or_404(ResourceFolder, pk=pk)
        if not _can_access_folder(folder, request.user):
            return Response(
                {'error': "Vous n'avez pas accès à ce dossier."},
                status=status.HTTP_403_FORBIDDEN,
            )

        resources = folder.resources.all()
        if not resources.exists():
            return Response(
                {'error': 'Ce dossier est vide.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        buffer = io.BytesIO()
        seen_names = {}
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            for resource in resources:
                if not resource.file:
                    continue
                try:
                    filename = resource.file.name.split('/')[-1]
                    # Deduplicate filenames
                    if filename in seen_names:
                        seen_names[filename] += 1
                        base, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
                        filename = f"{base}_{seen_names[filename]}.{ext}" if ext else f"{base}_{seen_names[filename]}"
                    else:
                        seen_names[filename] = 0
                    zf.writestr(filename, resource.file.read())
                except Exception:
                    continue

        buffer.seek(0)
        safe_name = folder.name.replace(' ', '_')
        response = HttpResponse(buffer.read(), content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="{safe_name}.zip"'
        return response





class ResourceListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [SearchFilter, OrderingFilter]  # Removed DjangoFilterBackend - not installed
    # filterset_fields = ['author', 'subject', 'type', 'visibility', 'audience']  # Commented out - django_filters not installed
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at', 'downloads_count', 'views_count', 'saves_count', 'impact_score']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Resource.objects.select_related('author')
        user = self.request.user

        # Filter resources based on visibility
        public_resources = queryset.filter(visibility='public')
        
        if not user.is_authenticated:
            return public_resources.distinct()

        # User's own resources
        user_resources = queryset.filter(author=user)
        
        # University resources (if visibility is university)
        university_resources = queryset.filter(
            visibility='university',
            author__university=user.university
        ) if user.university else queryset.none()
        
        # Friends resources (if visibility is friends)
        from users.models import Connection
        user_connections = Connection.objects.filter(
            models.Q(requester=user) | models.Q(recipient=user),
            status='accepted'
        )
        friend_ids = []
        for conn in user_connections:
            friend_ids.append(conn.requester.id if conn.recipient == user else conn.recipient.id)
        
        friends_resources = queryset.filter(author__in=friend_ids, visibility='friends')
        
        # Combine all accessible resources
        return (public_resources | user_resources | university_resources | friends_resources).distinct()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ResourceCreateSerializer
        return ResourceSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        resource = Resource.objects.select_related('author').get(pk=serializer.instance.pk)
        output_serializer = ResourceSerializer(resource, context={'request': request})
        headers = self.get_success_headers(output_serializer.data)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ResourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Resource.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ResourceUpdateSerializer
        return ResourceSerializer

    def get_object(self):
        resource = super().get_object()
        user = self.request.user

        # Check if user can access this resource
        if resource.visibility == 'public':
            return resource
        
        if not user.is_authenticated:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You must be logged in to view this private resource")

        if resource.author == user:
            return resource
        elif resource.visibility == 'university' and resource.author.university == user.university:
            return resource
        elif resource.visibility == 'friends':
            from users.models import Connection
            if Connection.objects.filter(
                models.Q(requester=user, recipient=resource.author) |
                models.Q(requester=resource.author, recipient=user),
                status='accepted'
            ).exists():
                return resource

        # If none of the above, deny access
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("You don't have permission to access this resource")

    def retrieve(self, request, *args, **kwargs):
        resource = self.get_object()
        
        # Track view if not the author and if authenticated
        if request.user.is_authenticated and resource.author != request.user:
            _, created = ResourceView.objects.get_or_create(
                resource=resource,
                user=request.user,
                defaults={'viewed_at': timezone.now()}
            )
            if created:
                resource.increment_views()

        return super().retrieve(request, *args, **kwargs)

    def perform_update(self, serializer):
        resource = self.get_object()
        if resource.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit your own resources")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own resources")
        instance.delete()


class ResourceDownloadView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        resource = get_object_or_404(Resource, pk=pk)
        user = request.user

        if not _can_access_resource(resource, user):
            return Response(
                {'error': 'You don\'t have permission to download this resource'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Track download
        resource.increment_downloads()
        
        # Apply impact for downloading another user's resource.
        if resource.author != user:
            apply_impact_event(user, RESOURCE_DOWNLOADED)

        try:
            response = HttpResponse(resource.file.read(), content_type=resource.file_type)
            response['Content-Disposition'] = f'attachment; filename="{resource.file.name.split("/")[-1]}"'
            return response
        except Exception as e:
            return Response(
                {'error': 'File not found or corrupted'},
                status=status.HTTP_404_NOT_FOUND
            )


class ResourcePreviewView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        resource = get_object_or_404(Resource, pk=pk)
        user = request.user

        if not _can_access_resource(resource, user):
            return Response(
                {'error': 'You don\'t have permission to preview this resource'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not resource.file:
            return Response(
                {'error': 'File not found or unavailable'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            'preview_url': request.build_absolute_uri(resource.file.url)
        })


class ResourceSaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        resource = get_object_or_404(Resource, pk=pk)
        user = request.user

        # Check if user can access this resource
        can_access = False
        if resource.visibility == 'public' or resource.author == user:
            can_access = True
        elif resource.visibility == 'university' and resource.author.university == user.university:
            can_access = True
        elif resource.visibility == 'friends':
            from users.models import Connection
            can_access = Connection.objects.filter(
                models.Q(requester=user, recipient=resource.author) |
                models.Q(requester=resource.author, recipient=user),
                status='accepted'
            ).exists()

        if not can_access:
            return Response(
                {'error': 'You don\'t have permission to save this resource'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Toggle save
        save, created = ResourceSave.objects.get_or_create(resource=resource, user=user)
        
        if not created:
            save.delete()
            saved = False
            resource.decrement_saves()
        else:
            saved = True
            resource.increment_saves()

        return Response({
            'success': True,
            'data': {
                'saved': saved,
                'savesCount': resource.saves_count
            },
            'timestamp': timezone.now().isoformat()
        })

    def delete(self, request, pk):
        resource = get_object_or_404(Resource, pk=pk)
        user = request.user

        save = get_object_or_404(ResourceSave, resource=resource, user=user)
        save.delete()
        resource.decrement_saves()

        return Response({
            'success': True,
            'data': {
                'saved': False,
                'savesCount': resource.saves_count
            },
            'timestamp': timezone.now().isoformat()
        })


class ResourceViewTrackingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        resource = get_object_or_404(Resource, pk=pk)
        user = request.user

        # Track view if not the author
        if resource.author != user:
            _, created = ResourceView.objects.get_or_create(
                resource=resource,
                user=user,
                defaults={'viewed_at': timezone.now()}
            )
            if created:
                resource.increment_views()

        return Response({
            'success': True,
            'data': {
                'viewsCount': resource.views_count
            },
            'timestamp': timezone.now().isoformat()
        })


class ResourceReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        resource = get_object_or_404(Resource, pk=pk)
        reporter = request.user

        if resource.author == reporter:
            return Response(
                {'detail': 'You cannot report your own resource.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = (request.data.get('reason') or 'inappropriate_content').strip()[:120]
        details = (request.data.get('details') or '').strip()

        report, created = ResourceReport.objects.update_or_create(
            resource=resource,
            reporter=reporter,
            defaults={
                'reason': reason or 'inappropriate_content',
                'details': details,
                'status': 'pending',
            }
        )

        return Response({
            'success': True,
            'data': {
                'id': report.id,
                'status': report.status,
                'created': created,
            },
            'message': 'Resource report submitted successfully.',
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class ResourceShareTrackingView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        resource = get_object_or_404(Resource, pk=pk)
        channel = (request.data.get('channel') or 'copy_link').strip()[:40]

        valid_channels = {choice[0] for choice in ResourceShareEvent.CHANNEL_CHOICES}
        if channel not in valid_channels:
            channel = 'unknown'

        ResourceShareEvent.objects.create(
            resource=resource,
            user=request.user if request.user.is_authenticated else None,
            channel=channel,
        )

        return Response({
            'success': True,
            'message': 'Share event recorded.',
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def sphere_resources(request, sphere_id):
    from spheres.models import Sphere, SphereMember
    sphere = get_object_or_404(Sphere, pk=sphere_id)
    if not SphereMember.objects.filter(sphere=sphere, user=request.user, status='active').exists():
        return Response({'error': 'You must be a member'}, status=403)
    resources = Resource.objects.filter(sphere=sphere).select_related('author').order_by('-created_at')
    serializer = ResourceSerializer(resources, many=True, context={'request': request})
    return Response({'success': True, 'data': serializer.data})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_saved_resources(request):
    """Get user's saved resources"""
    saves = ResourceSave.objects.filter(user=request.user).select_related('resource__author')
    resources = [save.resource for save in saves]
    
    # Apply pagination
    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(resources, request)
    
    serializer = ResourceSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_resources(request, user_id):
    """Get resources uploaded by a specific user"""
    from users.models import User
    
    user = get_object_or_404(User, pk=user_id)
    resources = Resource.objects.filter(author=user)
    
    # Filter based on visibility and current user's permissions
    current_user = request.user
    if user != current_user:
        # Only show public resources and university resources if same university
        public_resources = resources.filter(visibility='public')
        
        university_resources = resources.filter(
            visibility='university',
            author__university=current_user.university
        ) if current_user.university == user.university else resources.none()
        
        # Friends resources
        from users.models import Connection
        is_friend = Connection.objects.filter(
            models.Q(requester=current_user, recipient=user) |
            models.Q(requester=user, recipient=current_user),
            status='accepted'
        ).exists()
        
        if is_friend:
            friends_resources = resources.filter(visibility='friends')
            resources = (public_resources | university_resources | friends_resources).distinct()
        else:
            resources = (public_resources | university_resources).distinct()

    resources = resources.select_related('author').order_by('-created_at')

    # Apply pagination
    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(resources, request)
    
    serializer = ResourceSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)
