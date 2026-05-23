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

    tool_types = models.JSONField(default=list)  # Liste de strings : ["fiche", "quiz", "flashcards"]
    content = models.JSONField(default=dict)  # Dictionnaire avec les contenus par outil

    # V2 — Texte extrait du PDF (pour le Q&A)
    extracted_text = models.TextField(blank=True, default="")

    # V2 — Historique Q&A
    qa_history = models.JSONField(default=list)
    # Format : [{"question": "...", "answer": "...", "created_at": "..."}]

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
        tools = ", ".join(self.tool_types)
        return f"{self.owner.username} — [{tools}] — {resource_name}"


class AnnaleSession(models.Model):
    """Correction d'épreuve passée (annale) — Sphera V2."""

    MODE_CHOICES = [
        ("complete", "Correction complète"),
        ("rapide", "Correction rapide"),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="annale_sessions",
    )
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default="complete")

    # Source de l'annale
    source_filename = models.CharField(max_length=255, blank=True)
    resource = models.ForeignKey(
        "resources.Resource",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="annale_sessions",
        help_text="Ressource utilisée comme annale (si depuis une ressource existante)",
    )

    # Cours de référence optionnel
    cours_resource = models.ForeignKey(
        "resources.Resource",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="annale_sessions_as_cours",
        help_text="Cours utilisé pour le croisement annale+cours",
    )

    content = models.JSONField(default=dict)  # JSON de correction généré par l'IA

    # Partage
    is_shared = models.BooleanField(default=False)
    shared_in_sphere = models.ForeignKey(
        "spheres.Sphere",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="shared_annale_sessions",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Session d'annale"
        verbose_name_plural = "Sessions d'annale"

    def __str__(self):
        source = self.source_filename or (self.resource.title if self.resource else "Sans titre")
        return f"{self.owner.username} — [{self.mode}] — {source}"
