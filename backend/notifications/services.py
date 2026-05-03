from notifications.models import Notification


def create_notification(notification_type, title, message, recipient, data=None, sender=None):
    """Create an in-app notification and optionally trigger async email delivery."""
    if sender is not None and sender == recipient:
        return None

    if data is None:
        data = {}

    if sender is not None:
        data.setdefault('sender_id', str(sender.id))
        data.setdefault('sender_name', getattr(sender, 'full_name', sender.username))
        sender_avatar = getattr(sender, 'avatar', None)
        # ImageFieldFile is not JSON serializable, so we store the URL string
        if sender_avatar:
            try:
                data.setdefault('sender_avatar', sender_avatar.url)
            except ValueError:
                data.setdefault('sender_avatar', None)
        else:
            data.setdefault('sender_avatar', None)

    notification = Notification.objects.create(
        type=notification_type,
        title=title,
        message=message,
        recipient=recipient,
        data=data,
    )

    # Broadcast via Channels
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        
        async_to_sync(channel_layer.group_send)(
            f'user_notifications_{recipient.id}',
            {
                'type': 'send_notification',
                'payload': {
                    'id': str(notification.id),
                    'type': notification_type,
                    'title': title,
                    'message': message,
                    'data': data,
                    'created_at': notification.created_at.isoformat(),
                    'is_read': False
                }
            }
        )
    except Exception:
        # Broadcasting failures should not block notification creation
        pass

    try:
        from notifications.tasks import send_notification_email_task
        send_notification_email_task.delay(str(notification.id))
    except Exception:
        pass

    return notification


def create_post_like_notification(post, liker):
    """Create notification when someone likes a post."""
    return create_notification(
        notification_type='post_like',
        title='Nouveau like sur votre post',
        message=f'{liker.full_name} a aimé votre post',
        recipient=post.author,
        sender=liker,
        data={
            'post_id': str(post.id),
            'user_id': str(liker.id),
            'post_content': post.content[:100],
        },
    )


def create_post_comment_notification(post, commenter, comment):
    """Create notification when someone comments on a post."""
    return create_notification(
        notification_type='post_comment',
        title='Nouveau commentaire sur votre post',
        message=f'{commenter.full_name} a commenté votre post',
        recipient=post.author,
        sender=commenter,
        data={
            'post_id': str(post.id),
            'comment_id': str(comment.id),
            'user_id': str(commenter.id),
            'comment_content': comment.content[:100],
        },
    )


def create_mention_post_notification(post, mentioned_user, sender):
    """Create notification when a user is mentioned in a post."""
    return create_notification(
        notification_type='mention_post',
        title='Vous avez été mentionné dans un post',
        message=f'{sender.full_name} vous a mentionné dans un post',
        recipient=mentioned_user,
        sender=sender,
        data={
            'post_id': str(post.id),
            'sender_id': str(sender.id),
            'sender_name': sender.full_name,
            'post_content': post.content[:100],
        },
    )


def create_mention_comment_notification(post, comment, mentioned_user, sender):
    """Create notification when a user is mentioned in a comment."""
    return create_notification(
        notification_type='mention_comment',
        title='Vous avez été mentionné dans un commentaire',
        message=f'{sender.full_name} vous a mentionné dans un commentaire',
        recipient=mentioned_user,
        sender=sender,
        data={
            'post_id': str(post.id),
            'comment_id': str(comment.id),
            'sender_id': str(sender.id),
            'sender_name': sender.full_name,
            'comment_content': comment.content[:100],
        },
    )


def create_sphere_invitation_notification(sphere, inviter, invitee):
    """Create notification when someone is invited to a sphere."""
    return create_notification(
        notification_type='sphere_invitation',
        title='Invitation à rejoindre une sphère',
        message=f'{inviter.full_name} vous a invité à rejoindre "{sphere.name}"',
        recipient=invitee,
        sender=inviter,
        data={
            'sphere_id': str(sphere.id),
            'inviter_id': str(inviter.id),
            'sphere_name': sphere.name,
        },
    )


def create_task_assigned_notification(task, assigner):
    """Create notification when a task is assigned."""
    if not task.assigned_to:
        return None

    return create_notification(
        notification_type='task_assigned',
        title='Nouvelle tâche assignée',
        message=f'{assigner.full_name} vous a assigné la tâche "{task.title}"',
        recipient=task.assigned_to,
        sender=assigner,
        data={
            'task_id': str(task.id),
            'assigner_id': str(assigner.id),
            'sphere_id': str(task.sphere.id),
            'task_title': task.title,
            'due_date': task.due_date.isoformat() if task.due_date else None,
        },
    )


def create_connection_request_notification(connection):
    """Create notification when someone sends a connection request."""
    return create_notification(
        notification_type='connection_request',
        title='Nouvelle demande de connexion',
        message=f'{connection.requester.full_name} souhaite se connecter avec vous',
        recipient=connection.recipient,
        sender=connection.requester,
        data={
            'connection_id': str(connection.id),
            'requester_id': str(connection.requester.id),
            'requester_username': connection.requester.username,
            'sender_username': connection.requester.username,
        },
    )


def create_connection_accepted_notification(connection):
    """Create notification when someone accepts a connection request."""
    return create_notification(
        notification_type='connection_accepted',
        title='Connexion acceptée',
        message=f'{connection.recipient.full_name} a accepté votre demande de connexion',
        recipient=connection.requester,
        sender=connection.recipient,
        data={
            'connection_id': str(connection.id),
            'recipient_id': str(connection.recipient.id),
            'recipient_username': connection.recipient.username,
            'sender_username': connection.recipient.username,
        },
    )


def create_message_notification(message):
    """Create notification when someone receives a message."""
    conversation = message.conversation

    for participant in conversation.participants.exclude(id=message.author.id):
        settings = getattr(participant, 'notification_settings', None)
        if settings and settings.in_app_messages:
            create_notification(
                notification_type='message_received',
                title='Nouveau message',
                message=f'{message.author.full_name} vous a envoyé un message',
                recipient=participant,
                sender=message.author,
                data={
                    'conversation_id': str(conversation.id),
                    'message_id': str(message.id),
                    'sender_id': str(message.author.id),
                    'sender_username': message.author.username,
                    'conversation_type': conversation.type,
                },
            )
