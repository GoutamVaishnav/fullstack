from django.urls import include, path

urlpatterns = [
    path("api/sessions/", include("sessions.urls")),
]
