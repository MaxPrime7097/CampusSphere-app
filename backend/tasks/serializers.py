from rest_framework import serializers
from django.utils import timezone
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_info = serializers.SerializerMethodField()
    created_by_info = serializers.SerializerMethodField()
    sphere_info = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    can_complete = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'assigned_to', 'assigned_to_info',
            'priority', 'due_date', 'is_completed', 'impact_points', 'sphere',
            'sphere_info', 'created_by', 'created_by_info', 'status', 'is_overdue',
            'can_edit', 'can_delete', 'can_complete', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_assigned_to_info(self, obj):
        if obj.assigned_to:
            from users.serializers import UserProfileSerializer
            return UserProfileSerializer(obj.assigned_to).data
        return None

    def get_created_by_info(self, obj):
        from users.serializers import UserProfileSerializer
        return UserProfileSerializer(obj.created_by).data

    def get_sphere_info(self, obj):
        from spheres.serializers import SphereSerializer
        return SphereSerializer(obj.sphere, context=self.context).data

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Creator or sphere moderators/admins can edit
            if obj.created_by == request.user:
                return True
            from spheres.models import SphereMember
            return SphereMember.objects.filter(
                sphere=obj.sphere,
                user=request.user,
                role__in=['admin', 'moderator'],
                status='active'
            ).exists()
        return False

    def get_can_delete(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Creator or sphere admins can delete
            if obj.created_by == request.user:
                return True
            from spheres.models import SphereMember
            return SphereMember.objects.filter(
                sphere=obj.sphere,
                user=request.user,
                role='admin',
                status='active'
            ).exists()
        return False

    def get_can_complete(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Assigned user, creator, or sphere moderators/admins can complete
            if obj.assigned_to == request.user or obj.created_by == request.user:
                return True
            from spheres.models import SphereMember
            return SphereMember.objects.filter(
                sphere=obj.sphere,
                user=request.user,
                role__in=['admin', 'moderator'],
                status='active'
            ).exists()
        return False


class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'assigned_to', 'priority', 'due_date',
            'impact_points', 'sphere'
        ]

    def validate_assigned_to(self, value):
        if value:
            sphere = self.initial_data.get('sphere')
            if sphere:
                from spheres.models import SphereMember
                # Check if assigned user is a member of the sphere
                if not SphereMember.objects.filter(
                    sphere_id=sphere,
                    user=value,
                    status='active'
                ).exists():
                    raise serializers.ValidationError(
                        "Assigned user must be a member of the sphere"
                    )
        return value

    def validate_sphere(self, value):
        # Check if current user is a member of the sphere
        from spheres.models import SphereMember
        user = self.context['request'].user
        if not SphereMember.objects.filter(
            sphere=value,
            user=user,
            status='active'
        ).exists():
            raise serializers.ValidationError(
                "You must be a member of this sphere to create tasks"
            )
        return value

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class TaskUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'assigned_to', 'priority', 'due_date',
            'impact_points'
        ]

    def validate_assigned_to(self, value):
        if value:
            task = self.instance
            from spheres.models import SphereMember
            # Check if assigned user is a member of the sphere
            if not SphereMember.objects.filter(
                sphere=task.sphere,
                user=value,
                status='active'
            ).exists():
                raise serializers.ValidationError(
                    "Assigned user must be a member of the sphere"
                )
        return value


class TaskAssignSerializer(serializers.Serializer):
    assigned_to_id = serializers.UUIDField()

    def validate_assigned_to_id(self, value):
        from users.models import User
        from spheres.models import SphereMember
        
        try:
            user = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")

        task = self.context['task']
        # Check if user is a member of the sphere
        if not SphereMember.objects.filter(
            sphere=task.sphere,
            user=user,
            status='active'
        ).exists():
            raise serializers.ValidationError(
                "User must be a member of the sphere"
            )

        return value