from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0002_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PostReport",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("reason", models.CharField(max_length=120)),
                ("details", models.TextField(blank=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("reviewed", "Reviewed"),
                            ("dismissed", "Dismissed"),
                            ("action_taken", "Action Taken"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "post",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reports",
                        to="posts.post",
                    ),
                ),
                (
                    "reporter",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="post_reports",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
                "unique_together": {("post", "reporter")},
            },
        ),
    ]
