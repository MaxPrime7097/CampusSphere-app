from django.contrib import admin
from django.apps import apps


def safe_register(model_ref):
    if isinstance(model_ref, str):
        try:
            model = apps.get_model('posts', model_ref)
        except LookupError:
            return
    else:
        model = model_ref

    if model is None:
        return

    try:
        admin.site.register(model)
    except admin.sites.AlreadyRegistered:
        pass


try:
    from .models import Post, PostLike, PostSave, PostReport, Comment, CommentLike
    _post_models = (Post, PostLike, PostSave, PostReport, Comment, CommentLike)
except Exception:
    _post_models = ("Post", "PostLike", "PostSave", "PostReport", "Comment", "CommentLike")

for _model in _post_models:
    safe_register(_model)
