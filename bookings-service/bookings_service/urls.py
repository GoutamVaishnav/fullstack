from django.urls import include, path

urlpatterns = [
    path("api/bookings/", include("bookings.urls")),
]
