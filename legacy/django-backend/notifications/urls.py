from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    # Notifications CRUD
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/', views.NotificationDetailView.as_view(), name='notification-detail'),

    # Notification actions
    path('notifications/<int:pk>/read/', views.NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path('notifications/read-all/', views.NotificationMarkAllReadView.as_view(), name='notification-mark-all-read'),

    # Notification settings
    path('notifications/settings/', views.NotificationSettingsView.as_view(), name='notification-settings'),

    # Notification stats
    path('notifications/stats/', views.notification_stats, name='notification-stats'),
]