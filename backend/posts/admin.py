from django.contrib import admin
from .models import Post, PostLike, PostSave, PostReport, Comment, CommentLike

admin.site.register(Post)
admin.site.register(PostLike)
admin.site.register(PostSave)
admin.site.register(PostReport)
admin.site.register(Comment)
admin.site.register(CommentLike)
