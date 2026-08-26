from rest_framework import permissions
from .models import SphereMember


class IsSphereMember(permissions.BasePermission):
    """
    Custom permission to only allow members of a sphere to access it.
    """

    def has_object_permission(self, request, view, obj):
        # Check if user is a member of the sphere
        return SphereMember.objects.filter(
            sphere=obj,
            user=request.user,
            status='active'
        ).exists()


class IsSphereModerator(permissions.BasePermission):
    """
    Custom permission to only allow moderators and admins of a sphere.
    """

    def has_object_permission(self, request, view, obj):
        # Check if user is a moderator or admin of the sphere
        return SphereMember.objects.filter(
            sphere=obj,
            user=request.user,
            role__in=['moderator', 'admin'],
            status='active'
        ).exists()


class IsSphereAdmin(permissions.BasePermission):
    """
    Custom permission to only allow admins of a sphere.
    """

    def has_object_permission(self, request, view, obj):
        # Check if user is an admin of the sphere
        return SphereMember.objects.filter(
            sphere=obj,
            user=request.user,
            role='admin',
            status='active'
        ).exists()


class IsSphereMemberOrPublic(permissions.BasePermission):
    """
    Custom permission to allow access to public spheres or members of private spheres.
    """

    def has_object_permission(self, request, view, obj):
        # Allow access to public spheres
        if not obj.is_private:
            return True

        # For private spheres, check if user is a member
        return SphereMember.objects.filter(
            sphere=obj,
            user=request.user,
            status='active'
        ).exists()