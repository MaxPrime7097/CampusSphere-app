from django.urls import re_path
from messaging import consumers as chat_consumers
from notifications import consumers as notification_consumers

websocket_urlpatterns = [
    # Chat WebSockets
    re_path(r'ws/chat/(?P<conversation_id>\w+)/', chat_consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/conversations/(?P<conversation_id>\w+)/', chat_consumers.ChatConsumer.as_asgi()),
    
    # Notification WebSockets
    re_path(r'ws/notifications/', notification_consumers.NotificationConsumer.as_asgi()),
]
