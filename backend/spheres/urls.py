from django.urls import path
from . import views

app_name = 'spheres'

urlpatterns = [
    # Sphere CRUD
    path('', views.SphereListView.as_view(), name='sphere-list'),
    path('<int:pk>/', views.SphereDetailView.as_view(), name='sphere-detail'),

    # Sphere membership
    path('<int:pk>/join/', views.SphereJoinView.as_view(), name='sphere-join'),
    path('<int:pk>/leave/', views.SphereLeaveView.as_view(), name='sphere-leave'),
    path('<int:pk>/cancel-request/', views.SphereCancelJoinRequestView.as_view(), name='sphere-cancel-request'),
    path('<int:pk>/extend-duration/', views.SphereExtendDurationView.as_view(), name='sphere-extend-duration'),

    # Sphere members management
    path('<int:pk>/members/', views.SphereMembersView.as_view(), name='sphere-members'),
    path('<int:sphere_pk>/members/<int:pk>/', views.SphereMemberDetailView.as_view(), name='sphere-member-detail'),

    # User spheres
    path('user/spheres/', views.user_spheres, name='user-spheres'),

    # Overview
    path('<int:pk>/overview/', views.sphere_overview, name='sphere-overview'),
]
