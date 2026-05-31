from django.urls import path

from .views import AdminBookingsView, BookingDetailView, BookingListCreateView, CreatorBookingsView

urlpatterns = [
    path("", BookingListCreateView.as_view()),
    path("admin/", AdminBookingsView.as_view()),
    path("creator/", CreatorBookingsView.as_view()),
    path("<int:pk>/", BookingDetailView.as_view()),
]
