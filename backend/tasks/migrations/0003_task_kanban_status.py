from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="kanban_status",
            field=models.CharField(
                choices=[
                    ("todo", "À faire"),
                    ("in_progress", "En cours"),
                    ("review", "En révision"),
                    ("done", "Terminé"),
                ],
                default="todo",
                max_length=20,
            ),
        ),
        # Migrate existing completed tasks to 'done'
        migrations.RunSQL(
            "UPDATE tasks_task SET kanban_status = 'done' WHERE is_completed = TRUE;",
            reverse_sql="UPDATE tasks_task SET is_completed = FALSE WHERE kanban_status = 'todo';",
        ),
    ]
