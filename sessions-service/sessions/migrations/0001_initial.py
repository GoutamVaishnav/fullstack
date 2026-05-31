# Generated for the assignment scaffold.

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Session",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("creator_id", models.CharField(max_length=40)),
                ("creator_name", models.CharField(max_length=160)),
                ("title", models.CharField(max_length=180)),
                ("description", models.TextField()),
                ("category", models.CharField(default="Meditation", max_length=80)),
                ("starts_at", models.DateTimeField()),
                ("duration_minutes", models.PositiveIntegerField(default=60)),
                ("price", models.DecimalField(decimal_places=2, default=0, max_digits=9)),
                ("image_url", models.URLField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["starts_at"]},
        ),
    ]
