from django.urls import path
from . import views

app_name = 'tasks'

urlpatterns = [
    # Task CRUD
    path('', views.TaskListView.as_view(), name='task-list'),
    path('<int:pk>/', views.TaskDetailView.as_view(), name='task-detail'),

    # Task actions
    path('<int:pk>/complete/', views.TaskCompleteView.as_view(), name='task-complete'),
    path('<int:pk>/assign/', views.TaskAssignView.as_view(), name='task-assign'),

    # Filtered tasks
    path('sphere/<int:sphere_id>/', views.sphere_tasks, name='sphere-tasks'),
    path('user/', views.user_tasks, name='current-user-tasks'),
    path('user/<int:user_id>/', views.user_tasks, name='user-tasks'),
]