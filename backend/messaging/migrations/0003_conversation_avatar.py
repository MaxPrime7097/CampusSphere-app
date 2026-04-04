from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("messaging", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="conversation",
            name="avatar",
            field=models.ImageField(blank=True, null=True, upload_to="conversations/avatars/"),
        ),
    ]
