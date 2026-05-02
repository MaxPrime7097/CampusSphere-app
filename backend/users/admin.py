from django.contrib import admin
from django.utils.html import format_html
from .models import User, AdminAuditLog


@admin.register(AdminAuditLog)
class AdminAuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'action', 'target_type', 'target_id', 'actor')
    list_filter = ('action', 'target_type', 'created_at')
    search_fields = ('target_id', 'target_type', 'actor__username', 'actor__email')
    readonly_fields = ('created_at',)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'student_id', 'is_verified', 'view_card_image')
    list_filter = ('is_verified', 'is_staff', 'university')
    search_fields = ('username', 'email', 'student_id')
    actions = ['verify_users', 'unverify_users']

    def view_card_image(self, obj):
        if obj.card_image:
            return format_html('<a href="{}" target="_blank"><img src="{}" style="height: 50px;"/></a>', obj.card_image.url, obj.card_image.url)
        return "Pas de carte"
    view_card_image.short_description = 'Carte Étudiant'

    def verify_users(self, request, queryset):
        queryset.update(is_verified=True)
    verify_users.short_description = "Certifier les utilisateurs sélectionnés"

    def unverify_users(self, request, queryset):
        queryset.update(is_verified=False)
    unverify_users.short_description = "Révoquer la certification"
