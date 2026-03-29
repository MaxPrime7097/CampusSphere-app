from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
# from django_filters.rest_framework import DjangoFilterBackend  # Commented out - django_filters not installed
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.db import models
from django.utils import timezone
from .models import Post, PostLike, PostSave, PostReport, Comment, CommentLike
from .serializers import (
    PostSerializer, PostCreateSerializer, PostUpdateSerializer,
    CommentSerializer, CommentCreateSerializer, PostReportSerializer
)


def user_can_access_post(user, post):
    if post.visibility == 'public' or post.author == user:
        return True
    if post.visibility == 'sphere' and post.sphere:
        from spheres.models import SphereMember
        return SphereMember.objects.filter(sphere=post.sphere, user=user, status='active').exists()
    if post.visibility == 'friends':
        from users.models import Connection
        return Connection.objects.filter(
            models.Q(requester=user, recipient=post.author) |
            models.Q(requester=post.author, recipient=user),
            status='accepted'
        ).exists()
    return False


class PostListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]  # Removed DjangoFilterBackend - not installed
    # filterset_fields = ['sphere', 'author', 'category', 'subject', 'type', 'visibility']  # Commented out - django_filters not installed
    search_fields = ['content', 'tags']
    ordering_fields = ['created_at', 'likes_count', 'comments_count', 'impact_score']
    ordering = ['-is_pinned', '-created_at']

    def get_queryset(self):
        queryset = Post.objects.select_related('author', 'sphere').prefetch_related('likes', 'comments')
        user = self.request.user

        # Filter posts based on visibility and user permissions
        public_posts = queryset.filter(visibility='public')
        
        # User's own posts
        user_posts = queryset.filter(author=user)
        
        # Posts from spheres user is a member of
        from spheres.models import SphereMember
        user_spheres = SphereMember.objects.filter(user=user, status='active').values_list('sphere', flat=True)
        sphere_posts = queryset.filter(sphere__in=user_spheres, visibility='sphere')
        
        # Friends posts (if visibility is friends)
        from users.models import Connection
        user_connections = Connection.objects.filter(
            models.Q(requester=user) | models.Q(recipient=user),
            status='accepted'
        )
        friend_ids = []
        for conn in user_connections:
            friend_ids.append(conn.requester.id if conn.recipient == user else conn.recipient.id)
        
        friends_posts = queryset.filter(author__in=friend_ids, visibility='friends')
        
        # Combine all accessible posts
        return (public_posts | user_posts | sphere_posts | friends_posts).distinct()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PostCreateSerializer
        return PostSerializer

    def perform_create(self, serializer):
        post = serializer.save()
        # Update author's impact score
        post.author.impact_score += 10
        post.author.save(update_fields=['impact_score'])

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        post = Post.objects.select_related('author', 'sphere').prefetch_related('likes', 'comments').get(
            pk=serializer.instance.pk
        )
        output_serializer = PostSerializer(post, context={'request': request})
        headers = self.get_success_headers(output_serializer.data)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return PostUpdateSerializer
        return PostSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_object(self):
        post = super().get_object()
        user = self.request.user

        # Check if user can access this post
        if post.visibility == 'public':
            return post
        elif post.author == user:
            return post
        elif post.visibility == 'sphere' and post.sphere:
            from spheres.models import SphereMember
            if SphereMember.objects.filter(sphere=post.sphere, user=user, status='active').exists():
                return post
        elif post.visibility == 'friends':
            from users.models import Connection
            if Connection.objects.filter(
                models.Q(requester=user, recipient=post.author) |
                models.Q(requester=post.author, recipient=user),
                status='accepted'
            ).exists():
                return post

        # If none of the above, check if user can access
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("You don't have permission to access this post")

    def perform_update(self, serializer):
        post = self.get_object()
        if post.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit your own posts")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        # Check if user can delete (author or sphere moderator/admin)
        can_delete = instance.author == user
        
        if not can_delete and instance.sphere:
            from spheres.models import SphereMember
            can_delete = SphereMember.objects.filter(
                sphere=instance.sphere,
                user=user,
                role__in=['admin', 'moderator'],
                status='active'
            ).exists()

        if not can_delete:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to delete this post")

        instance.delete()


class PostLikeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        user = request.user

        if not user_can_access_post(user, post):
            return Response(
                {'error': 'You don\'t have permission to access this post'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Toggle like
        like, created = PostLike.objects.get_or_create(post=post, user=user)
        
        if not created:
            like.delete()
            liked = False
        else:
            liked = True

        # Update post counts
        post.update_counts()

        return Response({
            'success': True,
            'data': {
                'liked': liked,
                'likesCount': post.get_likes_count()
            },
            'timestamp': timezone.now().isoformat()
        })


class PostSaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        user = request.user

        if not user_can_access_post(user, post):
            return Response(
                {'error': 'You don\'t have permission to access this post'},
                status=status.HTTP_403_FORBIDDEN
            )

        save, created = PostSave.objects.get_or_create(post=post, user=user)
        if not created:
            save.delete()
            saved = False
        else:
            saved = True

        return Response({
            'success': True,
            'data': {
                'saved': saved,
            },
            'timestamp': timezone.now().isoformat()
        })

    def delete(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        user = request.user
        save = get_object_or_404(PostSave, post=post, user=user)
        save.delete()
        return Response({
            'success': True,
            'data': {
                'saved': False,
            },
            'timestamp': timezone.now().isoformat()
        })


class PostReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        user = request.user

        if not user_can_access_post(user, post):
            return Response(
                {'error': 'You don\'t have permission to access this post'},
                status=status.HTTP_403_FORBIDDEN
            )

        reason = (request.data.get('reason') or '').strip()
        details = (request.data.get('details') or '').strip()
        if not reason:
            return Response(
                {'error': 'Report reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        report, created = PostReport.objects.update_or_create(
            post=post,
            reporter=user,
            defaults={'reason': reason, 'details': details, 'status': 'pending'}
        )

        serializer = PostReportSerializer(report, context={'request': request})
        return Response({
            'success': True,
            'data': {
                'reported': True,
                'isNew': created,
                'report': serializer.data,
            },
            'timestamp': timezone.now().isoformat()
        })


class PostPinView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        user = request.user

        # Only sphere moderators/admins can pin posts
        if not post.sphere:
            return Response(
                {'error': 'Only sphere posts can be pinned'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from spheres.models import SphereMember
        if not SphereMember.objects.filter(
            sphere=post.sphere,
            user=user,
            role__in=['admin', 'moderator'],
            status='active'
        ).exists():
            return Response(
                {'error': 'Only sphere moderators and admins can pin posts'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Toggle pin status
        post.is_pinned = not post.is_pinned
        post.save(update_fields=['is_pinned'])

        return Response({
            'success': True,
            'data': {
                'isPinned': post.is_pinned,
                'message': 'Post pinned' if post.is_pinned else 'Post unpinned'
            },
            'timestamp': timezone.now().isoformat()
        })


class PostCommentsView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [OrderingFilter]
    ordering = ['created_at']

    def get_queryset(self):
        post = get_object_or_404(Post, pk=self.kwargs['pk'])
        return post.comments.filter(parent=None).select_related('author').prefetch_related('replies')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CommentCreateSerializer
        return CommentSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['post'] = get_object_or_404(Post, pk=self.kwargs['pk'])
        return context

    def perform_create(self, serializer):
        post = get_object_or_404(Post, pk=self.kwargs['pk'])
        
        # Check if comments are allowed
        if not post.allow_comments:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Comments are not allowed on this post")

        comment = serializer.save()
        # Update post comment count
        post.update_counts()
        
        # Update author's impact score
        comment.author.impact_score += 2
        comment.author.save(update_fields=['impact_score'])

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        comment = Comment.objects.select_related('author', 'post', 'parent').prefetch_related('replies').get(
            pk=serializer.instance.pk
        )
        output_serializer = CommentSerializer(comment, context=self.get_serializer_context())
        headers = self.get_success_headers(output_serializer.data)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class CommentLikeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        comment = get_object_or_404(Comment, pk=pk)
        user = request.user

        # Toggle like
        like, created = CommentLike.objects.get_or_create(comment=comment, user=user)
        
        if not created:
            like.delete()
            liked = False
        else:
            liked = True

        # Update comment counts
        comment.update_counts()

        return Response({
            'success': True,
            'data': {
                'liked': liked,
                'likesCount': comment.get_likes_count()
            },
            'timestamp': timezone.now().isoformat()
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def sphere_posts(request, sphere_id):
    """Get posts for a specific sphere"""
    from spheres.models import Sphere, SphereMember
    
    sphere = get_object_or_404(Sphere, pk=sphere_id)
    
    # Check if user is a member of the sphere
    if not SphereMember.objects.filter(sphere=sphere, user=request.user, status='active').exists():
        return Response(
            {'error': 'You must be a member of this sphere to view posts'},
            status=status.HTTP_403_FORBIDDEN
        )

    posts = Post.objects.filter(sphere=sphere).select_related('author').prefetch_related('likes', 'comments')
    posts = posts.order_by('-is_pinned', '-created_at')

    # Apply pagination
    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(posts, request)
    
    serializer = PostSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_posts(request, user_id):
    """Get posts for a specific user"""
    from users.models import User
    
    user = get_object_or_404(User, pk=user_id)
    posts = Post.objects.filter(author=user)
    
    # Filter based on visibility and current user's permissions
    current_user = request.user
    if user != current_user:
        # Only show public posts and posts from spheres current user is member of
        public_posts = posts.filter(visibility='public')
        
        from spheres.models import SphereMember
        user_spheres = SphereMember.objects.filter(user=current_user, status='active').values_list('sphere', flat=True)
        sphere_posts = posts.filter(sphere__in=user_spheres, visibility='sphere')
        
        # Friends posts
        from users.models import Connection
        is_friend = Connection.objects.filter(
            models.Q(requester=current_user, recipient=user) |
            models.Q(requester=user, recipient=current_user),
            status='accepted'
        ).exists()
        
        if is_friend:
            friends_posts = posts.filter(visibility='friends')
            posts = (public_posts | sphere_posts | friends_posts).distinct()
        else:
            posts = (public_posts | sphere_posts).distinct()

    posts = posts.select_related('author', 'sphere').prefetch_related('likes', 'comments')
    posts = posts.order_by('-created_at')

    # Apply pagination
    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(posts, request)
    
    serializer = PostSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_saved_posts(request):
    saves = PostSave.objects.filter(user=request.user).select_related('post__author', 'post__sphere')
    posts = [save.post for save in saves]

    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(posts, request)

    serializer = PostSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)
