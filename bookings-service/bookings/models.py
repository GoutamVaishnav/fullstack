from django.db import models


class Booking(models.Model):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    STATUS_CHOICES = [(ACTIVE, "Active"), (CANCELLED, "Cancelled")]

    user_id = models.CharField(max_length=40)
    user_name = models.CharField(max_length=160)
    user_email = models.EmailField()
    session_id = models.PositiveIntegerField()
    session_title = models.CharField(max_length=180)
    session_creator_id = models.CharField(max_length=40)
    starts_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user_id", "session_id"], name="one_booking_per_user_session")
        ]

    def __str__(self):
        return f"{self.user_email} -> {self.session_title}"
