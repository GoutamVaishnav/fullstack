from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="profile",
            name="role",
            field=models.CharField(choices=[("user", "User"), ("creator", "Creator"), ("admin", "Admin")], default="user", max_length=20),
        ),
    ]
