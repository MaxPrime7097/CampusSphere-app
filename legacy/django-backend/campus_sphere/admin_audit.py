from __future__ import annotations

from typing import Any

from users.models import AdminAuditLog


def log_admin_action(*, actor, action: str, target_type: str, target_id: Any = '', payload_diff: dict | None = None):
    if actor is None:
        return None

    if not getattr(actor, 'is_authenticated', False):
        return None

    return AdminAuditLog.objects.create(
        actor=actor,
        action=action,
        target_type=target_type,
        target_id=str(target_id or ''),
        payload_diff=payload_diff or {},
    )
