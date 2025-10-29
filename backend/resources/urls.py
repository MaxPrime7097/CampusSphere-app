from django.urls import path
from . import views

app_name = 'resources'

urlpatterns = [
    # Resource CRUD
    path('', views.ResourceListView.as_view(), name='resource-list'),
    path('<int:pk>/', views.ResourceDetailView.as_view(), name='resource-detail'),

    # Resource interactions
    path('<int:pk>/download/', views.ResourceDownloadView.as_view(), name='resource-download'),
    path('<int:pk>/save/', views.ResourceSaveView.as_view(), name='resource-save'),
    path('<int:pk>/view/', views.ResourceViewTrackingView.as_view(), name='resource-view'),

    # User resources
    path('saved/', views.user_saved_resources, name='user-saved-resources'),
    path('user/<int:user_id>/', views.user_resources, name='user-resources'),
]