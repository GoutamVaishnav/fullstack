from rest_framework import serializers

from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            "id",
            "user_id",
            "user_name",
            "user_email",
            "session_id",
            "session_title",
            "session_creator_id",
            "starts_at",
            "status",
            "created_at",
        ]
        read_only_fields = fields
