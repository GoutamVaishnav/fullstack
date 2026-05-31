from rest_framework import serializers

from .models import Session


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = [
            "id",
            "creator_id",
            "creator_name",
            "title",
            "description",
            "category",
            "starts_at",
            "duration_minutes",
            "price",
            "capacity",
            "image_url",
            "meeting_link",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "creator_id", "creator_name", "created_at", "updated_at"]
