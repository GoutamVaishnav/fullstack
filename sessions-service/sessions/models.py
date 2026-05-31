from django.db import models


class Session(models.Model):
    creator_id = models.CharField(max_length=40)
    creator_name = models.CharField(max_length=160)
    title = models.CharField(max_length=180)
    description = models.TextField()
    category = models.CharField(max_length=80, default="Meditation")
    starts_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    price = models.DecimalField(max_digits=9, decimal_places=2, default=0)
    capacity = models.PositiveIntegerField(default=20)
    image_url = models.URLField(blank=True)
    meeting_link = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["starts_at"]

    def __str__(self):
        return self.title
