import os
import time
from urllib.parse import urlencode

import jwt
import requests
from django.contrib.auth.models import User
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Profile


JWT_SECRET = os.getenv("JWT_SECRET", "dev-jwt-secret")
JWT_ALGORITHM = "HS256"


def admin_emails():
    return {email.strip().lower() for email in os.getenv("ADMIN_EMAILS", "").split(",") if email.strip()}


def user_payload(user):
    profile, _ = Profile.objects.get_or_create(user=user)
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.get_full_name() or user.username,
        "role": profile.role,
        "avatar": profile.avatar,
        "status": "blocked" if profile.is_blocked else "active",
        "is_blocked": profile.is_blocked,
        "member_since": user.date_joined.isoformat(),
    }


def profile_payload(profile):
    user = profile.user
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.get_full_name() or user.username,
        "role": profile.role,
        "avatar": profile.avatar,
        "status": "blocked" if profile.is_blocked else "active",
        "is_blocked": profile.is_blocked,
        "member_since": user.date_joined.isoformat(),
    }


def issue_token(user):
    payload = user_payload(user)
    payload.update({"sub": str(user.id), "iat": int(time.time()), "exp": int(time.time()) + 60 * 60 * 24})
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def authenticated_user(request):
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None, Response({"detail": "Missing bearer token."}, status=status.HTTP_401_UNAUTHORIZED)
    try:
        payload = jwt.decode(header.removeprefix("Bearer "), JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None, Response({"detail": "Invalid or expired token."}, status=status.HTTP_401_UNAUTHORIZED)
    try:
        return User.objects.get(id=payload["sub"]), None
    except User.DoesNotExist:
        return None, Response({"detail": "User not found."}, status=status.HTTP_401_UNAUTHORIZED)


class GoogleUrlView(APIView):
    def get(self, request):
        client_id = os.getenv("GOOGLE_CLIENT_ID", "")
        redirect_uri = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:8080/auth/callback")
        if not client_id:
            return Response({"detail": "GOOGLE_CLIENT_ID is not configured."}, status=400)
        query = urlencode(
            {
                "client_id": client_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": "openid email profile",
                "access_type": "offline",
                "prompt": "select_account",
            }
        )
        return Response({"url": f"https://accounts.google.com/o/oauth2/v2/auth?{query}"})


class GoogleCallbackView(APIView):
    @transaction.atomic
    def post(self, request):
        code = request.data.get("code")
        if not code:
            return Response({"detail": "OAuth code is required."}, status=400)

        token_response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                "code": code,
                "redirect_uri": os.getenv("OAUTH_REDIRECT_URI", "http://localhost:8080/auth/callback"),
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
            timeout=10,
        )
        access_token = token_response.json().get("access_token")
        if not access_token:
            return Response({"detail": "Google token exchange failed."}, status=400)

        user_response = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        google_user = user_response.json()
        email = google_user.get("email")
        if not email:
            return Response({"detail": "Google account has no accessible email."}, status=400)

        username = f"google-{google_user['sub']}"
        user, _ = User.objects.get_or_create(username=username, defaults={"email": email})
        user.email = email
        user.first_name = google_user.get("name") or email.split("@")[0]
        user.save()
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.oauth_provider = "google"
        profile.oauth_id = str(google_user["sub"])
        profile.avatar = google_user.get("picture") or profile.avatar
        if email.lower() in admin_emails():
            profile.role = Profile.ADMIN
        profile.save()
        if profile.is_blocked:
            return Response({"detail": "This account is blocked."}, status=403)

        return Response({"token": issue_token(user), "user": user_payload(user)})


class DevLoginView(APIView):
    @transaction.atomic
    def post(self, request):
        if os.getenv("ENABLE_DEV_LOGIN", "0") != "1":
            return Response({"detail": "Development login is disabled."}, status=403)
        role = request.data.get("role", Profile.USER)
        if role not in [Profile.USER, Profile.CREATOR, Profile.ADMIN]:
            return Response({"detail": "Role must be user, creator, or admin."}, status=400)
        email = request.data.get("email") or f"{role}@demo.local"
        name = request.data.get("name") or ("Demo Creator" if role == Profile.CREATOR else "Demo User")
        user, _ = User.objects.get_or_create(username=email, defaults={"email": email})
        user.email = email
        user.first_name = name
        user.save()
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.role = role
        profile.avatar = request.data.get("avatar", profile.avatar)
        profile.save()
        return Response({"token": issue_token(user), "user": user_payload(user)})


class MeView(APIView):
    def get(self, request):
        user, error = authenticated_user(request)
        if error:
            return error
        return Response(user_payload(user))

    def patch(self, request):
        user, error = authenticated_user(request)
        if error:
            return error
        user.first_name = request.data.get("name", user.get_full_name() or user.username)
        user.save()
        profile, _ = Profile.objects.get_or_create(user=user)
        if "avatar" in request.data:
            profile.avatar = request.data["avatar"]
        requested_role = request.data.get("role")
        allowed_roles = [Profile.USER, Profile.CREATOR]
        if profile.role == Profile.ADMIN or user.email.lower() in admin_emails():
            allowed_roles.append(Profile.ADMIN)
        if requested_role in allowed_roles:
            profile.role = requested_role
        profile.save()
        return Response({"token": issue_token(user), "user": user_payload(user)})


class AdminUsersView(APIView):
    def get(self, request):
        user, error = authenticated_user(request)
        if error:
            return error
        profile, _ = Profile.objects.get_or_create(user=user)
        if profile.role != Profile.ADMIN:
            return Response({"detail": "Only admins can view users."}, status=403)
        profiles = Profile.objects.select_related("user").order_by("-user__date_joined")
        return Response([profile_payload(item) for item in profiles])

    def patch(self, request):
        user, error = authenticated_user(request)
        if error:
            return error
        profile, _ = Profile.objects.get_or_create(user=user)
        if profile.role != Profile.ADMIN:
            return Response({"detail": "Only admins can update users."}, status=403)
        target = get_object_or_404(User, id=request.data.get("user_id"))
        target_profile, _ = Profile.objects.get_or_create(user=target)
        if request.data.get("role") in [Profile.USER, Profile.CREATOR, Profile.ADMIN]:
            target_profile.role = request.data["role"]
        if "name" in request.data:
            target.first_name = request.data["name"]
            target.save()
        if "is_blocked" in request.data:
            target_profile.is_blocked = bool(request.data["is_blocked"])
        target_profile.save()
        return Response(profile_payload(target_profile))

    def delete(self, request):
        user, error = authenticated_user(request)
        if error:
            return error
        profile, _ = Profile.objects.get_or_create(user=user)
        if profile.role != Profile.ADMIN:
            return Response({"detail": "Only admins can delete users."}, status=403)
        target_id = request.data.get("user_id") or request.query_params.get("user_id")
        target = get_object_or_404(User, id=target_id)
        if target.id == user.id:
            return Response({"detail": "You cannot delete your own admin account."}, status=400)
        target.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
