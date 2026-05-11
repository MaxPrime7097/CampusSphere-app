from django.db import models
from django.conf import settings


class StudySession(models.Model):
    TOOL_TYPES = [
        ("fiche", "Fiche de révision"),
        ("quiz", "Quiz interactif"),
        ("flashcards", "Flashcards"),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="study_sessions",
    )

    # Source : soit ressource existante, soit upload direct
    resource = models.ForeignKey(
        "resources.Resource",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="study_sessions",
    )
    source_filename = models.CharField(max_length=255, blank=True)  # Pour upload direct

    tool_type = models.CharField(max_length=20, choices=TOOL_TYPES)
    content = models.JSONField()  # Le contenu généré par l'IA

    # Partage
    is_shared = models.BooleanField(default=False)
    shared_in_sphere = models.ForeignKey(
        "spheres.Sphere",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="shared_study_sessions",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Session de révision"
        verbose_name_plural = "Sessions de révision"

    def __str__(self):
        resource_name = self.resource.title if self.resource else self.source_filename
        return f"{self.owner.username} — {self.tool_type} — {resource_name}"
