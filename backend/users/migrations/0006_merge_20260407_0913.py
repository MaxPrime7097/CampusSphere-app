from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_adminauditlog"),
        ("users", "0005_add_profile_complete_field"),
    ]

    operations = []
