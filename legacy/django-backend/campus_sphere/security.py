"""
Security utilities and decorators for CampusSphere
"""
import re
from functools import wraps
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.utils.html import strip_tags
from ratelimit.decorators import ratelimit


def sanitize_input(text):
    """Sanitize user input to prevent XSS attacks"""
    if not text:
        return text

    # Remove HTML tags
    text = strip_tags(text)

    # Remove potential script injections
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
    text = re.sub(r'on\w+\s*=', '', text, flags=re.IGNORECASE)

    # Remove null bytes
    text = text.replace('\x00', '')

    return text.strip()


def validate_file_upload(file, allowed_types=None, max_size=None):
    """Validate uploaded file"""
    if not file:
        raise ValidationError("No file provided")

    # Check file size
    if max_size and file.size > max_size:
        raise ValidationError(f"File size exceeds maximum allowed size of {max_size} bytes")

    # Check file type
    if allowed_types:
        file_type = file.content_type.lower()
        if file_type not in allowed_types:
            raise ValidationError(f"File type {file_type} not allowed. Allowed types: {', '.join(allowed_types)}")

    # Check for malicious content in filename
    filename = file.name
    if '..' in filename or '/' in filename or '\\' in filename:
        raise ValidationError("Invalid filename")

    return True


def rate_limit(*rates):
    """Rate limiting decorator for views"""
    def decorator(view_func):
        @wraps(view_func)
        @ratelimit(key='user_or_ip', rate=rates[0] if rates else '100/h')
        def _wrapped_view(request, *args, **kwargs):
            if getattr(request, 'limited', False):
                return JsonResponse({
                    'success': False,
                    'error': 'Rate limit exceeded. Please try again later.',
                    'timestamp': request.timestamp.isoformat() if hasattr(request, 'timestamp') else None
                }, status=429)
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator


class SecurityMiddleware:
    """Custom security middleware"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Sanitize input data
        if request.method in ['POST', 'PUT', 'PATCH']:
            self._sanitize_request_data(request)

        # Add security headers
        response = self.get_response(request)
        self._add_security_headers(response)

        return response

    def _sanitize_request_data(self, request):
        """Sanitize POST/PUT/PATCH data"""
        if hasattr(request, 'data') and isinstance(request.data, dict):
            for key, value in request.data.items():
                if isinstance(value, str):
                    request.data[key] = sanitize_input(value)

    def _add_security_headers(self, response):
        """Add security headers to response"""
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Content Security Policy (basic)
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self' wss: ws:;"
        )
        response['Content-Security-Policy'] = csp


def validate_password_strength(password):
    """Validate password strength"""
    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters long")

    if not re.search(r'[A-Z]', password):
        raise ValidationError("Password must contain at least one uppercase letter")

    if not re.search(r'[a-z]', password):
        raise ValidationError("Password must contain at least one lowercase letter")

    if not re.search(r'\d', password):
        raise ValidationError("Password must contain at least one digit")

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValidationError("Password must contain at least one special character")

    return True


def validate_username(username):
    """Validate username format"""
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        raise ValidationError("Username can only contain letters, numbers, and underscores")

    if len(username) < 3:
        raise ValidationError("Username must be at least 3 characters long")

    if len(username) > 50:
        raise ValidationError("Username cannot exceed 50 characters")

    return True


def validate_email_domain(email):
    """Validate email domain (prevent disposable emails)"""
    # List of common disposable email domains
    disposable_domains = [
        '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
        'temp-mail.org', 'throwaway.email', 'yopmail.com'
    ]

    domain = email.split('@')[-1].lower()
    if domain in disposable_domains:
        raise ValidationError("Disposable email addresses are not allowed")

    return True


def log_security_event(event_type, user=None, ip_address=None, details=None):
    """Log security-related events"""
    import logging
    logger = logging.getLogger('campus_sphere.security')

    message = f"Security event: {event_type}"
    if user:
        message += f" | User: {user.username} ({user.id})"
    if ip_address:
        message += f" | IP: {ip_address}"
    if details:
        message += f" | Details: {details}"

    logger.warning(message)