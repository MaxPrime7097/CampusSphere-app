import fnmatch
from django.core.cache import cache


class DjangoCacheService:
    """Cache service backed by Django's configured cache backend."""

    INDEX_KEY = "cache:index:keys"

    def get(self, key):
        return cache.get(key)

    def set(self, key, value, timeout=None):
        stored = cache.set(key, value, timeout)
        if stored:
            self._index_add(key)
        return stored

    def delete(self, key):
        deleted = cache.delete(key)
        self._index_discard(key)
        return bool(deleted)

    def delete_pattern(self, pattern):
        deleted = self._delete_pattern_backend(pattern)
        if deleted is not None:
            self._index_delete_pattern(pattern)
            return deleted

        # Fallback strategy for backends without native pattern deletion support.
        matches = [key for key in self._index_get() if fnmatch.fnmatch(key, pattern)]
        for key in matches:
            cache.delete(key)
        self._index_remove_many(matches)
        return len(matches)

    def exists(self, key):
        try:
            return cache.has_key(key)
        except Exception:
            return cache.get(key) is not None

    def increment(self, key, amount=1):
        try:
            return cache.incr(key, amount)
        except Exception:
            return None

    def expire(self, key, timeout):
        touch = getattr(cache, "touch", None)
        if not callable(touch):
            return False
        try:
            return touch(key, timeout)
        except Exception:
            return False

    def _delete_pattern_backend(self, pattern):
        native_delete_pattern = getattr(cache, "delete_pattern", None)
        if callable(native_delete_pattern):
            try:
                return native_delete_pattern(pattern)
            except Exception:
                pass

        internal_backend = getattr(cache, "_cache", None)
        backend_delete_pattern = getattr(internal_backend, "delete_pattern", None)
        if callable(backend_delete_pattern):
            try:
                return backend_delete_pattern(pattern)
            except Exception:
                pass

        client = self._redis_client(internal_backend)
        if client is None:
            return None

        try:
            keys = list(client.scan_iter(match=pattern))
            if not keys:
                return 0
            return client.delete(*keys)
        except Exception:
            return None

    def _redis_client(self, internal_backend):
        client_factory = getattr(getattr(cache, "client", None), "get_client", None)
        if callable(client_factory):
            try:
                return client_factory(write=True)
            except Exception:
                pass

        if internal_backend is None:
            return None

        backend_client_factory = getattr(internal_backend, "get_client", None)
        if callable(backend_client_factory):
            try:
                return backend_client_factory(write=True)
            except Exception:
                return None
        return None

    def _index_get(self):
        keys = cache.get(self.INDEX_KEY, [])
        if isinstance(keys, (list, tuple, set)):
            return set(keys)
        return set()

    def _index_set(self, keys):
        cache.set(self.INDEX_KEY, list(keys), None)

    def _index_add(self, key):
        keys = self._index_get()
        if key in keys:
            return
        keys.add(key)
        self._index_set(keys)

    def _index_discard(self, key):
        keys = self._index_get()
        if key not in keys:
            return
        keys.discard(key)
        self._index_set(keys)

    def _index_remove_many(self, keys_to_remove):
        if not keys_to_remove:
            return
        keys = self._index_get()
        before = len(keys)
        keys.difference_update(keys_to_remove)
        if len(keys) != before:
            self._index_set(keys)

    def _index_delete_pattern(self, pattern):
        keys = self._index_get()
        to_remove = [key for key in keys if fnmatch.fnmatch(key, pattern)]
        self._index_remove_many(to_remove)


# Global cache service instance
cache_service = DjangoCacheService()


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
