# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_supabase_auth'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_profile_complete',
            field=models.BooleanField(default=False),
        ),
    ]