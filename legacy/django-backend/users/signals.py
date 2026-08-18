from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from campus_sphere.cache import CacheManager
from users.models import User


@receiver(post_save, sender=User)
def invalidate_user_profile_cache_on_save(sender, instance, **kwargs):
    CacheManager.invalidate_user_profile(instance.id)


@receiver(post_delete, sender=User)
def invalidate_user_profile_cache_on_delete(sender, instance, **kwargs):
    CacheManager.invalidate_user_profile(instance.id)
