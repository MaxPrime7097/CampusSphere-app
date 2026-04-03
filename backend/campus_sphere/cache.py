# import redis  # Commented out - redis not installed
import json
from django.conf import settings
# from django.core.cache.backends.redis import RedisCache  # Commented out - redis not installed
from django.core.cache import cache


class DummyCacheService:
    """Dummy cache service when Redis is not available"""

    def get(self, key):
        """Get value from cache - always returns None"""
        return None

    def set(self, key, value, timeout=None):
        """Set value in cache - always returns False"""
        return False

    def delete(self, key):
        """Delete value from cache - always returns False"""
        return False

    def delete_pattern(self, pattern):
        """Delete keys matching pattern - always returns 0"""
        return 0

    def exists(self, key):
        """Check if key exists in cache - always returns False"""
        return False

    def increment(self, key, amount=1):
        """Increment value in cache - always returns None"""
        return None

    def expire(self, key, timeout):
        """Set expiration time for key - always returns False"""
        return False


# Global cache service instance
cache_service = DummyCacheService()


class CacheKeys:
    """Cache key constants"""

    # User-related keys
    @staticmethod
    def user_profile(user_id):
        return f"user:profile:{user_id}"

    @staticmethod
    def user_connections(user_id):
        return f"user:connections:{user_id}"

    @staticmethod
    def user_spheres(user_id):
        return f"user:spheres:{user_id}"

    # Sphere-related keys
    @staticmethod
    def sphere_detail(sphere_id):
        return f"sphere:detail:{sphere_id}"

    @staticmethod
    def sphere_members(sphere_id):
        return f"sphere:members:{sphere_id}"

    @staticmethod
    def sphere_posts(sphere_id, page=1):
        return f"sphere:posts:{sphere_id}:page:{page}"

    # Post-related keys
    @staticmethod
    def post_detail(post_id):
        return f"post:detail:{post_id}"

    @staticmethod
    def post_comments(post_id):
        return f"post:comments:{post_id}"

    # Resource-related keys
    @staticmethod
    def resource_detail(resource_id):
        return f"resource:detail:{resource_id}"

    @staticmethod
    def user_resources(user_id, page=1):
        return f"user:resources:{user_id}:page:{page}"

    # Task-related keys
    @staticmethod
    def sphere_tasks(sphere_id, page=1):
        return f"sphere:tasks:{sphere_id}:page:{page}"

    @staticmethod
    def user_tasks(user_id, page=1):
        return f"user:tasks:{user_id}:page:{page}"

    # Notification-related keys
    @staticmethod
    def user_notifications(user_id, page=1):
        return f"user:notifications:{user_id}:page:{page}"

    # General keys
    @staticmethod
    def spheres_list(category=None, page=1):
        if category:
            return f"spheres:list:category:{category}:page:{page}"
        return f"spheres:list:page:{page}"

    @staticmethod
    def posts_feed(page=1):
        return f"posts:feed:page:{page}"

    @staticmethod
    def resources_list(subject=None, page=1):
        if subject:
            return f"resources:list:subject:{subject}:page:{page}"
        return f"resources:list:page:{page}"


class CacheManager:
    """Manager for cache operations with TTL"""

    # Default TTL values (in seconds)
    USER_PROFILE_TTL = 3600  # 1 hour
    SPHERE_DETAIL_TTL = 1800  # 30 minutes
    POST_DETAIL_TTL = 1800  # 30 minutes
    RESOURCE_DETAIL_TTL = 1800  # 30 minutes
    LIST_TTL = 600  # 10 minutes
    CONNECTIONS_TTL = 1800  # 30 minutes

    @staticmethod
    def get_or_set(key, default_func, timeout=None):
        """Get from cache or set if not exists"""
        cached_value = cache_service.get(key)
        if cached_value is not None:
            return cached_value

        # Get fresh data
        fresh_value = default_func()
        if fresh_value is not None:
            cache_service.set(key, fresh_value, timeout)
        return fresh_value

    @staticmethod
    def invalidate_user_profile(user_id):
        """Invalidate the cached user profile payload."""
        cache_service.delete(CacheKeys.user_profile(user_id))

    @staticmethod
    def invalidate_user_cache(user_id):
        """Invalidate all user-related cache"""
        CacheManager.invalidate_user_profile(user_id)
        patterns = [
            f"user:connections:{user_id}",
            f"user:spheres:{user_id}",
            f"user:resources:{user_id}:*",
            f"user:tasks:{user_id}:*",
            f"user:notifications:{user_id}:*",
        ]
        for pattern in patterns:
            cache_service.delete_pattern(pattern)

    @staticmethod
    def invalidate_sphere_cache(sphere_id):
        """Invalidate all sphere-related cache"""
        patterns = [
            f"sphere:detail:{sphere_id}",
            f"sphere:members:{sphere_id}",
            f"sphere:posts:{sphere_id}:*",
            f"sphere:tasks:{sphere_id}:*",
        ]
        for pattern in patterns:
            cache_service.delete_pattern(pattern)

    @staticmethod
    def invalidate_post_cache(post_id):
        """Invalidate post-related cache"""
        cache_service.delete(f"post:detail:{post_id}")
        cache_service.delete(f"post:comments:{post_id}")

    @staticmethod
    def invalidate_resource_cache(resource_id):
        """Invalidate resource-related cache"""
        cache_service.delete(f"resource:detail:{resource_id}")

    @staticmethod
    def invalidate_feed_cache():
        """Invalidate feed-related cache"""
        cache_service.delete_pattern("posts:feed:*")
        cache_service.delete_pattern("spheres:list:*")
        cache_service.delete_pattern("resources:list:*")
