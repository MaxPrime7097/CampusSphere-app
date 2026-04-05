from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_supabase_auth'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='profile_completed',
            field=models.BooleanField(default=True),
        ),
    ]
