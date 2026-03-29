from django.contrib import admin
from django.apps import apps


def safe_register(model_name: str):
    try:
        model = apps.get_model('posts', model_name)
    except LookupError:
        return
    try:
        admin.site.register(model)
    except admin.sites.AlreadyRegistered:
        pass


for _model_name in ("Post", "PostLike", "PostSave", "PostReport", "Comment", "CommentLike"):
    safe_register(_model_name)
