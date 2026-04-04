from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_normalize_current_mood_choices'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='supabase_uid',
            field=models.CharField(blank=True, db_index=True, max_length=255, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='user',
            name='phone_number',
            field=models.CharField(blank=True, max_length=30),
        ),
        migrations.AddField(
            model_name='user',
            name='date_of_birth',
            field=models.DateField(blank=True, null=True),
        ),
    ]
