import os

import jwt
import requests
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Booking
from .serializers import BookingSerializer

JWT_SECRET = os.getenv("JWT_SECRET", "dev-jwt-secret")
JWT_ALGORITHM = "HS256"
SESSIONS_SERVICE_URL = os.getenv("SESSIONS_SERVICE_URL", "http://sessions-service:8000")


def current_user(request):
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None, Response({"detail": "Missing bearer token."}, status=401)
    try:
        return jwt.decode(header.removeprefix("Bearer "), JWT_SECRET, algorithms=[JWT_ALGORITHM]), None
    except jwt.PyJWTError:
        return None, Response({"detail": "Invalid or expired token."}, status=401)


class BookingListCreateView(APIView):
    def get(self, request):
        user, error = current_user(request)
        if error:
            return error
        qs = Booking.objects.filter(user_id=user["id"])
        bucket = request.query_params.get("bucket")
        if bucket == "active":
            qs = qs.filter(starts_at__gte=timezone.now(), status=Booking.ACTIVE)
        if bucket == "past":
            qs = qs.filter(starts_at__lt=timezone.now())
        return Response(BookingSerializer(qs, many=True).data)

    def post(self, request):
        user, error = current_user(request)
        if error:
            return error
        if user.get("role") != "user":
            return Response({"detail": "Only users can book sessions."}, status=403)
        session_id = request.data.get("session_id")
        if not session_id:
            return Response({"detail": "session_id is required."}, status=400)

        session_response = requests.get(f"{SESSIONS_SERVICE_URL}/api/sessions/{session_id}/", timeout=10)
        if session_response.status_code != 200:
            return Response({"detail": "Session not found."}, status=404)
        session = session_response.json()
        if not session.get("is_active"):
            return Response({"detail": "Session is not active."}, status=400)

        try:
            starts_at = parse_datetime(session["starts_at"]) or session["starts_at"]
            booking = Booking.objects.create(
                user_id=user["id"],
                user_name=user.get("name") or user.get("email") or "User",
                user_email=user.get("email") or "unknown@example.com",
                session_id=session["id"],
                session_title=session["title"],
                session_creator_id=session["creator_id"],
                starts_at=starts_at,
            )
        except IntegrityError:
            return Response({"detail": "You already booked this session."}, status=409)
        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class BookingDetailView(APIView):
    def patch(self, request, pk):
        user, error = current_user(request)
        if error:
            return error
        filters = {"pk": pk} if user.get("role") == "admin" else {"pk": pk, "user_id": user["id"]}
        booking = get_object_or_404(Booking, **filters)
        if request.data.get("status") in [Booking.ACTIVE, Booking.CANCELLED]:
            booking.status = request.data["status"]
            booking.save()
        return Response(BookingSerializer(booking).data)

    def delete(self, request, pk):
        user, error = current_user(request)
        if error:
            return error
        if user.get("role") != "admin":
            return Response({"detail": "Only admins can delete bookings."}, status=403)
        booking = get_object_or_404(Booking, pk=pk)
        booking.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CreatorBookingsView(APIView):
    def get(self, request):
        user, error = current_user(request)
        if error:
            return error
        if user.get("role") != "creator":
            return Response({"detail": "Only creators can view booking overview."}, status=403)
        qs = Booking.objects.filter(session_creator_id=user["id"])
        return Response(BookingSerializer(qs, many=True).data)


class AdminBookingsView(APIView):
    def get(self, request):
        user, error = current_user(request)
        if error:
            return error
        if user.get("role") != "admin":
            return Response({"detail": "Only admins can view all bookings."}, status=403)
        return Response(BookingSerializer(Booking.objects.all(), many=True).data)
