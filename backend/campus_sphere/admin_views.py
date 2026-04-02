import csv
import json

from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from resources.models import Resource
from posts.models import Post
from spheres.models import Sphere
from users.models import AdminAuditLog, User
from resources.models import ResourceReport

from .admin_serializers import (
    AdminAuditLogSerializer,
    AdminModerationQueueItemSerializer,
    AdminReportedContentItemSerializer,
    AdminSummarySerializer,
)


def _display_name(user):
    if not user:
        return 'Utilisateur inconnu'
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.username


def _avatar_url(user):
    if user and user.avatar:
        try:
            return user.avatar.url
        except Exception:
            return None
    return None


def _human_readable_size(bytes_size):
    if not bytes_size:
        return '0 B'

    size = float(bytes_size)
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024.0:
            return f"{size:.1f} {unit}" if unit != 'B' else f"{int(size)} {unit}"
        size /= 1024.0
    return f"{size:.1f} PB"


def _audit_log_queryset(request):
    queryset = AdminAuditLog.objects.select_related('actor').order_by('-created_at')

    search = (request.query_params.get('q') or '').strip()
    action = (request.query_params.get('action') or '').strip()
    target_type = (request.query_params.get('target_type') or '').strip()
    actor_id = (request.query_params.get('actor_id') or '').strip()
    date_from = (request.query_params.get('date_from') or '').strip()
    date_to = (request.query_params.get('date_to') or '').strip()

    if search:
        queryset = queryset.filter(Q(target_id__icontains=search) | Q(target_type__icontains=search) | Q(action__icontains=search))

    if action:
        queryset = queryset.filter(action=action)

    if target_type:
        queryset = queryset.filter(target_type=target_type)

    if actor_id.isdigit():
        queryset = queryset.filter(actor_id=int(actor_id))

    if date_from:
        parsed = parse_datetime(date_from)
        if parsed:
            queryset = queryset.filter(created_at__gte=parsed)

    if date_to:
        parsed = parse_datetime(date_to)
        if parsed:
            queryset = queryset.filter(created_at__lte=parsed)

    return queryset


def _serialize_audit_logs(logs):
    payload = [
        {
            'id': log.id,
            'actor': _display_name(log.actor) if log.actor else None,
            'action': log.action,
            'targetType': log.target_type,
            'targetId': log.target_id,
            'payloadDiff': log.payload_diff,
            'createdAt': log.created_at,
        }
        for log in logs
    ]
    serializer = AdminAuditLogSerializer(payload, many=True)
    return serializer.data


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_moderation_queue(request):
    resources = Resource.objects.select_related('author').order_by('-created_at')[:50]
    payload = [
        {
            'id': str(resource.id),
            'title': resource.title,
            'type': resource.type,
            'subject': resource.subject,
            'size': _human_readable_size(resource.file_size),
            'uploadDate': resource.created_at,
            'uploader': {
                'name': _display_name(resource.author),
                'avatar': _avatar_url(resource.author),
            },
        }
        for resource in resources
    ]

    serializer = AdminModerationQueueItemSerializer(payload, many=True)
    return Response({'success': True, 'data': serializer.data})


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_reported_content(request):
    posts = Post.objects.select_related('author').order_by('-created_at')[:50]
    resource_reports = ResourceReport.objects.select_related('resource', 'reporter').order_by('-created_at')[:50]

    payload = [
        {
            'id': str(post.id),
            'type': 'post',
            'content': post.content[:180],
            'reason': 'Pending moderation review',
            'date': post.created_at,
            'status': 'pending',
            'reporter': {
                'name': _display_name(post.author),
                'avatar': _avatar_url(post.author),
            },
        }
        for post in posts
    ]
    payload.extend([
        {
            'id': str(report.id),
            'type': 'resource',
            'content': report.resource.title[:180],
            'reason': report.reason,
            'date': report.created_at,
            'status': report.status,
            'reporter': {
                'name': _display_name(report.reporter),
                'avatar': _avatar_url(report.reporter),
            },
        }
        for report in resource_reports
    ])
    payload = sorted(payload, key=lambda item: item['date'] or timezone.now(), reverse=True)[:50]

    serializer = AdminReportedContentItemSerializer(payload, many=True)
    return Response({'success': True, 'data': serializer.data})


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_user_management_summary(request):
    today = timezone.localdate()
    summary = {
        'totalUsers': User.objects.count(),
        'newUsersToday': User.objects.filter(date_joined__date=today).count(),
        'pendingResources': Resource.objects.count(),
        'reportedContent': Post.objects.count() + ResourceReport.objects.filter(status='pending').count(),
        'activeGroups': Sphere.objects.count(),
        'totalResources': Resource.objects.count(),
    }

    serializer = AdminSummarySerializer(summary)
    return Response({'success': True, 'data': serializer.data})


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_audit_logs(request):
    queryset = _audit_log_queryset(request)
    page_size = min(int(request.query_params.get('page_size', 100)), 500)
    logs = queryset[:page_size]

    return Response({'success': True, 'data': _serialize_audit_logs(logs)})


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_audit_logs_export(request):
    queryset = _audit_log_queryset(request)
    export_format = (request.query_params.get('format') or 'json').lower()
    logs = _serialize_audit_logs(queryset[:5000])

    if export_format == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="admin-audit-logs.csv"'
        writer = csv.writer(response)
        writer.writerow(['id', 'actor', 'action', 'targetType', 'targetId', 'payloadDiff', 'createdAt'])
        for row in logs:
            writer.writerow([
                row['id'],
                row['actor'] or '',
                row['action'],
                row['targetType'],
                row['targetId'],
                json.dumps(row['payloadDiff'], ensure_ascii=False),
                row['createdAt'],
            ])
        return response

    response = HttpResponse(content_type='application/json')
    response['Content-Disposition'] = 'attachment; filename="admin-audit-logs.json"'
    response.write(json.dumps(logs, ensure_ascii=False, default=str))
    return response
