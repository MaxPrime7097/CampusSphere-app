import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("resources", "0004_alter_resource_file_type_alter_resource_subject_and_more"),
        ("spheres", "0004_spherefile"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="StudySession",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("source_filename", models.CharField(blank=True, max_length=255)),
                (
                    "tool_type",
                    models.CharField(
                        choices=[
                            ("fiche", "Fiche de révision"),
                            ("quiz", "Quiz interactif"),
                            ("flashcards", "Flashcards"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "content",
                    models.JSONField(
                        help_text="Le contenu structuré généré par l'IA en JSON"
                    ),
                ),
                ("is_shared", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="study_sessions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "resource",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="study_sessions",
                        to="resources.resource",
                    ),
                ),
                (
                    "shared_in_sphere",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="shared_study_sessions",
                        to="spheres.sphere",
                    ),
                ),
            ],
            options={
                "verbose_name": "Session de révision",
                "verbose_name_plural": "Sessions de révision",
                "ordering": ["-created_at"],
            },
        ),
    ]
