from django.urls import path
from . import views

app_name = 'messaging'

urlpatterns = [
    # Conversations CRUD
    path('conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    path('conversations/<int:pk>/', views.ConversationDetailView.as_view(), name='conversation-detail'),

    # Messages
    path('conversations/<int:pk>/messages/', views.ConversationMessagesView.as_view(), name='conversation-messages'),
    path('conversations/<int:pk>/messages/<int:message_pk>/', views.MessageDetailView.as_view(), name='message-detail'),
    path('conversations/<int:pk>/read/', views.ConversationReadView.as_view(), name='conversation-read'),
    path('conversations/<int:pk>/unread/', views.ConversationUnreadView.as_view(), name='conversation-unread'),
    path('conversations/<int:pk>/leave/', views.leave_conversation, name='conversation-leave'),
    path('conversations/<int:pk>/avatar/', views.upload_conversation_avatar, name='conversation-avatar'),

    # Conversation management
    path('conversations/<int:pk>/participants/', views.conversation_participants, name='conversation-participants'),
    path('conversations/<int:pk>/participants/add/', views.add_participant, name='add-participant'),
    path('conversations/<int:pk>/participants/<int:user_id>/remove/', views.remove_participant, name='remove-participant'),

    # Convenience endpoints
    path('conversations/user/', views.user_conversations, name='user-conversations'),
    path('conversations/private/create/', views.create_private_conversation, name='create-private-conversation'),
    path('conversations/group/create/', views.create_group_conversation, name='create-group-conversation'),
]
