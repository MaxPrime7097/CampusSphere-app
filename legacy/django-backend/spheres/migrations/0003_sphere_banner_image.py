from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("spheres", "0002_sphere_expiration_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="sphere",
            name="banner_image",
            field=models.ImageField(blank=True, null=True, upload_to="spheres/banners/"),
        ),
    ]
