from __future__ import annotations

from typing import Dict

from rest_framework import status
from rest_framework.response import Response

ADMIN_PERMISSIONS_MATRIX: Dict[str, Dict[str, bool]] = {
    'super_admin': {
        'view': True,
        'create': True,
        'update': True,
        'delete': True,
        'export': True,
    },
    'admin': {
        'view': True,
        'create': True,
        'update': True,
        'delete': True,
        'export': True,
    },
    'moderator': {
        'view': True,
        'create': False,
        'update': True,
        'delete': False,
        'export': False,
    },
    'viewer': {
        'view': True,
        'create': False,
        'update': False,
        'delete': False,
        'export': False,
    },
}


ADMIN_ROUTE_PERMISSIONS = {
    'admin-moderation-queue': 'view',
    'admin-reported-content': 'view',
    'admin-user-management-summary': 'view',
    'admin-permissions': 'view',
}


def resolve_admin_role(user) -> str | None:
    if not user or not user.is_authenticated:
        return None

    if getattr(user, 'is_superuser', False):
        return 'super_admin'

    if getattr(user, 'is_staff', False):
        return 'admin'

    raw_role = str(getattr(user, 'role', '') or getattr(user, 'user_type', '')).strip().lower()
    if raw_role in ADMIN_PERMISSIONS_MATRIX:
        return raw_role

    return None


def build_admin_permissions_for_user(user) -> Dict[str, bool]:
    role = resolve_admin_role(user)
    if not role:
        return {action: False for action in ['view', 'create', 'update', 'delete', 'export']}

    return ADMIN_PERMISSIONS_MATRIX.get(role, {}).copy()


def admin_access_denied_response() -> Response:
    return Response(
        {
            'success': False,
            'detail': 'Admin access required for this action.',
        },
        status=status.HTTP_403_FORBIDDEN,
    )


def require_admin_permission(request, action: str) -> tuple[bool, Response | None, str | None, Dict[str, bool]]:
    role = resolve_admin_role(request.user)
    permissions = build_admin_permissions_for_user(request.user)

    if not role:
        return False, admin_access_denied_response(), None, permissions

    if not permissions.get(action, False):
        return False, admin_access_denied_response(), role, permissions

    return True, None, role, permissions
