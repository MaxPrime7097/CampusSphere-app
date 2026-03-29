from rest_framework import serializers
from .models import Post, PostLike, PostSave, PostReport, Comment, CommentLike


class CommentSerializer(serializers.ModelSerializer):
    author_info = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'content', 'author', 'author_info', 'parent', 'likes_count',
            'is_liked', 'replies', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def get_author_info(self, obj):
        from users.serializers import UserProfileSerializer
        return UserProfileSerializer(obj.author).data

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_replies(self, obj):
        if obj.parent is None:  # Only get replies for top-level comments
            replies = obj.replies.all()[:5]  # Limit to 5 replies
            return CommentSerializer(replies, many=True, context=self.context).data
        return []


class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['content', 'parent']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        validated_data['post'] = self.context['post']
        return super().create(validated_data)


class PostSerializer(serializers.ModelSerializer):
    author_info = serializers.SerializerMethodField()
    sphere_info = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    recent_comments = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'content', 'author', 'author_info', 'sphere', 'sphere_info',
            'category', 'visibility', 'subject', 'type', 'audience', 'location',
            'tags', 'files', 'allow_comments', 'is_pinned', 'likes_count',
            'comments_count', 'impact_score', 'is_liked', 'can_edit', 'can_delete',
            'is_saved',
            'recent_comments', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'author', 'likes_count', 'comments_count', 'impact_score',
            'created_at', 'updated_at'
        ]

    def get_author_info(self, obj):
        from users.serializers import UserProfileSerializer
        return UserProfileSerializer(obj.author).data

    def get_sphere_info(self, obj):
        if obj.sphere:
            from spheres.serializers import SphereSerializer
            return SphereSerializer(obj.sphere, context=self.context).data
        return None

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.author == request.user
        return False

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.saves.filter(user=request.user).exists()
        return False

    def get_can_delete(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Author can delete, or sphere moderators/admins
            if obj.author == request.user:
                return True
            if obj.sphere:
                from spheres.models import SphereMember
                return SphereMember.objects.filter(
                    sphere=obj.sphere,
                    user=request.user,
                    role__in=['admin', 'moderator'],
                    status='active'
                ).exists()
        return False

    def get_recent_comments(self, obj):
        recent_comments = obj.comments.filter(parent=None)[:3]  # Top-level comments only
        return CommentSerializer(recent_comments, many=True, context=self.context).data


class PostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = [
            'content', 'sphere', 'category', 'visibility', 'subject', 'type',
            'audience', 'location', 'tags', 'files', 'allow_comments'
        ]

    def validate_sphere(self, value):
        if value:
            # Check if user is a member of the sphere
            from spheres.models import SphereMember
            user = self.context['request'].user
            if not SphereMember.objects.filter(
                sphere=value,
                user=user,
                status='active'
            ).exists():
                raise serializers.ValidationError("You must be a member of this sphere to post")
        return value

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class PostUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = [
            'content', 'category', 'visibility', 'subject', 'type',
            'audience', 'location', 'tags', 'files', 'allow_comments'
        ]


class PostLikeSerializer(serializers.ModelSerializer):
    user_info = serializers.SerializerMethodField()

    class Meta:
        model = PostLike
        fields = ['id', 'user', 'user_info', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def get_user_info(self, obj):
        from users.serializers import UserProfileSerializer
        return UserProfileSerializer(obj.user).data


class PostSaveSerializer(serializers.ModelSerializer):
    post_info = serializers.SerializerMethodField()

    class Meta:
        model = PostSave
        fields = ['id', 'post', 'post_info', 'saved_at']
        read_only_fields = ['id', 'saved_at']

    def get_post_info(self, obj):
        return PostSerializer(obj.post, context=self.context).data


class PostReportSerializer(serializers.ModelSerializer):
    reporter_info = serializers.SerializerMethodField()
    post_info = serializers.SerializerMethodField()

    class Meta:
        model = PostReport
        fields = [
            'id', 'post', 'post_info', 'reporter', 'reporter_info',
            'reason', 'details', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'reporter', 'status', 'created_at', 'updated_at']

    def get_reporter_info(self, obj):
        from users.serializers import UserProfileSerializer
        return UserProfileSerializer(obj.reporter).data

    def get_post_info(self, obj):
        return PostSerializer(obj.post, context=self.context).data
