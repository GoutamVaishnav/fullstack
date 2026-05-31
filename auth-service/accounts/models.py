from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    USER = "user"
    CREATOR = "creator"
    ADMIN = "admin"
    ROLE_CHOICES = [(USER, "User"), (CREATOR, "Creator"), (ADMIN, "Admin")]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=USER)
    avatar = models.URLField(blank=True)
    oauth_provider = models.CharField(max_length=40, blank=True)
    oauth_id = models.CharField(max_length=120, blank=True)
    is_blocked = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.email or self.user.username} ({self.role})"
