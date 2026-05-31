from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_admin_role"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="is_blocked",
            field=models.BooleanField(default=False),
        ),
    ]
