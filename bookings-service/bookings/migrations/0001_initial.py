# Generated for the assignment scaffold.

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Booking",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("user_id", models.CharField(max_length=40)),
                ("user_name", models.CharField(max_length=160)),
                ("user_email", models.EmailField(max_length=254)),
                ("session_id", models.PositiveIntegerField()),
                ("session_title", models.CharField(max_length=180)),
                ("session_creator_id", models.CharField(max_length=40)),
                ("starts_at", models.DateTimeField()),
                ("status", models.CharField(choices=[("active", "Active"), ("cancelled", "Cancelled")], default="active", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddConstraint(
            model_name="booking",
            constraint=models.UniqueConstraint(fields=("user_id", "session_id"), name="one_booking_per_user_session"),
        ),
    ]
