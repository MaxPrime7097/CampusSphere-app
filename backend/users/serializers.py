from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from .models import User, Connection


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'username', 'email', 'password', 'confirm_password',
            'university', 'faculty', 'study_year', 'student_id', 'campus', 'town', 'language'
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
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


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    joined_spheres_count = serializers.IntegerField(read_only=True)
    connections_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'username', 'email', 'full_name',
            'avatar', 'cover_photo', 'bio', 'university', 'faculty', 'study_year',
            'student_id', 'campus', 'town', 'language', 'impact_score', 'current_mood',
            'skills', 'interests', 'previous_education', 'experiences', 'portfolio_links',
            'joined_spheres_count', 'connections_count', 'date_joined', 'updated_at'
        ]
        read_only_fields = ['id', 'impact_score', 'date_joined', 'updated_at']


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'bio', 'university', 'faculty', 'study_year',
            'skills', 'interests', 'current_mood'
        ]


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