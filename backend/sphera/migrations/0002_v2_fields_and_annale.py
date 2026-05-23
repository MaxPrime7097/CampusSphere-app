"""
Migration V2 :
1. Renomme la table study_tools_studysession → sphera_studysession
2. Ajoute extracted_text + qa_history sur StudySession
3. Crée la table AnnaleSession
"""
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("sphera", "0001_initial"),
        ("resources", "0004_alter_resource_file_type_alter_resource_subject_and_more"),
        ("spheres", "0004_spherefile"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Renommer la table (SeparateDatabaseAndState pour garder les données)
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                    DO $$ 
                    BEGIN
                        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'study_tools_studysession') THEN
                            ALTER TABLE study_tools_studysession RENAME TO sphera_studysession;
                        END IF;
                    END $$;
                    """,
                    reverse_sql="ALTER TABLE IF EXISTS sphera_studysession RENAME TO study_tools_studysession;",
                ),
            ],
            state_operations=[
                migrations.AlterModelTable(
                    name="studysession",
                    table=None,
                ),
                migrations.AlterModelOptions(
                    name="studysession",
                    options={
                        "verbose_name": "Session de révision",
                        "verbose_name_plural": "Sessions de révision",
                        "ordering": ["-created_at"],
                    },
                ),
            ],
        ),

        # 2. Ajouter les nouveaux champs V2 sur StudySession
        migrations.AddField(
            model_name="studysession",
            name="extracted_text",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="studysession",
            name="qa_history",
            field=models.JSONField(default=list),
        ),

        # 3. Créer AnnaleSession
        migrations.CreateModel(
            name="AnnaleSession",
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
                (
                    "mode",
                    models.CharField(
                        choices=[
                            ("complete", "Correction complète"),
                            ("rapide", "Correction rapide"),
                        ],
                        default="complete",
                        max_length=20,
                    ),
                ),
                ("source_filename", models.CharField(blank=True, max_length=255)),
                ("content", models.JSONField(default=dict)),
                ("is_shared", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="annale_sessions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "resource",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="annale_sessions",
                        to="resources.resource",
                        help_text="Ressource utilisée comme annale",
                    ),
                ),
                (
                    "cours_resource",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="annale_sessions_as_cours",
                        to="resources.resource",
                        help_text="Cours utilisé pour le croisement annale+cours",
                    ),
                ),
                (
                    "shared_in_sphere",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="shared_annale_sessions",
                        to="spheres.sphere",
                    ),
                ),
            ],
            options={
                "verbose_name": "Session d'annale",
                "verbose_name_plural": "Sessions d'annale",
                "ordering": ["-created_at"],
            },
        ),
    ]
