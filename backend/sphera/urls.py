from django.urls import path
from .views import (
    # V1 — Génération
    GenerateFromResourceView,
    GenerateFromUploadView,
    # V1 — Sessions
    StudySessionListView,
    StudySessionDetailView,
    ShareStudySessionView,
    SphereStudySessionsView,
    # V2 — Q&A
    AskQuestionView,
    # V2 — Annales
    GenerateAnnaleView,
    AnnaleSessionListView,
    AnnaleSessionDetailView,
    ShareAnnaleSessionView,
    SphereAnnaleSessionsView,
)

urlpatterns = [
    # --- V1 : Génération ---
    path("generate/from-resource/", GenerateFromResourceView.as_view(), name="sphera-generate-resource"),
    path("generate/from-upload/",   GenerateFromUploadView.as_view(),   name="sphera-generate-upload"),

    # --- V1 : Sessions ---
    path("sessions/",               StudySessionListView.as_view(),      name="sphera-session-list"),
    path("sessions/<int:pk>/",      StudySessionDetailView.as_view(),    name="sphera-session-detail"),
    path("sessions/<int:pk>/share/", ShareStudySessionView.as_view(),   name="sphera-session-share"),

    # --- V2 : Q&A ---
    path("sessions/<int:pk>/ask/",  AskQuestionView.as_view(),          name="sphera-session-ask"),

    # --- V1 : Sphères (sessions) ---
    path("sphere/<int:sphere_id>/", SphereStudySessionsView.as_view(),  name="sphera-sphere-sessions"),

    # --- V2 : Annales ---
    path("generate/annale/",               GenerateAnnaleView.as_view(),       name="sphera-generate-annale"),
    path("annales/",                       AnnaleSessionListView.as_view(),    name="sphera-annale-list"),
    path("annales/<int:pk>/",             AnnaleSessionDetailView.as_view(),  name="sphera-annale-detail"),
    path("annales/<int:pk>/share/",       ShareAnnaleSessionView.as_view(),   name="sphera-annale-share"),
    path("sphere/<int:sphere_id>/annales/", SphereAnnaleSessionsView.as_view(), name="sphera-sphere-annales"),
]
