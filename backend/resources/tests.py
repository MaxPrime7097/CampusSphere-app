from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from resources.models import Resource, ResourceSave
from users.models import Connection, User


@override_settings(SECURE_SSL_REDIRECT=False)
class ResourceViewPermissionsAndBehaviorTests(APITestCase):
    def setUp(self):
        self.resource_list_url = "/api/resources/"

        self.owner_same_uni = self._create_user(
            "owner_same", "owner_same@example.com", university="Uni A"
        )
        self.viewer_same_uni = self._create_user(
            "viewer_same", "viewer_same@example.com", university="Uni A"
        )
        self.viewer_diff_uni = self._create_user(
            "viewer_diff", "viewer_diff@example.com", university="Uni B"
        )
        self.friend_diff_uni = self._create_user(
            "friend_diff", "friend_diff@example.com", university="Uni C"
        )

        Connection.objects.create(
            requester=self.owner_same_uni,
            recipient=self.friend_diff_uni,
            status="accepted",
        )

    def _create_user(self, username, email, university=""):
        return User.objects.create_user(
            email=email,
            username=username,
            first_name="Test",
            last_name="User",
            password="pass1234",
            university=university,
        )

    def _pdf_upload(self, name="resource.pdf", content=b"%PDF-1.4 test"):
        return SimpleUploadedFile(name, content, content_type="application/pdf")

    def _create_resource(
        self,
        *,
        author,
        title,
        visibility="public",
        resource_type="notes",
        description="",
        subject="Mathematics",
        tags=None,
        downloads=0,
        saves=0,
    ):
        if tags is None:
            tags = []

        return Resource.objects.create(
            title=title,
            description=description,
            author=author,
            file=self._pdf_upload(f"{title.replace(' ', '_')}.pdf"),
            file_size=1024,
            file_type="application/pdf",
            subject=subject,
            type=resource_type,
            visibility=visibility,
            tags=tags,
            downloads_count=downloads,
            saves_count=saves,
        )

    def test_create_validation_for_visibility_type_mime_and_required_fields(self):
        self.client.force_authenticate(self.owner_same_uni)

        valid_payload = {
            "title": "Calculus Notes",
            "description": "Week 1",
            "file": self._pdf_upload("calc.pdf"),
            "subject": "Math",
            "type": "notes",
            "visibility": "public",
            "tags": ["calculus"],
        }

        # invalid visibility
        payload = dict(valid_payload)
        payload["visibility"] = "private"
        response = self.client.post(self.resource_list_url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("visibility", response.data)

        # invalid type
        payload = dict(valid_payload)
        payload["type"] = "invalid-type"
        payload["file"] = self._pdf_upload("calc2.pdf")
        response = self.client.post(self.resource_list_url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("type", response.data)

        # invalid mime
        payload = dict(valid_payload)
        payload["file"] = SimpleUploadedFile(
            "notes.txt", b"plain text", content_type="text/plain"
        )
        response = self.client.post(self.resource_list_url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("file", response.data)

        # missing required title
        payload = dict(valid_payload)
        payload.pop("title")
        payload["file"] = self._pdf_upload("calc3.pdf")
        response = self.client.post(self.resource_list_url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.data)

        # missing required file
        payload = dict(valid_payload)
        payload.pop("file")
        response = self.client.post(self.resource_list_url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("file", response.data)

    def test_visibility_access_rules_for_public_university_and_friends(self):
        public_resource = self._create_resource(
            author=self.owner_same_uni, title="Public Resource", visibility="public"
        )
        university_resource = self._create_resource(
            author=self.owner_same_uni,
            title="University Resource",
            visibility="university",
        )
        friends_resource = self._create_resource(
            author=self.owner_same_uni, title="Friends Resource", visibility="friends"
        )

        # Same university (not friend): public + university
        self.client.force_authenticate(self.viewer_same_uni)
        response = self.client.get(self.resource_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {item["id"] for item in response.data.get("results", response.data)}
        self.assertIn(public_resource.id, ids)
        self.assertIn(university_resource.id, ids)
        self.assertNotIn(friends_resource.id, ids)

        # Different university (not friend): public only
        self.client.force_authenticate(self.viewer_diff_uni)
        response = self.client.get(self.resource_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {item["id"] for item in response.data.get("results", response.data)}
        self.assertIn(public_resource.id, ids)
        self.assertNotIn(university_resource.id, ids)
        self.assertNotIn(friends_resource.id, ids)

        # Accepted friend (different university): public + friends
        self.client.force_authenticate(self.friend_diff_uni)
        response = self.client.get(self.resource_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {item["id"] for item in response.data.get("results", response.data)}
        self.assertIn(public_resource.id, ids)
        self.assertNotIn(university_resource.id, ids)
        self.assertIn(friends_resource.id, ids)

    def test_save_toggle_updates_saved_state_and_counter(self):
        resource = self._create_resource(
            author=self.owner_same_uni,
            title="Savable Resource",
            visibility="public",
            saves=0,
        )
        save_url = f"/api/resources/{resource.id}/save/"

        self.client.force_authenticate(self.viewer_diff_uni)

        response = self.client.post(save_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["data"]["saved"])
        resource.refresh_from_db()
        self.assertEqual(resource.saves_count, 1)
        self.assertTrue(ResourceSave.objects.filter(resource=resource, user=self.viewer_diff_uni).exists())

        response = self.client.post(save_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["data"]["saved"])
        resource.refresh_from_db()
        self.assertEqual(resource.saves_count, 0)
        self.assertFalse(ResourceSave.objects.filter(resource=resource, user=self.viewer_diff_uni).exists())

    def test_download_permissions_and_counter_updates(self):
        public_resource = self._create_resource(
            author=self.owner_same_uni,
            title="Download Public",
            visibility="public",
            downloads=0,
        )
        university_resource = self._create_resource(
            author=self.owner_same_uni,
            title="Download University",
            visibility="university",
            downloads=0,
        )
        friends_resource = self._create_resource(
            author=self.owner_same_uni,
            title="Download Friends",
            visibility="friends",
            downloads=0,
        )

        # Public allowed for different university
        self.client.force_authenticate(self.viewer_diff_uni)
        response = self.client.post(f"/api/resources/{public_resource.id}/download/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        public_resource.refresh_from_db()
        self.assertEqual(public_resource.downloads_count, 1)

        # University denied for different university
        response = self.client.post(f"/api/resources/{university_resource.id}/download/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        university_resource.refresh_from_db()
        self.assertEqual(university_resource.downloads_count, 0)

        # University allowed for same university
        self.client.force_authenticate(self.viewer_same_uni)
        response = self.client.post(f"/api/resources/{university_resource.id}/download/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        university_resource.refresh_from_db()
        self.assertEqual(university_resource.downloads_count, 1)

        # Friends allowed for accepted friend
        self.client.force_authenticate(self.friend_diff_uni)
        response = self.client.post(f"/api/resources/{friends_resource.id}/download/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        friends_resource.refresh_from_db()
        self.assertEqual(friends_resource.downloads_count, 1)

        # Friends denied for non-friend
        self.client.force_authenticate(self.viewer_same_uni)
        response = self.client.post(f"/api/resources/{friends_resource.id}/download/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_search_and_ordering_baseline_behavior(self):
        low = self._create_resource(
            author=self.owner_same_uni,
            title="Biology Starter",
            description="intro docs",
            tags=["science"],
            downloads=1,
        )
        mid = self._create_resource(
            author=self.owner_same_uni,
            title="Algebra Foundations",
            description="algebra basics",
            tags=["math"],
            downloads=5,
        )
        high = self._create_resource(
            author=self.owner_same_uni,
            title="Advanced Algebra",
            description="deep algebra",
            tags=["algebra"],
            downloads=10,
        )
        # inaccessible resource should never appear
        hidden = self._create_resource(
            author=self.owner_same_uni,
            title="Hidden Friends",
            visibility="friends",
            downloads=100,
        )

        self.client.force_authenticate(self.viewer_same_uni)

        # Search baseline: title/description/tags fields are searched.
        response = self.client.get(self.resource_list_url, {"search": "algebra"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data.get("results", response.data)]
        self.assertIn(mid.id, ids)
        self.assertIn(high.id, ids)
        self.assertNotIn(low.id, ids)
        self.assertNotIn(hidden.id, ids)

        # Ordering baseline: explicit ordering by downloads_count ascending.
        response = self.client.get(self.resource_list_url, {"ordering": "downloads_count"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data.get("results", response.data)]
        self.assertEqual(ids[:3], [low.id, mid.id, high.id])
        self.assertNotIn(hidden.id, ids)
