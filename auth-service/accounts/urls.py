from django.urls import path

from .views import AdminUsersView, DevLoginView, GoogleCallbackView, GoogleUrlView, MeView

urlpatterns = [
    path("google/url/", GoogleUrlView.as_view()),
    path("google/callback/", GoogleCallbackView.as_view()),
    path("dev-login/", DevLoginView.as_view()),
    path("me/", MeView.as_view()),
    path("admin/users/", AdminUsersView.as_view()),
]
