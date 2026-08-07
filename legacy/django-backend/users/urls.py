from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Authentication
    path('auth/register/', views.UserRegistrationView.as_view(), name='register'),
    path('auth/login/', views.UserLoginView.as_view(), name='login'),
    path('auth/password-reset/', views.PasswordResetView.as_view(), name='password-reset'),
    path('auth/me/', views.current_user_profile, name='current-user'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('auth/change-email/', views.ChangeEmailView.as_view(), name='change-email'),
    path('auth/delete-account/', views.DeleteAccountView.as_view(), name='delete-account'),
    path('check-availability/', views.CheckAvailabilityView.as_view(), name='check-availability'),
    
    # Supabase Auth
    path('auth/supabase/exchange-token/', views.SupabaseTokenExchangeView.as_view(), name='supabase-token-exchange'),
    path('auth/supabase/complete-profile/', views.CompleteSupabaseProfileView.as_view(), name='supabase-complete-profile'),
    path('privacy/', views.PrivacySettingsView.as_view(), name='privacy-settings'),
    path('data-export/', views.DataExportView.as_view(), name='data-export'),
    path('blocks/', views.BlockListView.as_view(), name='block-list'),
    path('blocks/<int:pk>/', views.BlockDetailView.as_view(), name='block-detail'),

    # Contact
    path('contact/', views.ContactMessageCreateView.as_view(), name='contact-create'),
    path('admin/contact-messages/', views.ContactMessageListView.as_view(), name='admin-contact-list'),
    path('admin/contact-messages/<int:pk>/', views.ContactMessageDetailView.as_view(), name='admin-contact-detail'),

    # User management
    path('<int:id>/', views.UserDetailView.as_view(), name='user-detail'),
    path('by-username/<str:username>/', views.get_user_by_username, name='user-by-username'),
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('me/verify/', views.UserVerificationView.as_view(), name='user-verify'),
    path('search/', views.UserSearchView.as_view(), name='user-search'),

    # Connections
    path('<int:id>/connections/', views.ConnectionListView.as_view(), name='user-connections'),
    path('<int:id>/connection-relation/', views.ConnectionRelationView.as_view(), name='user-connection-relation'),
    path('<int:id>/connections/<int:pk>/', views.ConnectionDetailView.as_view(), name='connection-detail'),
]
