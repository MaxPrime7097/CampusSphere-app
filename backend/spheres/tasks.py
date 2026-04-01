import logging

from celery import shared_task
from django.utils import timezone

from .models import Sphere

logger = logging.getLogger(__name__)


@shared_task
def cleanup_expired_spheres_task():
    """Delete expired spheres marked for auto-deletion."""
    expired_qs = Sphere.objects.filter(
        auto_delete_on_expiry=True,
        expires_at__isnull=False,
        expires_at__lte=timezone.now(),
    )
    count = expired_qs.count()
    expired_qs.delete()
    logger.info("Auto-deleted %s expired spheres", count)
    return count
