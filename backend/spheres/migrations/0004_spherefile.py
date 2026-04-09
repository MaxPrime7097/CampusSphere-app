from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("spheres", "0003_sphere_banner_image"),
        ("users", "0005_add_profile_complete_field"),
    ]

    operations = [
        migrations.CreateModel(
            name="SphereFile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200)),
                ("file", models.FileField(upload_to="spheres/files/")),
                ("file_size", models.IntegerField(default=0)),
                ("file_type", models.CharField(blank=True, max_length=100)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("sphere", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="sphere_files", to="spheres.sphere")),
                ("uploaded_by", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="uploaded_sphere_files", to="users.user")),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
