from celery import shared_task
from .email_service import EmailNotificationService
from .models import Notification
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_notification_email_task(notification_id):
    """Celery task to send notification emails asynchronously"""
    try:
        notification = Notification.objects.get(id=notification_id)
        success = EmailNotificationService.send_notification_email(notification)
        
        if success:
            logger.info(f"Email notification sent successfully for notification {notification_id}")
        else:
            logger.warning(f"Email notification not sent for notification {notification_id}")
            
        return success
        
    except Notification.DoesNotExist:
        logger.error(f"Notification {notification_id} not found")
        return False
    except Exception as e:
        logger.error(f"Error sending email notification {notification_id}: {str(e)}")
        return False


@shared_task
def send_welcome_email_task(user_id):
    """Celery task to send welcome email to new users"""
    try:
        from users.models import User
        user = User.objects.get(id=user_id)
        success = EmailNotificationService.send_welcome_email(user)
        
        if success:
            logger.info(f"Welcome email sent successfully to {user.email}")
        else:
            logger.warning(f"Welcome email not sent to {user.email}")
            
        return success
        
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return False
    except Exception as e:
        logger.error(f"Error sending welcome email to user {user_id}: {str(e)}")
        return False


@shared_task
def send_password_reset_email_task(user_id, reset_link):
    """Celery task to send password reset email"""
    try:
        from users.models import User
        user = User.objects.get(id=user_id)
        success = EmailNotificationService.send_password_reset_email(user, reset_link)
        
        if success:
            logger.info(f"Password reset email sent successfully to {user.email}")
        else:
            logger.warning(f"Password reset email not sent to {user.email}")
            
        return success
        
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return False
    except Exception as e:
        logger.error(f"Error sending password reset email to user {user_id}: {str(e)}")
        return False


@shared_task
def cleanup_old_notifications():
    """Celery task to cleanup old notifications (older than 30 days)"""
    try:
        from django.utils import timezone
        from datetime import timedelta
        
        cutoff_date = timezone.now() - timedelta(days=30)
        old_notifications = Notification.objects.filter(
            created_at__lt=cutoff_date,
            is_read=True
        )
        
        count = old_notifications.count()
        old_notifications.delete()
        
        logger.info(f"Cleaned up {count} old notifications")
        return count
        
    except Exception as e:
        logger.error(f"Error cleaning up old notifications: {str(e)}")
        return 0