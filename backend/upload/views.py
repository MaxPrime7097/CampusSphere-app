from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import UploadedFile
from .serializers import FileUploadSerializer, UploadedFileSerializer


class FileUploadView(generics.CreateAPIView):
    serializer_class = FileUploadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uploaded_file = serializer.save()

        return Response({
            'success': True,
            'data': UploadedFileSerializer(uploaded_file).data,
            'message': 'File uploaded successfully',
            'timestamp': uploaded_file.uploaded_at.isoformat()
        }, status=status.HTTP_201_CREATED)


class FileDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = UploadedFileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UploadedFile.objects.filter(uploaded_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        uploaded_file = self.get_object()
        
        # Delete the actual file
        if uploaded_file.file:
            uploaded_file.file.delete()
        
        uploaded_file.delete()

        return Response({
            'success': True,
            'message': 'File deleted successfully',
            'timestamp': timezone.now().isoformat()
        })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_avatar(request, user_id):
    """Upload avatar for a user"""
    from users.models import User
    
    user = get_object_or_404(User, pk=user_id)
    
    # Only allow users to upload their own avatar
    if user != request.user:
        return Response(
            {'error': 'You can only upload your own avatar'},
            status=status.HTTP_403_FORBIDDEN
        )

    if 'file' not in request.FILES:
        return Response(
            {'error': 'No file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create upload record
    serializer = FileUploadSerializer(
        data={'file': request.FILES['file'], 'type': 'avatar'},
        context={'request': request}
    )
    serializer.is_valid(raise_exception=True)
    uploaded_file = serializer.save()

    # Update user's avatar
    user.avatar = uploaded_file.file
    user.save(update_fields=['avatar'])

    return Response({
        'success': True,
        'data': {
            'file': UploadedFileSerializer(uploaded_file).data,
            'avatar_url': user.avatar.url if user.avatar else None
        },
        'message': 'Avatar uploaded successfully',
        'timestamp': uploaded_file.uploaded_at.isoformat()
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_cover_photo(request, user_id):
    """Upload cover photo for a user"""
    from users.models import User
    
    user = get_object_or_404(User, pk=user_id)
    
    # Only allow users to upload their own cover photo
    if user != request.user:
        return Response(
            {'error': 'You can only upload your own cover photo'},
            status=status.HTTP_403_FORBIDDEN
        )

    if 'file' not in request.FILES:
        return Response(
            {'error': 'No file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create upload record
    serializer = FileUploadSerializer(
        data={'file': request.FILES['file'], 'type': 'cover'},
        context={'request': request}
    )
    serializer.is_valid(raise_exception=True)
    uploaded_file = serializer.save()

    # Update user's cover photo
    user.cover_photo = uploaded_file.file
    user.save(update_fields=['cover_photo'])

    return Response({
        'success': True,
        'data': {
            'file': UploadedFileSerializer(uploaded_file).data,
            'cover_photo_url': user.cover_photo.url if user.cover_photo else None
        },
        'message': 'Cover photo uploaded successfully',
        'timestamp': uploaded_file.uploaded_at.isoformat()
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_uploads(request):
    """Get all uploads for the current user"""
    uploads = UploadedFile.objects.filter(uploaded_by=request.user)
    
    # Filter by type if specified
    upload_type = request.query_params.get('type')
    if upload_type:
        uploads = uploads.filter(upload_type=upload_type)

    uploads = uploads.order_by('-uploaded_at')

    # Apply pagination
    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(uploads, request)
    
    serializer = UploadedFileSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def upload_stats(request):
    """Get upload statistics for the current user"""
    user = request.user
    
    total_uploads = UploadedFile.objects.filter(uploaded_by=user).count()
    total_size = UploadedFile.objects.filter(uploaded_by=user).aggregate(
        total=models.Sum('file_size')
    )['total'] or 0

    # Count by type
    type_counts = {}
    for upload_type, _ in UploadedFile.TYPE_CHOICES:
        count = UploadedFile.objects.filter(
            uploaded_by=user,
            upload_type=upload_type
        ).count()
        if count > 0:
            type_counts[upload_type] = count

    return Response({
        'success': True,
        'data': {
            'total_uploads': total_uploads,
            'total_size_bytes': total_size,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'by_type': type_counts
        },
        'timestamp': timezone.now().isoformat()
    })
