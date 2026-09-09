from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from campus_sphere.cache import CacheKeys, CacheManager


class InMemoryCacheService:
    def __init__(self):
        self._store = {}

    def get(self, key):
        return self._store.get(key)

    def set(self, key, value, timeout=None):
        self._store[key] = value
        return True

    def delete(self, key):
        return self._store.pop(key, None) is not None

    def delete_pattern(self, pattern):
        if pattern.endswith('*'):
            prefix = pattern[:-1]
            keys_to_delete = [key for key in self._store if key.startswith(prefix)]
        else:
            keys_to_delete = [pattern] if pattern in self._store else []

        for key in keys_to_delete:
            self._store.pop(key, None)

        return len(keys_to_delete)


class CacheManagerGetOrSetTests(SimpleTestCase):
    def test_get_or_set_hits_cache_for_user_profile_key(self):
        cache_service = InMemoryCacheService()
        key = CacheKeys.user_profile(42)
        loader = Mock(return_value={"id": 42, "username": "alice"})

        with patch('campus_sphere.cache.cache_service', cache_service):
            first_value = CacheManager.get_or_set(key, loader, CacheManager.USER_PROFILE_TTL)
            second_value = CacheManager.get_or_set(key, loader, CacheManager.USER_PROFILE_TTL)

        self.assertEqual(first_value, second_value)
        self.assertEqual(loader.call_count, 1)

    def test_get_or_set_hits_cache_for_sphere_detail_key(self):
        cache_service = InMemoryCacheService()
        key = CacheKeys.sphere_detail(7)
        loader = Mock(return_value={"id": 7, "name": "Backend Guild"})

        with patch('campus_sphere.cache.cache_service', cache_service):
            first_value = CacheManager.get_or_set(key, loader, CacheManager.SPHERE_DETAIL_TTL)
            second_value = CacheManager.get_or_set(key, loader, CacheManager.SPHERE_DETAIL_TTL)

        self.assertEqual(first_value, second_value)
        self.assertEqual(loader.call_count, 1)
