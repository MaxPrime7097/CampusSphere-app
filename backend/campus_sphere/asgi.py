import os
import django
from django.core.asgi import get_asgi_application

# Set settings module before any other imports
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_sphere.settings')

# Initialize Django ASGI application early to ensure AppRegistry is ready
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from campus_sphere.middleware import JwtAuthMiddleware
import campus_sphere.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JwtAuthMiddleware(
        AuthMiddlewareStack(
            URLRouter(
                campus_sphere.routing.websocket_urlpatterns
            )
        )
    ),
})
