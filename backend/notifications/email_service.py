from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
from .models import NotificationSettings
import logging

logger = logging.getLogger(__name__)


class EmailNotificationService:
    """Service for sending email notifications"""

    @staticmethod
    def send_notification_email(notification):
        """Send email notification based on notification type and user settings"""
        user = notification.recipient
        
        # Get user's notification settings
        try:
            settings_obj = user.notification_settings
        except NotificationSettings.DoesNotExist:
            # Create default settings if they don't exist
            settings_obj = NotificationSettings.objects.create(user=user)

        # Check if user wants email notifications for this type
        email_enabled = EmailNotificationService._should_send_email(notification.type, settings_obj)
        
        if not email_enabled:
            return False

        try:
            # Prepare email content based on notification type
            subject, html_content, text_content = EmailNotificationService._prepare_email_content(notification)
            
            # Send email
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            
            logger.info(f"Email notification sent to {user.email} for {notification.type}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email notification to {user.email}: {str(e)}")
            return False

    @staticmethod
    def _should_send_email(notification_type, settings):
        """Check if email should be sent based on notification type and user settings"""
        email_settings_map = {
            'post_like': settings.email_post_likes,
            'post_comment': settings.email_post_comments,
            'comment_reply': settings.email_post_comments,
            'sphere_invitation': settings.email_sphere_invitations,
            'sphere_join_request': settings.email_sphere_invitations,
            'task_assigned': settings.email_task_assignments,
            'task_completed': settings.email_task_assignments,
            'connection_request': settings.email_messages,
            'connection_accepted': settings.email_messages,
            'message': settings.email_messages,
            'system': settings.system_updates,
        }
        
        return email_settings_map.get(notification_type, False)

    @staticmethod
    def _prepare_email_content(notification):
        """Prepare email content based on notification type"""
        user = notification.recipient
        data = notification.data
        
        # Base context for all emails
        context = {
            'user': user,
            'notification': notification,
            'data': data,
            'site_name': 'CampusSphere',
            'site_url': 'https://campus-sphere.com'
        }

        # Email templates and subjects based on notification type
        if notification.type == 'post_like':
            subject = f"🎉 {data.get('user_name', 'Quelqu\'un')} a aimé votre post"
            template = 'emails/post_like.html'
            
        elif notification.type == 'post_comment':
            subject = f"💬 Nouveau commentaire sur votre post"
            template = 'emails/post_comment.html'
            
        elif notification.type == 'sphere_invitation':
            subject = f"🌐 Invitation à rejoindre {data.get('sphere_name', 'une sphère')}"
            template = 'emails/sphere_invitation.html'
            
        elif notification.type == 'task_assigned':
            subject = f"✅ Nouvelle tâche assignée: {data.get('task_title', 'Tâche')}"
            template = 'emails/task_assigned.html'
            
        elif notification.type == 'connection_request':
            subject = f"🤝 Nouvelle demande de connexion"
            template = 'emails/connection_request.html'
            
        elif notification.type == 'message':
            subject = f"💬 Nouveau message de {data.get('sender_name', 'un utilisateur')}"
            template = 'emails/message_received.html'
            
        else:
            # Default template for other notification types
            subject = notification.title
            template = 'emails/default_notification.html'

        # Render HTML content
        try:
            html_content = render_to_string(template, context)
        except:
            # Fallback to default template if specific template doesn't exist
            html_content = render_to_string('emails/default_notification.html', context)
        
        # Create text version
        text_content = strip_tags(html_content)
        
        return subject, html_content, text_content

    @staticmethod
    def send_welcome_email(user):
        """Send welcome email to new users"""
        try:
            subject = "🎉 Bienvenue sur CampusSphere!"
            context = {
                'user': user,
                'site_name': 'CampusSphere',
                'site_url': 'https://campus-sphere.com'
            }
            
            html_content = render_to_string('emails/welcome.html', context)
            text_content = strip_tags(html_content)
            
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            
            logger.info(f"Welcome email sent to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
            return False

    @staticmethod
    def send_password_reset_email(user, reset_link):
        """Send password reset email"""
        try:
            subject = "🔐 Réinitialisation de votre mot de passe CampusSphere"
            context = {
                'user': user,
                'reset_link': reset_link,
                'site_name': 'CampusSphere',
                'site_url': 'https://campus-sphere.com'
            }
            
            html_content = render_to_string('emails/password_reset.html', context)
            text_content = strip_tags(html_content)
            
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            
            logger.info(f"Password reset email sent to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
            return False