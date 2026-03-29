from django.urls import path
from . import views

app_name = 'posts'

urlpatterns = [
    # Post CRUD
    path('', views.PostListView.as_view(), name='post-list'),
    path('<int:pk>/', views.PostDetailView.as_view(), name='post-detail'),

    # Post interactions
    path('<int:pk>/like/', views.PostLikeView.as_view(), name='post-like'),
    path('<int:pk>/report/', views.PostReportView.as_view(), name='post-report'),
    path('<int:pk>/pin/', views.PostPinView.as_view(), name='post-pin'),

    # Comments
    path('<int:pk>/comments/', views.PostCommentsView.as_view(), name='post-comments'),
    path('comments/<int:pk>/like/', views.CommentLikeView.as_view(), name='comment-like'),

    # Filtered posts
    path('sphere/<int:sphere_id>/', views.sphere_posts, name='sphere-posts'),
    path('user/<int:user_id>/', views.user_posts, name='user-posts'),
]
