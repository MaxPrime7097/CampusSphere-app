from django.db import migrations, models


def normalize_current_mood(apps, schema_editor):
    User = apps.get_model('users', 'User')

    normalization_map = {
        '🚀 En pleine révision !': 'excited',
        '😴 Fatigué mais motivé': 'focused',
        "💡 Plein d'idées !": 'inspired',
        '🎯 Concentré sur mes objectifs': 'focused',
        '🤝 Prêt à collaborer': 'collaborating',
        '📚 En mode apprentissage': 'learning',
        "☕ Besoin d'un café": 'focused',
        '🌟 Inspiré et créatif': 'inspired',
        '🏃‍♂️ En mouvement': 'excited',
        '🧘‍♀️ Au calme': 'focused',
        '🎉 Fêtant les réussites': 'excited',
        '💪 Déterminé': 'determined',
        'Excited': 'excited',
        'Focused': 'focused',
        'Collaborating': 'collaborating',
        'Learning': 'learning',
        'Inspired': 'inspired',
        'Determined': 'determined',
    }

    allowed_values = {
        'excited',
        'focused',
        'collaborating',
        'learning',
        'inspired',
        'determined',
    }

    for user in User.objects.all().only('id', 'current_mood'):
        current_value = (user.current_mood or '').strip()
        normalized_value = normalization_map.get(current_value, current_value)

        if normalized_value not in allowed_values:
            normalized_value = 'excited'

        if normalized_value != user.current_mood:
            user.current_mood = normalized_value
            user.save(update_fields=['current_mood'])


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_privacy_settings_and_blocks'),
    ]

    operations = [
        migrations.RunPython(normalize_current_mood, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='user',
            name='current_mood',
            field=models.CharField(
                choices=[
                    ('excited', 'Excited'),
                    ('focused', 'Focused'),
                    ('collaborating', 'Collaborating'),
                    ('learning', 'Learning'),
                    ('inspired', 'Inspired'),
                    ('determined', 'Determined'),
                ],
                default='excited',
                max_length=50,
            ),
        ),
    ]
