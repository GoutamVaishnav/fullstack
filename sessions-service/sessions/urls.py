from django.urls import path

from .views import AdminSessionsView, SessionDetailView, SessionListCreateView, MySessionsView

urlpatterns = [
    path("", SessionListCreateView.as_view()),
    path("admin/", AdminSessionsView.as_view()),
    path("mine/", MySessionsView.as_view()),
    path("<int:pk>/", SessionDetailView.as_view()),
]
