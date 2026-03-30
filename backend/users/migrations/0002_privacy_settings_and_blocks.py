from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='data_export_requested_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='post_visibility',
            field=models.CharField(
                choices=[('public', 'Public'), ('connections', 'Connections only'), ('private', 'Private')],
                default='public',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='profile_visibility',
            field=models.CharField(
                choices=[('public', 'Public'), ('connections', 'Connections only'), ('private', 'Private')],
                default='public',
                max_length=20,
            ),
        ),
        migrations.CreateModel(
            name='UserBlock',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('blocked', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='received_blocks', to=settings.AUTH_USER_MODEL)),
                ('blocker', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='initiated_blocks', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': {('blocker', 'blocked')},
            },
        ),
    ]
