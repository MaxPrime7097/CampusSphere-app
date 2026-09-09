from django.urls import path
from . import views

app_name = 'resources'

urlpatterns = [
    # ── Folders ──────────────────────────────────────────
    path('folders/', views.FolderListCreateView.as_view(), name='folder-list'),
    path('folders/<int:pk>/', views.FolderDetailView.as_view(), name='folder-detail'),
    path('folders/<int:pk>/download/', views.FolderDownloadZipView.as_view(), name='folder-download'),

    # ── Resource CRUD ────────────────────────────────────
    path('', views.ResourceListView.as_view(), name='resource-list'),
    path('<int:pk>/', views.ResourceDetailView.as_view(), name='resource-detail'),

    # ── Resource interactions ────────────────────────────
    path('<int:pk>/preview/', views.ResourcePreviewView.as_view(), name='resource-preview'),
    path('<int:pk>/download/', views.ResourceDownloadView.as_view(), name='resource-download'),
    path('<int:pk>/save/', views.ResourceSaveView.as_view(), name='resource-save'),
    path('<int:pk>/view/', views.ResourceViewTrackingView.as_view(), name='resource-view'),
    path('<int:pk>/report/', views.ResourceReportView.as_view(), name='resource-report'),
    path('<int:pk>/share/', views.ResourceShareTrackingView.as_view(), name='resource-share'),

    # ── User resources ───────────────────────────────────
    path('saved/', views.user_saved_resources, name='user-saved-resources'),
    path('user/<int:user_id>/', views.user_resources, name='user-resources'),
    path('sphere/<int:sphere_id>/', views.sphere_resources, name='sphere-resources'),
]
