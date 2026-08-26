from django.test import TestCase

from users.impact_policy import (
    COMMENT_CREATED,
    IMPACT_POINTS,
    POST_CREATED,
    RESOURCE_DOWNLOADED,
    RESOURCE_UPLOADED,
    TASK_COMPLETED,
    apply_impact_event,
    apply_impact_points,
    get_impact_points,
)
from users.models import User


class ImpactPolicyTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="impact@test.com",
            username="impact-user",
            first_name="Impact",
            last_name="Tester",
            password="password123",
        )

    def test_post_created_points(self):
        self.assertEqual(get_impact_points(POST_CREATED), 10)
        awarded = apply_impact_event(self.user, POST_CREATED)
        self.assertEqual(awarded, 10)
        self.user.refresh_from_db()
        self.assertEqual(self.user.impact_score, 10)

    def test_comment_created_points(self):
        self.assertEqual(get_impact_points(COMMENT_CREATED), 2)
        awarded = apply_impact_event(self.user, COMMENT_CREATED)
        self.assertEqual(awarded, 2)
        self.user.refresh_from_db()
        self.assertEqual(self.user.impact_score, 2)

    def test_resource_uploaded_points(self):
        self.assertEqual(get_impact_points(RESOURCE_UPLOADED), 3)
        awarded = apply_impact_event(self.user, RESOURCE_UPLOADED)
        self.assertEqual(awarded, 3)
        self.user.refresh_from_db()
        self.assertEqual(self.user.impact_score, 3)

    def test_resource_downloaded_points(self):
        self.assertEqual(get_impact_points(RESOURCE_DOWNLOADED), 1)
        awarded = apply_impact_event(self.user, RESOURCE_DOWNLOADED)
        self.assertEqual(awarded, 1)
        self.user.refresh_from_db()
        self.assertEqual(self.user.impact_score, 1)

    def test_task_completed_uses_dynamic_points(self):
        self.assertEqual(TASK_COMPLETED, "task.completed")
        self.assertNotIn(TASK_COMPLETED, IMPACT_POINTS)

        awarded = apply_impact_points(self.user, 7)
        self.assertEqual(awarded, 7)
        self.user.refresh_from_db()
        self.assertEqual(self.user.impact_score, 7)
