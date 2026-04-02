from django.contrib import admin

from .models import AdminAuditLog


@admin.register(AdminAuditLog)
class AdminAuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'action', 'target_type', 'target_id', 'actor')
    list_filter = ('action', 'target_type', 'created_at')
    search_fields = ('target_id', 'target_type', 'actor__username', 'actor__email')
    readonly_fields = ('created_at',)
