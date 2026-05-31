from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sessions", "0002_session_capacity"),
    ]

    operations = [
        migrations.AddField(
            model_name="session",
            name="meeting_link",
            field=models.URLField(blank=True),
        ),
    ]
