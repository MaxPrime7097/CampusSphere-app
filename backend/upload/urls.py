from django.urls import path
from . import views

app_name = 'upload'

urlpatterns = [
    # General file upload
    path('upload/', views.FileUploadView.as_view(), name='file-upload'),
    path('upload/<uuid:pk>/', views.FileDetailView.as_view(), name='file-detail'),

    # Specific upload types
    path('users/<int:user_id>/avatar/', views.upload_avatar, name='upload-avatar'),
    path('users/<int:user_id>/cover/', views.upload_cover_photo, name='upload-cover'),

    # User uploads management
    path('uploads/', views.user_uploads, name='user-uploads'),
    path('uploads/stats/', views.upload_stats, name='upload-stats'),
]