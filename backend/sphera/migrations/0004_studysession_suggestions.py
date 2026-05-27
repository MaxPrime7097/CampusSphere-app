# Generated migration to add suggestions field to StudySession
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sphera', '0003_annalesession_extracted_text_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='studysession',
            name='suggestions',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
