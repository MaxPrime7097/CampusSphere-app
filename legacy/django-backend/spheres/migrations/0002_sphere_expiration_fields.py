from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('spheres', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='sphere',
            name='auto_delete_on_expiry',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='sphere',
            name='expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
