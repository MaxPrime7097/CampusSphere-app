from rest_framework import serializers
from django.db.models import Q
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, Connection, UserBlock


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(required=False, allow_blank=True, default="")
    date_of_birth = serializers.DateField(required=False, allow_null=True, default=None)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'username', 'email', 'password', 'confirm_password',
            'university', 'faculty', 'study_year', 'student_id', 'campus', 'town', 'language',
            'bio', 'skills', 'interests', 'previous_education', 'experiences', 'portfolio_links',
            'phone_number', 'date_of_birth',
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        phone_number = validated_data.pop('phone_number', '')
        date_of_birth = validated_data.pop('date_of_birth', None)
        bio = validated_data.pop('bio', '')
        skills = validated_data.pop('skills', [])
        interests = validated_data.pop('interests', [])
        previous_education = validated_data.pop('previous_education', [])
        experiences = validated_data.pop('experiences', [])
        portfolio_links = validated_data.pop('portfolio_links', [])
        user = User.objects.create_user(**validated_data)
        if phone_number and hasattr(user, 'phone_number'):
            user.phone_number = phone_number
        if date_of_birth and hasattr(user, 'date_of_birth'):
            user.date_of_birth = date_of_birth
        if bio:
            user.bio = bio
        if skills:
            user.skills = skills
        if interests:
            user.interests = interests
        if previous_education:
            user.previous_education = previous_education
        if experiences:
            user.experiences = experiences
        if portfolio_links:
            user.portfolio_links = portfolio_links
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            # Django's default authentication backend expects the credential
            # keyword to be the USERNAME_FIELD (which in this project is 'email'),
            # but ModelBackend expects a 'username' kwarg. Use 'username' here
            # to ensure authentication works with the default backend.
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError("Invalid credentials")
            if not user.is_active:
                raise serializers.ValidationError("User account is disabled")
        else:
            raise serializers.ValidationError("Email and password are required")

        data['user'] = user
        return data


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    coverPhoto = serializers.ImageField(source='cover_photo', read_only=True)
    studyYear = serializers.CharField(source='study_year', read_only=True)
    studentId = serializers.CharField(source='student_id', read_only=True)
    previousEducation = serializers.JSONField(source='previous_education', read_only=True)
    portfolioLinks = serializers.JSONField(source='portfolio_links', read_only=True)
    phone_number = serializers.SerializerMethodField()
    phoneNumber = serializers.SerializerMethodField()
    date_of_birth = serializers.SerializerMethodField()
    dateOfBirth = serializers.SerializerMethodField()
    joined_spheres_count = serializers.SerializerMethodField()
    connections_count = serializers.SerializerMethodField()
    contributions_count = serializers.SerializerMethodField()
    is_fully_onboarded = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'username', 'email', 'full_name',
            'phone_number', 'phoneNumber', 'date_of_birth', 'dateOfBirth', 'avatar', 'cover_photo', 'coverPhoto',
            'bio', 'university', 'faculty', 'study_year', 'studyYear', 'student_id', 'studentId', 'campus',
            'town', 'language', 'profile_visibility', 'post_visibility',
            'data_export_requested_at', 'impact_score', 'current_mood',
            'skills', 'interests', 'previous_education', 'previousEducation', 'experiences',
            'portfolio_links', 'portfolioLinks', 'joined_spheres_count', 'connections_count', 'contributions_count',
            'date_joined', 'updated_at', 'is_staff', 'is_superuser', 'profile_completed', 'is_fully_onboarded'
        ]
        read_only_fields = ['id', 'impact_score', 'date_joined', 'updated_at']

    def get_joined_spheres_count(self, obj):
        return obj.sphere_memberships.filter(status='active').count()

    def get_phone_number(self, obj):
        return getattr(obj, 'phone_number', '')

    def get_phoneNumber(self, obj):
        return self.get_phone_number(obj)

    def get_date_of_birth(self, obj):
        return getattr(obj, 'date_of_birth', None)

    def get_dateOfBirth(self, obj):
        return self.get_date_of_birth(obj)

    def get_connections_count(self, obj):
        """
        Business rule: only accepted connections are counted.
        """
        return Connection.objects.filter(
            Q(requester=obj) | Q(recipient=obj),
            status='accepted'
        ).count()

    def get_contributions_count(self, obj):
        """
        Lightweight aggregate used by frontend resource/profile cards.
        """
        posts_count = obj.posts.count() if hasattr(obj, 'posts') else 0
        resources_count = obj.resources.count() if hasattr(obj, 'resources') else 0
        return posts_count + resources_count

    def get_is_fully_onboarded(self, obj):
        return obj.is_fully_onboarded


class UserUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(min_length=3, max_length=50, required=False)
    phone_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'username', 'bio', 'university', 'faculty', 'study_year',
            'student_id', 'campus', 'town', 'language', 'skills', 'interests', 'current_mood',
            'previous_education', 'experiences', 'portfolio_links', 'profile_visibility', 'post_visibility',
            'phone_number', 'date_of_birth'
        ]

    def validate_username(self, value):
        user = self.instance
        if User.objects.exclude(id=user.id).filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already in use")
        return value

    def validate_current_mood(self, value):
        allowed_values = {choice[0] for choice in User.CURRENT_MOOD_CHOICES}
        if value not in allowed_values:
            raise serializers.ValidationError(
                f"Invalid mood. Allowed values: {', '.join(sorted(allowed_values))}."
            )
        return value

    def update(self, instance, validated_data):
        """
        Handle optional profile fields that may be present in some deployments
        (e.g. phone_number/date_of_birth) without breaking environments where
        those columns are not yet migrated.
        """
        phone_number = validated_data.pop('phone_number', serializers.empty)
        date_of_birth = validated_data.pop('date_of_birth', serializers.empty)

        instance = super().update(instance, validated_data)

        update_fields = []
        if phone_number is not serializers.empty and hasattr(instance, 'phone_number'):
            instance.phone_number = phone_number
            update_fields.append('phone_number')
        if date_of_birth is not serializers.empty and hasattr(instance, 'date_of_birth'):
            instance.date_of_birth = date_of_birth
            update_fields.append('date_of_birth')

        if update_fields:
            update_fields.append('updated_at')
            instance.save(update_fields=update_fields)

        return instance


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value

    def validate_new_password(self, value):
        user = self.context['request'].user
        validate_password(value, user=user)
        return value


class ChangeEmailSerializer(serializers.Serializer):
    current_email = serializers.EmailField()
    new_email = serializers.EmailField()

    def validate(self, attrs):
        user = self.context['request'].user
        current_email = attrs.get('current_email', '').strip().lower()
        new_email = attrs.get('new_email', '').strip().lower()

        if current_email != user.email.lower():
            raise serializers.ValidationError({'current_email': 'Current email does not match your account'})

        if current_email == new_email:
            raise serializers.ValidationError({'new_email': 'New email must be different from current email'})

        if User.objects.exclude(id=user.id).filter(email__iexact=new_email).exists():
            raise serializers.ValidationError({'new_email': 'This email is already in use'})

        attrs['new_email'] = new_email
        return attrs


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=False, allow_blank=True)


class DeleteAccountSerializer(serializers.Serializer):
    confirmation_text = serializers.CharField()

    def validate_confirmation_text(self, value):
        if value.strip().upper() != 'SUPPRIMER':
            raise serializers.ValidationError('Please type SUPPRIMER to confirm account deletion')
        return value


class ConnectionSerializer(serializers.ModelSerializer):
    requester_info = UserProfileSerializer(source='requester', read_only=True)
    recipient_info = UserProfileSerializer(source='recipient', read_only=True)

    class Meta:
        model = Connection
        fields = [
            'id', 'requester', 'recipient', 'status', 'requester_info', 'recipient_info',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ConnectionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Connection
        fields = ['recipient']

    def validate_recipient(self, value):
        user = self.context['request'].user
        if value == user:
            raise serializers.ValidationError("Cannot connect to yourself")
        return value

    def create(self, validated_data):
        validated_data['requester'] = self.context['request'].user
        return super().create(validated_data)


class UserSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'username', 'avatar', 'bio',
            'university', 'faculty', 'study_year', 'impact_score'
        ]


class PrivacySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['profile_visibility', 'post_visibility', 'data_export_requested_at']
        read_only_fields = ['data_export_requested_at']


class DataExportRequestSerializer(serializers.Serializer):
    include_connections = serializers.BooleanField(default=True)
    include_posts = serializers.BooleanField(default=True)


class BlockListItemSerializer(serializers.ModelSerializer):
    blocked_user = UserSearchSerializer(source='blocked', read_only=True)

    class Meta:
        model = UserBlock
        fields = ['id', 'blocked', 'blocked_user', 'created_at']
        read_only_fields = ['id', 'created_at', 'blocked_user']


class BlockCreateSerializer(serializers.Serializer):
    blocked_user_id = serializers.IntegerField()

    def validate_blocked_user_id(self, value):
        user = self.context['request'].user
        if user.id == value:
            raise serializers.ValidationError('You cannot block yourself')

        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError('User does not exist')

        return value
