from rest_framework import serializers
from django.utils import timezone
from .models import Sphere, SphereMember


class SphereMemberSerializer(serializers.ModelSerializer):
    user_info = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = SphereMember
        fields = [
            'id', 'user', 'user_info', 'role', 'role_display', 'status', 'status_display',
            'joined_at'
        ]

    def get_user_info(self, obj):
        from users.serializers import UserProfileSerializer
        return UserProfileSerializer(obj.user).data


class SphereSerializer(serializers.ModelSerializer):
    created_by_info = serializers.SerializerMethodField()
    member_count = serializers.IntegerField(read_only=True)
    progression = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    membership_status = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = Sphere
        fields = [
            'id', 'name', 'description', 'category', 'type', 'color', 'icon',
            'is_private', 'require_approval', 'objective', 'target_audience',
            'duration', 'collaboration_types', 'member_count', 'impact_score',
            'progression',
            'created_by', 'created_by_info', 'is_member', 'membership_status',
            'user_role', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'member_count', 'impact_score', 'created_at', 'updated_at']

    def get_progression(self, obj):
        """
        Compute a normalized progression percentage for the sphere.

        Formula:
          progression = clamp(impact_score, 0, 100)

        The UI can safely render this as a 0-100% progress bar without showing
        `undefined%`.
        """
        try:
            impact_score = int(obj.impact_score or 0)
        except (TypeError, ValueError):
            impact_score = 0
        return max(0, min(100, impact_score))

    def get_created_by_info(self, obj):
        from users.serializers import UserProfileSerializer
        return UserProfileSerializer(obj.created_by).data

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(user=request.user, status='active').exists()
        return False

    def get_membership_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = obj.members.filter(user=request.user).first()
            return membership.status if membership else None
        return None

    def get_user_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = obj.members.filter(user=request.user, status='active').first()
            return membership.role if membership else None
        return None


class SphereCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sphere
        fields = [
            'name', 'description', 'category', 'type', 'color', 'icon',
            'is_private', 'require_approval', 'objective', 'target_audience',
            'duration', 'collaboration_types'
        ]

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class SphereUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sphere
        fields = [
            'name', 'description', 'category', 'type', 'color', 'icon',
            'is_private', 'require_approval', 'objective', 'target_audience',
            'duration', 'collaboration_types'
        ]


class SphereMemberCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SphereMember
        fields = ['user', 'role']

    def validate_user(self, value):
        sphere = self.context['sphere']
        if sphere.members.filter(user=value, status='active').exists():
            raise serializers.ValidationError("User is already a member of this sphere")
        return value

    def create(self, validated_data):
        validated_data['sphere'] = self.context['sphere']
        return super().create(validated_data)


class SphereMemberUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SphereMember
        fields = ['role', 'status']

    def validate(self, attrs):
        request = self.context.get('request')
        target_membership = self.instance

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required")

        if not attrs:
            raise serializers.ValidationError("Provide at least one field to update")

        actor_membership = SphereMember.objects.filter(
            sphere=target_membership.sphere,
            user=request.user,
            status='active'
        ).first()

        if not actor_membership or actor_membership.role not in ['admin', 'moderator']:
            raise serializers.ValidationError("Only sphere admins or moderators can update members")

        if 'status' in attrs:
            current_status = target_membership.status
            requested_status = attrs['status']
            allowed_status_transitions = {
                'pending': {'active', 'inactive', 'banned'},
                'active': {'inactive', 'banned'},
                'inactive': {'active', 'banned'},
                'banned': {'active'},
            }

            if requested_status == current_status:
                raise serializers.ValidationError({'status': 'Member already has this status'})

            if requested_status not in allowed_status_transitions.get(current_status, set()):
                raise serializers.ValidationError({
                    'status': f"Transition from {current_status} to {requested_status} is not allowed"
                })

            if actor_membership.role != 'admin' and requested_status in ['inactive', 'banned']:
                raise serializers.ValidationError({
                    'status': 'Only admins can set member status to inactive or banned'
                })

        if 'role' in attrs:
            requested_role = attrs['role']
            if actor_membership.role != 'admin':
                raise serializers.ValidationError({'role': 'Only admins can change member roles'})

            if requested_role == target_membership.role:
                raise serializers.ValidationError({'role': 'Member already has this role'})

            if target_membership.user_id == request.user.id and requested_role != 'admin':
                raise serializers.ValidationError({'role': 'Admins cannot demote themselves'})

            if target_membership.role == 'admin' and requested_role != 'admin':
                remaining_admins = target_membership.sphere.members.filter(
                    role='admin',
                    status='active'
                ).exclude(id=target_membership.id).count()
                if remaining_admins == 0:
                    raise serializers.ValidationError({'role': 'Cannot demote the last admin'})

        return attrs


class SphereJoinSerializer(serializers.Serializer):
    def validate(self, data):
        sphere = self.context['sphere']
        user = self.context['request'].user

        # Check if already a member
        if sphere.members.filter(user=user, status='active').exists():
            raise serializers.ValidationError("You are already a member of this sphere")

        # Check if pending request exists
        if sphere.members.filter(user=user, status='pending').exists():
            raise serializers.ValidationError("You already have a pending request to join this sphere")

        return data
