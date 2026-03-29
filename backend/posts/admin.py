from django.contrib import admin
from . import models


def safe_register(model_name: str):
    model = getattr(models, model_name, None)
    if model is None:
        return
    try:
        admin.site.register(model)
    except admin.sites.AlreadyRegistered:
        pass


for _model_name in ("Post", "PostLike", "PostSave", "PostReport", "Comment", "CommentLike"):
    safe_register(_model_name)
