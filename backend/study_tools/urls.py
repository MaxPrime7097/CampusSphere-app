from django.urls import path
from .views import (
    GenerateFromResourceView,
    GenerateFromUploadView,
    StudySessionListView,
    StudySessionDetailView,
    ShareStudySessionView,
    SphereStudySessionsView,
)

urlpatterns = [
    # Génération
    path("generate/from-resource/", GenerateFromResourceView.as_view(), name="study-generate-resource"),
    path("generate/from-upload/", GenerateFromUploadView.as_view(), name="study-generate-upload"),

    # Sessions
    path("sessions/", StudySessionListView.as_view(), name="study-session-list"),
    path("sessions/<int:pk>/", StudySessionDetailView.as_view(), name="study-session-detail"),
    path("sessions/<int:pk>/share/", ShareStudySessionView.as_view(), name="study-session-share"),

    # Sphères
    path("sphere/<int:sphere_id>/", SphereStudySessionsView.as_view(), name="study-sphere-sessions"),
]
