import os

import jwt
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Session
from .serializers import SessionSerializer

JWT_SECRET = os.getenv("JWT_SECRET", "dev-jwt-secret")
JWT_ALGORITHM = "HS256"


def current_user(request, required=False):
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return (None, Response({"detail": "Missing bearer token."}, status=401)) if required else (None, None)
    try:
        return jwt.decode(header.removeprefix("Bearer "), JWT_SECRET, algorithms=[JWT_ALGORITHM]), None
    except jwt.PyJWTError:
        return None, Response({"detail": "Invalid or expired token."}, status=401)


class SessionListCreateView(APIView):
    def get(self, request):
        qs = Session.objects.filter(is_active=True)
        query = request.query_params.get("q")
        if query:
            qs = qs.filter(title__icontains=query) | qs.filter(category__icontains=query)
        return Response(SessionSerializer(qs, many=True).data)

    def post(self, request):
        user, error = current_user(request, required=True)
        if error:
            return error
        if user.get("role") not in ["creator", "admin"]:
            return Response({"detail": "Only creators can create sessions."}, status=403)
        serializer = SessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = serializer.save(creator_id=user["id"], creator_name=user.get("name") or user.get("email") or "Creator")
        return Response(SessionSerializer(session).data, status=status.HTTP_201_CREATED)


class MySessionsView(APIView):
    def get(self, request):
        user, error = current_user(request, required=True)
        if error:
            return error
        if user.get("role") not in ["creator", "admin"]:
            return Response({"detail": "Only creators can view managed sessions."}, status=403)
        if user.get("role") == "admin":
            return Response(SessionSerializer(Session.objects.all(), many=True).data)
        return Response(SessionSerializer(Session.objects.filter(creator_id=user["id"]), many=True).data)


class AdminSessionsView(APIView):
    def get(self, request):
        user, error = current_user(request, required=True)
        if error:
            return error
        if user.get("role") != "admin":
            return Response({"detail": "Only admins can view all sessions."}, status=403)
        return Response(SessionSerializer(Session.objects.all(), many=True).data)


class SessionDetailView(APIView):
    def get(self, request, pk):
        return Response(SessionSerializer(get_object_or_404(Session, pk=pk)).data)

    def patch(self, request, pk):
        user, error = current_user(request, required=True)
        if error:
            return error
        session = get_object_or_404(Session, pk=pk)
        if user.get("role") != "admin" and (user.get("role") != "creator" or session.creator_id != user["id"]):
            return Response({"detail": "You can only update your own sessions."}, status=403)
        serializer = SessionSerializer(session, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        user, error = current_user(request, required=True)
        if error:
            return error
        session = get_object_or_404(Session, pk=pk)
        if user.get("role") != "admin" and (user.get("role") != "creator" or session.creator_id != user["id"]):
            return Response({"detail": "You can only delete your own sessions."}, status=403)
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
