from django.urls import path
from . import views

app_name = 'posts'

urlpatterns = [
    # Post CRUD
    path('', views.PostListView.as_view(), name='post-list'),

    # Post interactions
    path('<int:pk>/like/', views.PostLikeView.as_view(), name='post-like'),
    path('<int:pk>/save/', views.PostSaveToggleView.as_view(), name='post-save'),
    path('<int:pk>/report/', views.PostReportView.as_view(), name='post-report'),
    path('<int:pk>/impact-rate/', views.PostImpactRatingView.as_view(), name='post-impact-rate'),
    path('<int:pk>/pin/', views.PostPinView.as_view(), name='post-pin'),

    # Post detail must come after explicit interaction routes
    path('<int:pk>/', views.PostDetailView.as_view(), name='post-detail'),

    # Comments
    path('<int:pk>/comments/', views.PostCommentsView.as_view(), name='post-comments'),
    path('comments/<int:pk>/like/', views.CommentLikeView.as_view(), name='comment-like'),

    # Filtered posts
    path('saved/', views.user_saved_posts, name='user-saved-posts'),
    path('sphere/<int:sphere_id>/', views.sphere_posts, name='sphere-posts'),
    path('user/<int:user_id>/', views.user_posts, name='user-posts'),
]
