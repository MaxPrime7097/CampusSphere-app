from rest_framework import serializers
from upload.serializers import FileUploadSerializer
from .models import Post, PostLike, PostImpactRating, Comment, CommentLike




def _normalize_post_file_entry(file_entry):
    if isinstance(file_entry, dict):
        return {
            'id': file_entry.get('id'),
            'name': file_entry.get('name') or file_entry.get('original_name') or '',
            'url': file_entry.get('url') or file_entry.get('file_url') or file_entry.get('file') or '',
            'type': file_entry.get('type') or file_entry.get('file_type') or '',
            'size': file_entry.get('size') or file_entry.get('file_size') or 0,
        }

    if isinstance(file_entry, str):
        return {
            'id': None,
            'name': file_entry.rsplit('/', 1)[-1],
            'url': file_entry,
            'type': '',
            'size': 0,
        }

    return {
        'id': None,
        'name': '',
        'url': '',
        'type': '',
        'size': 0,
    }




def _coerce_json_list(raw_value, field_name):
    if raw_value in (None, ''):
        return []

    if isinstance(raw_value, list):
        return raw_value

    if isinstance(raw_value, str):
        import json
        try:
            parsed = json.loads(raw_value)
        except json.JSONDecodeError as exc:
            raise serializers.ValidationError({field_name: 'Invalid JSON list.'}) from exc
        if not isinstance(parsed, list):
            raise serializers.ValidationError({field_name: 'Must be a list.'})
        return parsed

    raise serializers.ValidationError({field_name: 'Must be a list.'})

def _build_uploaded_files_payload(request):
    uploaded_files = []
    incoming_files = request.FILES.getlist('files[]') or request.FILES.getlist('files')

    for incoming_file in incoming_files:
        serializer = FileUploadSerializer(
            data={'file': incoming_file, 'type': 'post'},
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        uploaded_file = serializer.save()
        uploaded_files.append({
            'id': str(uploaded_file.id),
            'name': uploaded_file.original_name,
            'url': uploaded_file.file_url,
            'type': uploaded_file.file_type,
            'size': uploaded_file.file_size,
        })

    return uploaded_files

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
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=Comment.objects.all(),
        source='parent',
        required=False,
        allow_null=True,
        write_only=True
    )

    class Meta:
        model = Comment
        fields = ['content', 'parent', 'parent_id']

    def validate(self, attrs):
        parent = attrs.get('parent')
        if parent and parent.post_id != self.context['post'].id:
            raise serializers.ValidationError({
                'parent': 'Parent comment must belong to the same post.'
            })
        return attrs

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
    user_impact_rating = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    recent_comments = serializers.SerializerMethodField()
    files = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'content', 'author', 'author_info', 'sphere', 'sphere_info',
            'category', 'visibility', 'subject', 'type', 'audience', 'location',
            'tags', 'files', 'allow_comments', 'is_pinned', 'likes_count',
            'comments_count', 'impact_score', 'is_liked', 'is_saved', 'can_edit', 'can_delete',
            'user_impact_rating', 'recent_comments', 'created_at', 'updated_at'
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

    def get_files(self, obj):
        return [_normalize_post_file_entry(file_entry) for file_entry in (obj.files or [])]

    def get_user_impact_rating(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            rating = obj.impact_ratings.filter(user=request.user).only('value').first()
            return rating.value if rating else None
        return None


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

    def validate_tags(self, value):
        return _coerce_json_list(value, 'tags')

    def validate_files(self, value):
        return _coerce_json_list(value, 'files')

    def create(self, validated_data):
        request = self.context['request']
        validated_data['author'] = request.user
        persisted_files = _build_uploaded_files_payload(request)

        existing_files = validated_data.get('files') or []
        if isinstance(existing_files, list):
            validated_data['files'] = [
                _normalize_post_file_entry(file_entry) for file_entry in existing_files
            ] + persisted_files
        else:
            validated_data['files'] = persisted_files

        return super().create(validated_data)


class PostUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = [
            'content', 'category', 'visibility', 'subject', 'type',
            'audience', 'location', 'tags', 'files', 'allow_comments'
        ]

    def validate_tags(self, value):
        return _coerce_json_list(value, 'tags')

    def validate_files(self, value):
        return _coerce_json_list(value, 'files')

    def update(self, instance, validated_data):
        request = self.context['request']
        persisted_files = _build_uploaded_files_payload(request)

        if persisted_files:
            incoming_files = validated_data.get('files')
            if isinstance(incoming_files, list):
                validated_data['files'] = [
                    _normalize_post_file_entry(file_entry) for file_entry in incoming_files
                ] + persisted_files
            else:
                validated_data['files'] = [
                    _normalize_post_file_entry(file_entry) for file_entry in (instance.files or [])
                ] + persisted_files

        return super().update(instance, validated_data)


class PostLikeSerializer(serializers.ModelSerializer):
    user_info = serializers.SerializerMethodField()

    class Meta:
        model = PostLike
        fields = ['id', 'user', 'user_info', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def get_user_info(self, obj):
        from users.serializers import UserProfileSerializer
        return UserProfileSerializer(obj.user).data


class PostImpactRatingSerializer(serializers.ModelSerializer):
    user_info = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PostImpactRating
        fields = ['id', 'post', 'user', 'user_info', 'value', 'created_at']
        read_only_fields = ['id', 'post', 'user', 'user_info', 'created_at']

    def get_user_info(self, obj):
        from users.serializers import UserProfileSerializer
        return UserProfileSerializer(obj.user).data

    def validate_value(self, value):
        if value is None:
            return value
        if value < 1 or value > 5:
            raise serializers.ValidationError("Impact rating value must be between 1 and 5")
        return value


class PostImpactRatingActionSerializer(serializers.Serializer):
    # Null means remove user's existing rating
    value = serializers.IntegerField(min_value=1, max_value=5, required=False, allow_null=True)
