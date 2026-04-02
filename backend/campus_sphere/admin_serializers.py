from rest_framework import serializers


class AdminUserMiniSerializer(serializers.Serializer):
    name = serializers.CharField()
    avatar = serializers.CharField(allow_null=True)


class AdminModerationQueueItemSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    type = serializers.CharField()
    subject = serializers.CharField()
    size = serializers.CharField()
    uploadDate = serializers.DateTimeField(allow_null=True)
    uploader = AdminUserMiniSerializer()


class AdminReportedContentItemSerializer(serializers.Serializer):
    id = serializers.CharField()
    type = serializers.CharField()
    content = serializers.CharField()
    reason = serializers.CharField()
    date = serializers.DateTimeField(allow_null=True)
    status = serializers.CharField()
    reporter = AdminUserMiniSerializer()


class AdminSummarySerializer(serializers.Serializer):
    totalUsers = serializers.IntegerField()
    newUsersToday = serializers.IntegerField()
    pendingResources = serializers.IntegerField()
    reportedContent = serializers.IntegerField()
    activeGroups = serializers.IntegerField()
    totalResources = serializers.IntegerField()


class AdminAuditLogSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    actor = serializers.CharField(allow_null=True)
    action = serializers.CharField()
    targetType = serializers.CharField()
    targetId = serializers.CharField()
    payloadDiff = serializers.JSONField()
    createdAt = serializers.DateTimeField()
