"""Centralized impact policy for user score updates.

This module is the single source of truth for impact-score event names
and point values used across backend endpoints.
"""

from django.db.models import F

# Event fired when a user publishes a new post.
POST_CREATED = "post.created"
# Event fired when a user publishes a new comment (including replies).
COMMENT_CREATED = "comment.created"
# Event fired when a user uploads a new learning resource.
RESOURCE_UPLOADED = "resource.uploaded"
# Event fired when a user downloads a resource shared by someone else.
RESOURCE_DOWNLOADED = "resource.downloaded"
# Event fired when a user completes a task and receives its impact points.
TASK_COMPLETED = "task.completed"

# Static event points. TASK_COMPLETED intentionally uses dynamic points.
IMPACT_POINTS = {
    POST_CREATED: 1,
    COMMENT_CREATED: 0,
    RESOURCE_UPLOADED: 5,
    RESOURCE_DOWNLOADED: 0,
}


def get_impact_points(event_name: str, *, default: int = 0) -> int:
    """Return the configured points for a named event.

    Unknown events return ``default`` to keep call-sites resilient.
    """

    return IMPACT_POINTS.get(event_name, default)


def apply_impact_event(user, event_name: str) -> int:
    """Apply points for ``event_name`` to ``user`` and return awarded points."""

    points = get_impact_points(event_name)
    if points == 0:
        return 0

    user.__class__.objects.filter(pk=user.pk).update(impact_score=F("impact_score") + points)
    user.refresh_from_db(fields=["impact_score"])
    return points


def apply_impact_points(user, points: int) -> int:
    """Apply an explicit number of points to ``user`` and return applied points."""

    if points == 0:
        return 0

    user.__class__.objects.filter(pk=user.pk).update(impact_score=F("impact_score") + points)
    user.refresh_from_db(fields=["impact_score"])
    return points
