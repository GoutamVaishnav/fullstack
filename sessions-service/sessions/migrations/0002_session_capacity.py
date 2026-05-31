from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sessions", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="session",
            name="capacity",
            field=models.PositiveIntegerField(default=20),
        ),
    ]
