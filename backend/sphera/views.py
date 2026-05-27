import logging
import os
import tempfile
from datetime import datetime, timezone

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from resources.models import Resource
from spheres.models import Sphere
from .ai_service import extract_text_from_file, generate_with_fallback, generate_qa_answer, generate_annale
from .models import StudySession, AnnaleSession
from .serializers import (
    StudySessionSerializer,
    StudySessionListSerializer,
    AnnaleSessionSerializer,
    AnnaleSessionListSerializer,
)

logger = logging.getLogger(__name__)

VALID_TOOL_TYPES = {"fiche", "quiz", "flashcards"}


def _extract_file_to_tempfile(file_field, prefix="campussphere_") -> tuple[str, str]:
    """
    Copie un FileField Django dans un fichier temporaire.
    Retourne (tmp_path, extension).
    """
    ext = os.path.splitext(file_field.name)[1].lower()
    tmp_path = None
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext, prefix=prefix) as tmp:
        with file_field.open("rb") as f:
            for chunk in f.chunks():
                tmp.write(chunk)
        tmp_path = tmp.name
    return tmp_path, ext


def _extract_uploaded_file(uploaded_file, prefix="campussphere_") -> tuple[str, str]:
    """
    Copie un InMemoryUploadedFile dans un fichier temporaire.
    Retourne (tmp_path, extension).
    """
    filename = uploaded_file.name or ""
    ext = os.path.splitext(filename)[1].lower()
    tmp_path = None
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext, prefix=prefix) as tmp:
        for chunk in uploaded_file.chunks():
            tmp.write(chunk)
        tmp_path = tmp.name
    return tmp_path, ext


def _cleanup(path: str):
    if path and os.path.exists(path):
        try:
            os.unlink(path)
        except OSError:
            pass


# ===========================================================================
# V1 — Génération Fiche / Quiz / Flashcards
# ===========================================================================

class GenerateFromResourceView(APIView):
    """
    POST /api/sphera/generate/from-resource/
    Body: { resource_id, tool_types: ["fiche", "quiz", ...] }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            return self._handle(request)
        except Exception as e:
            import traceback
            logger.error(f"[Sphera] GenerateFromResource unhandled: {traceback.format_exc()}")
            return Response({"error": f"Erreur interne : {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _handle(self, request):
        resource_id = request.data.get("resource_id")

        # Parse tool_types (JSON string ou liste)
        if hasattr(request.data, "getlist"):
            raw = request.data.getlist("tool_types")
            if len(raw) == 1:
                raw = raw[0]
        else:
            raw = request.data.get("tool_types")

        tool_types = []
        if isinstance(raw, str):
            try:
                import json
                parsed = json.loads(raw)
                tool_types = parsed if isinstance(parsed, list) else [parsed]
            except Exception:
                tool_types = [t.strip() for t in raw.split(",") if t.strip()]
        elif isinstance(raw, list):
            tool_types = raw

        if not resource_id:
            return Response({"error": "resource_id est requis."}, status=status.HTTP_400_BAD_REQUEST)
        if not tool_types:
            return Response({"error": "tool_types doit être une liste non vide."}, status=status.HTTP_400_BAD_REQUEST)
        for t in tool_types:
            if t not in VALID_TOOL_TYPES:
                return Response(
                    {"error": f"Type d'outil invalide : '{t}'. Choisis parmi : {', '.join(VALID_TOOL_TYPES)}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            resource = Resource.objects.get(pk=resource_id)
        except Resource.DoesNotExist:
            return Response({"error": "Ressource introuvable."}, status=status.HTTP_404_NOT_FOUND)

        # Cache : session déjà générée ?
        existing = StudySession.objects.filter(
            owner=request.user,
            resource=resource,
            tool_types=tool_types,
        ).first()
        if existing:
            return Response(
                {"success": True, "data": StudySessionSerializer(existing).data, "cached": True},
                status=status.HTTP_200_OK,
            )

        if not resource.file:
            return Response({"error": "Cette ressource n'a pas de fichier associé."}, status=status.HTTP_400_BAD_REQUEST)

        tmp_path = None
        try:
            tmp_path, _ = _extract_file_to_tempfile(resource.file, prefix="sphera_resource_")
            try:
                text = extract_text_from_file(tmp_path)
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except ImportError as e:
                return Response({"error": "Extraction non disponible (dépendance manquante)."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        finally:
            _cleanup(tmp_path)

        if not text or len(text) < 50:
            return Response(
                {"error": "Ce document ne contient pas de texte extractible."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content = {}
        try:
            for t in tool_types:
                content[t] = generate_with_fallback(text, t)
        except Exception as e:
            logger.error(f"[Sphera] Génération IA échouée : {e}")
            return Response({"error": f"La génération IA a échoué : {e}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        session = StudySession.objects.create(
            owner=request.user,
            resource=resource,
            tool_types=tool_types,
            content=content,
            extracted_text=text,  # Stocké pour le Q&A V2
        )

        return Response(
            {"success": True, "data": StudySessionSerializer(session).data, "cached": False},
            status=status.HTTP_201_CREATED,
        )


class GenerateFromUploadView(APIView):
    """
    POST /api/sphera/generate/from-upload/
    Form-data: { file, tool_types (JSON string list) }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            return self._handle(request)
        except Exception as e:
            import traceback
            logger.error(f"[Sphera] GenerateFromUpload unhandled: {traceback.format_exc()}")
            return Response({"error": f"Erreur interne : {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _handle(self, request):
        uploaded_file = request.FILES.get("file")

        if hasattr(request.data, "getlist"):
            raw = request.data.getlist("tool_types")
            if len(raw) == 1:
                raw = raw[0]
        else:
            raw = request.data.get("tool_types")

        tool_types = []
        if isinstance(raw, str):
            try:
                import json
                parsed = json.loads(raw)
                tool_types = parsed if isinstance(parsed, list) else [parsed]
            except Exception:
                tool_types = [t.strip() for t in raw.split(",") if t.strip()]
        elif isinstance(raw, list):
            tool_types = raw

        if not uploaded_file:
            return Response({"error": "Un fichier est requis."}, status=status.HTTP_400_BAD_REQUEST)
        if not tool_types:
            return Response({"error": "tool_types doit être une liste non vide."}, status=status.HTTP_400_BAD_REQUEST)
        for t in tool_types:
            if t not in VALID_TOOL_TYPES:
                return Response(
                    {"error": f"Type d'outil invalide : '{t}'."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        filename = uploaded_file.name or ""
        if not any(filename.lower().endswith(ext) for ext in (".pdf", ".docx", ".txt")):
            return Response({"error": "Seuls les fichiers PDF, DOCX et TXT sont acceptés."}, status=status.HTTP_400_BAD_REQUEST)

        # Création d'une ressource implicite pour conserver le fichier et son aperçu
        from resources.models import Resource
        resource = Resource.objects.create(
            title=filename,
            author=request.user,
            file=uploaded_file,
            file_size=uploaded_file.size,
            file_type=uploaded_file.content_type or "application/octet-stream",
            type="cours",  # Type par défaut
            visibility="friends"
        )

        tmp_path = None
        text = ""
        try:
            tmp_path, _ = _extract_uploaded_file(uploaded_file, prefix="sphera_upload_")
            try:
                text = extract_text_from_file(tmp_path)
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except ImportError:
                return Response({"error": "Extraction non disponible."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            if not text or len(text) < 50:
                return Response({"error": "Ce document ne contient pas de texte extractible."}, status=status.HTTP_400_BAD_REQUEST)

            content = {}
            try:
                for t in tool_types:
                    content[t] = generate_with_fallback(text, t)
            except Exception as e:
                logger.error(f"[Sphera] Génération IA échouée : {e}")
                return Response({"error": f"La génération IA a échoué : {e}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        finally:
            _cleanup(tmp_path)

        session = StudySession.objects.create(
            owner=request.user,
            resource=resource, # Liaison avec la ressource créée
            source_filename=filename,
            tool_types=tool_types,
            content=content,
            extracted_text=text,  # Stocké pour le Q&A V2
        )

        return Response(
            {"success": True, "data": StudySessionSerializer(session).data},
            status=status.HTTP_201_CREATED,
        )


class StudySessionListView(APIView):
    """GET /api/sphera/sessions/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        tool_type = request.query_params.get("tool_type")
        sessions = StudySession.objects.filter(owner=request.user)
        if tool_type and tool_type in VALID_TOOL_TYPES:
            sessions = sessions.filter(tool_types__contains=[tool_type])
        return Response({"success": True, "data": StudySessionListSerializer(sessions, many=True).data})


class StudySessionDetailView(APIView):
    """GET / DELETE /api/sphera/sessions/<pk>/"""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            session = StudySession.objects.get(pk=pk)
            if session.owner != request.user and not session.is_shared:
                return Response({"error": "Non autorisé."}, status=status.HTTP_403_FORBIDDEN)
        except StudySession.DoesNotExist:
            return Response({"error": "Session introuvable."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"success": True, "data": StudySessionSerializer(session).data})

    def delete(self, request, pk):
        try:
            session = StudySession.objects.get(pk=pk, owner=request.user)
        except StudySession.DoesNotExist:
            return Response({"error": "Session introuvable."}, status=status.HTTP_404_NOT_FOUND)
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AddToolToSessionView(APIView):
    """
    PATCH /api/sphera/sessions/<pk>/add-tool/
    Body: { "tool_type": "quiz" }
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        tool_type = request.data.get("tool_type")

        if not tool_type or tool_type not in VALID_TOOL_TYPES:
            return Response({"error": f"Type d'outil invalide. Choisis parmi : {', '.join(VALID_TOOL_TYPES)}."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = StudySession.objects.get(pk=pk, owner=request.user)
        except StudySession.DoesNotExist:
            return Response({"error": "Session introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if tool_type in session.tool_types and tool_type in session.content:
            return Response({"error": f"L'outil '{tool_type}' a déjà été généré pour cette session."}, status=status.HTTP_400_BAD_REQUEST)

        text = session.extracted_text
        if not text:
            return Response({"error": "Aucun texte extractible disponible dans cette session pour générer de nouveaux outils."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            generated_tool_content = generate_with_fallback(text, tool_type)
        except Exception as e:
            logger.error(f"[Sphera] Génération additionnelle IA échouée : {e}")
            return Response({"error": f"La génération IA a échoué : {e}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Update session (re-assignment required for Django JSONField modification detection)
        new_content_dict = dict(session.content)
        new_content_dict[tool_type] = generated_tool_content
        session.content = new_content_dict
        
        if tool_type not in session.tool_types:
            new_types = list(session.tool_types)
            new_types.append(tool_type)
            session.tool_types = new_types
            
        session.save()

        return Response({"success": True, "data": StudySessionSerializer(session).data}, status=status.HTTP_200_OK)


class ShareStudySessionView(APIView):
    """POST / DELETE /api/sphera/sessions/<pk>/share/"""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            session = StudySession.objects.get(pk=pk, owner=request.user)
            
            sphere_id = request.data.get("sphere_id")
            if not sphere_id:
                # Partage global par lien
                session.is_shared = True
                session.save(update_fields=["is_shared"])
                return Response({"success": True, "message": "Partage par lien activé.", "data": StudySessionSerializer(session).data})

            sphere = Sphere.objects.get(pk=sphere_id)

            is_member = sphere.memberships.filter(user=request.user, status="active").exists()
            if not is_member and sphere.created_by != request.user:
                return Response({"error": "Tu dois être membre de cette sphère."}, status=status.HTTP_403_FORBIDDEN)

            session.is_shared = True
            session.shared_in_sphere = sphere
            session.save(update_fields=["is_shared", "shared_in_sphere"])

            return Response({"success": True, "data": StudySessionSerializer(session).data})
        except StudySession.DoesNotExist:
            return Response({"error": "Session introuvable."}, status=status.HTTP_404_NOT_FOUND)
        except Sphere.DoesNotExist:
            return Response({"error": "Sphère introuvable."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            logger.error(f"[Sphera] Share session error: {traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        try:
            session = StudySession.objects.get(pk=pk, owner=request.user)
        except StudySession.DoesNotExist:
            return Response({"error": "Session introuvable."}, status=status.HTTP_404_NOT_FOUND)
        session.is_shared = False
        session.shared_in_sphere = None
        session.save(update_fields=["is_shared", "shared_in_sphere"])
        return Response({"success": True, "message": "Partage annulé."})


class SphereStudySessionsView(APIView):
    """GET /api/sphera/sphere/<sphere_id>/"""

    permission_classes = [IsAuthenticated]

    def get(self, request, sphere_id):
        try:
            sphere = Sphere.objects.get(pk=sphere_id)
        except Sphere.DoesNotExist:
            return Response({"error": "Sphère introuvable."}, status=status.HTTP_404_NOT_FOUND)

        is_member = sphere.memberships.filter(user=request.user, status="active").exists()
        if not is_member and sphere.created_by != request.user:
            return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        sessions = StudySession.objects.filter(
            shared_in_sphere=sphere,
            is_shared=True,
        ).select_related("owner", "resource")

        return Response({"success": True, "data": StudySessionListSerializer(sessions, many=True).data})


# ===========================================================================
# V2 — Q&A sur le cours
# ===========================================================================

class AskQuestionView(APIView):
    """
    POST /api/sphera/sessions/<pk>/ask/
    Body: { "question": "..." }
    Response: { "question": "...", "answer": "...", "created_at": "..." }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            session = StudySession.objects.get(pk=pk, owner=request.user)
        except StudySession.DoesNotExist:
            return Response({"error": "Session introuvable."}, status=status.HTTP_404_NOT_FOUND)

        question = (request.data.get("question") or "").strip()
        if not question:
            return Response({"error": "La question ne peut pas être vide."}, status=status.HTTP_400_BAD_REQUEST)

        if not session.extracted_text:
            return Response(
                {"error": "Le texte de ce cours n'est pas disponible pour le Q&A. Régénère la session depuis la ressource originale."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            answer = generate_qa_answer(session.extracted_text, question)
        except Exception as e:
            logger.error(f"[Sphera Q&A] Erreur génération : {e}")
            return Response({"error": f"La génération IA a échoué : {e}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Sauvegarder dans l'historique
        entry = {
            "question": question,
            "answer": answer,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        qa_history = list(session.qa_history or [])
        qa_history.append(entry)
        session.qa_history = qa_history
        session.save(update_fields=["qa_history"])

        return Response({"success": True, "data": entry}, status=status.HTTP_200_OK)


# ===========================================================================
# V2 — Annales
# ===========================================================================

class AskAnnaleQuestionView(APIView):
    """
    POST /api/sphera/annales/<pk>/ask/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            session = AnnaleSession.objects.get(pk=pk)
            if session.owner != request.user and not session.is_shared:
                return Response({"error": "Non autorisé."}, status=status.HTTP_403_FORBIDDEN)
        except AnnaleSession.DoesNotExist:
            return Response({"error": "Annale introuvable."}, status=status.HTTP_404_NOT_FOUND)

        question = (request.data.get("question") or "").strip()
        if not question:
            return Response({"error": "La question ne peut pas être vide."}, status=status.HTTP_400_BAD_REQUEST)

        if not session.extracted_text:
            return Response(
                {"error": "Le texte de ce document n'est pas disponible pour le Q&A."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            answer = generate_qa_answer(session.extracted_text, question)
        except Exception as e:
            logger.error(f"[Sphera Q&A Annale] Erreur génération : {e}")
            return Response({"error": f"La génération IA a échoué : {e}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        entry = {
            "question": question,
            "answer": answer,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        qa_history = list(session.qa_history or [])
        qa_history.append(entry)
        session.qa_history = qa_history
        session.save(update_fields=["qa_history"])

        return Response({"success": True, "data": entry}, status=status.HTTP_200_OK)

class GenerateAnnaleView(APIView):
    """
    POST /api/sphera/generate/annale/
    Accepte multipart/form-data ou JSON.
    Body: {
      file: <PDF upload>          # OU resource_id
      resource_id: "...",
      mode: "complete" | "rapide",
      cours_resource_id: "..."    # Optionnel
    }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            return self._handle(request)
        except Exception as e:
            import traceback
            logger.error(f"[Sphera] GenerateAnnale unhandled: {traceback.format_exc()}")
            return Response({"error": f"Erreur interne : {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _handle(self, request):
        mode = request.data.get("mode", "complete")
        if mode not in ("complete", "rapide"):
            return Response({"error": "mode doit être 'complete' ou 'rapide'."}, status=status.HTTP_400_BAD_REQUEST)

        resource_id = request.data.get("resource_id")
        cours_resource_id = request.data.get("cours_resource_id")
        uploaded_file = request.FILES.get("file")

        annale_resource = None
        cours_resource = None
        source_filename = ""

        # --- Extraire le texte de l'annale ---
        annale_text = ""
        tmp_annale = None
        try:
            if resource_id:
                # Depuis une ressource existante
                try:
                    annale_resource = Resource.objects.get(pk=resource_id)
                except Resource.DoesNotExist:
                    return Response({"error": "Ressource d'annale introuvable."}, status=status.HTTP_404_NOT_FOUND)
                if not annale_resource.file:
                    return Response({"error": "Cette ressource n'a pas de fichier."}, status=status.HTTP_400_BAD_REQUEST)
                tmp_annale, _ = _extract_file_to_tempfile(annale_resource.file, prefix="sphera_annale_")
                source_filename = annale_resource.title
            elif uploaded_file:
                # Upload direct
                filename = uploaded_file.name or ""
                if not any(filename.lower().endswith(ext) for ext in (".pdf", ".docx", ".txt")):
                    return Response({"error": "Seuls les fichiers PDF, DOCX et TXT sont acceptés."}, status=status.HTTP_400_BAD_REQUEST)
                tmp_annale, _ = _extract_uploaded_file(uploaded_file, prefix="sphera_annale_")
                source_filename = filename
            else:
                return Response({"error": "Un fichier ou resource_id est requis."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                annale_text = extract_text_from_file(tmp_annale)
            except (ValueError, ImportError) as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        finally:
            _cleanup(tmp_annale)

        if not annale_text or len(annale_text) < 50:
            return Response({"error": "L'annale ne contient pas de texte extractible."}, status=status.HTTP_400_BAD_REQUEST)

        # --- Extraire le texte du cours (optionnel) ---
        cours_text = ""
        tmp_cours = None
        if cours_resource_id:
            try:
                cours_resource = Resource.objects.get(pk=cours_resource_id)
            except Resource.DoesNotExist:
                return Response({"error": "Ressource cours introuvable."}, status=status.HTTP_404_NOT_FOUND)
            if cours_resource.file:
                try:
                    tmp_cours, _ = _extract_file_to_tempfile(cours_resource.file, prefix="sphera_cours_")
                    cours_text = extract_text_from_file(tmp_cours)
                except Exception as e:
                    logger.warning(f"[Sphera] Impossible d'extraire le cours : {e}")
                finally:
                    _cleanup(tmp_cours)

        # --- Générer la correction ---
        try:
            content = generate_annale(annale_text, mode, cours_text or None)
        except Exception as e:
            logger.error(f"[Sphera] Génération annale échouée : {e}")
            return Response({"error": f"La génération IA a échoué : {e}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # --- Sauvegarder la session ---
        annale_session = AnnaleSession.objects.create(
            owner=request.user,
            mode=mode,
            source_filename=source_filename,
            resource=annale_resource,
            cours_resource=cours_resource,
            content=content,
        )

        return Response(
            {"success": True, "data": AnnaleSessionSerializer(annale_session).data},
            status=status.HTTP_201_CREATED,
        )


class AnnaleSessionListView(APIView):
    """GET /api/sphera/annales/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        annales = AnnaleSession.objects.filter(owner=request.user)
        return Response({"success": True, "data": AnnaleSessionListSerializer(annales, many=True).data})


class AnnaleSessionDetailView(APIView):
    """GET / DELETE /api/sphera/annales/<pk>/"""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            annale = AnnaleSession.objects.get(pk=pk)
            if annale.owner != request.user and not annale.is_shared:
                return Response({"error": "Non autorisé."}, status=status.HTTP_403_FORBIDDEN)
        except AnnaleSession.DoesNotExist:
            return Response({"error": "Annale introuvable."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"success": True, "data": AnnaleSessionSerializer(annale).data})

    def delete(self, request, pk):
        try:
            annale = AnnaleSession.objects.get(pk=pk, owner=request.user)
        except AnnaleSession.DoesNotExist:
            return Response({"error": "Annale introuvable."}, status=status.HTTP_404_NOT_FOUND)
        annale.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ShareAnnaleSessionView(APIView):
    """POST / DELETE /api/sphera/annales/<pk>/share/"""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            annale = AnnaleSession.objects.get(pk=pk, owner=request.user)
            
            sphere_id = request.data.get("sphere_id")
            if not sphere_id:
                # Partage global par lien
                annale.is_shared = True
                annale.save(update_fields=["is_shared"])
                return Response({"success": True, "message": "Partage par lien activé.", "data": AnnaleSessionSerializer(annale).data})
                
            sphere = Sphere.objects.get(pk=sphere_id)

            is_member = sphere.memberships.filter(user=request.user, status="active").exists()
            if not is_member and sphere.created_by != request.user:
                return Response({"error": "Tu dois être membre de cette sphère."}, status=status.HTTP_403_FORBIDDEN)

            annale.is_shared = True
            annale.shared_in_sphere = sphere
            annale.save(update_fields=["is_shared", "shared_in_sphere"])

            return Response({"success": True, "data": AnnaleSessionSerializer(annale).data})
        except AnnaleSession.DoesNotExist:
            return Response({"error": "Annale introuvable."}, status=status.HTTP_404_NOT_FOUND)
        except Sphere.DoesNotExist:
            return Response({"error": "Sphère introuvable."}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            annale = AnnaleSession.objects.get(pk=pk, owner=request.user)
        except AnnaleSession.DoesNotExist:
            return Response({"error": "Annale introuvable."}, status=status.HTTP_404_NOT_FOUND)
        annale.is_shared = False
        annale.shared_in_sphere = None
        annale.save(update_fields=["is_shared", "shared_in_sphere"])
        return Response({"success": True, "message": "Partage annulé."})


class SphereAnnaleSessionsView(APIView):
    """GET /api/sphera/sphere/<sphere_id>/annales/"""

    permission_classes = [IsAuthenticated]

    def get(self, request, sphere_id):
        try:
            sphere = Sphere.objects.get(pk=sphere_id)
        except Sphere.DoesNotExist:
            return Response({"error": "Sphère introuvable."}, status=status.HTTP_404_NOT_FOUND)

        is_member = sphere.memberships.filter(user=request.user, status="active").exists()
        if not is_member and sphere.created_by != request.user:
            return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        annales = AnnaleSession.objects.filter(shared_in_sphere=sphere, is_shared=True).select_related("owner", "resource")
        return Response({"success": True, "data": AnnaleSessionListSerializer(annales, many=True).data})


# ===========================================================================
# Guest — Génération sans auth (mode invité)
# ===========================================================================

class GuestRateThrottle(AnonRateThrottle):
    """
    Limite les invités à 5 générations par heure par IP.
    Utilise le cache Django (Redis en prod, LocMemCache en dev).
    """
    scope = "guest_generate"
    rate = "5/hour"


class GuestGenerateView(APIView):
    """
    POST /api/sphera/guest/generate/
    Accessible sans authentification. Génère un outil Sphera sans sauvegarder en base.
    Rate limité à 5 requêtes/heure par IP.

    Form-data:
      file          — PDF, DOCX ou TXT
      tool_type     — "fiche" | "quiz" | "flashcards" | "annale"
      mode          — "complete" | "rapide"  (pour annale uniquement, optionnel)
    """
    permission_classes = []
    throttle_classes = [GuestRateThrottle]

    def post(self, request):
        try:
            return self._handle(request)
        except Exception as e:
            import traceback
            logger.error(f"[Sphera Guest] Erreur : {traceback.format_exc()}")
            return Response({"error": f"Erreur interne : {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _handle(self, request):
        uploaded_file = request.FILES.get("file")
        tool_type = (request.data.get("tool_type") or "").strip().lower()
        mode = (request.data.get("mode") or "complete").strip().lower()

        # Validation
        if not uploaded_file:
            return Response({"error": "Un fichier est requis."}, status=status.HTTP_400_BAD_REQUEST)

        VALID_GUEST_TOOLS = {"fiche", "quiz", "flashcards", "annale"}
        if tool_type not in VALID_GUEST_TOOLS:
            return Response(
                {"error": f"tool_type invalide. Choisis parmi : {', '.join(VALID_GUEST_TOOLS)}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if mode not in ("complete", "rapide"):
            mode = "complete"

        filename = uploaded_file.name or ""
        if not any(filename.lower().endswith(ext) for ext in (".pdf", ".docx", ".txt")):
            return Response({"error": "Seuls les fichiers PDF, DOCX et TXT sont acceptés."}, status=status.HTTP_400_BAD_REQUEST)

        # Extraction du texte
        tmp_path = None
        try:
            tmp_path, _ = _extract_uploaded_file(uploaded_file, prefix="sphera_guest_")
            try:
                text = extract_text_from_file(tmp_path)
            except (ValueError, ImportError) as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        finally:
            _cleanup(tmp_path)

        if not text or len(text) < 50:
            return Response({"error": "Ce document ne contient pas de texte extractible."}, status=status.HTTP_400_BAD_REQUEST)

        # Génération IA (sans sauvegarde)
        try:
            if tool_type == "annale":
                content = generate_annale(text, mode)
                return Response({
                    "success": True,
                    "tool_type": "annale",
                    "mode": mode,
                    "content": content,
                })
            else:
                content = generate_with_fallback(text, tool_type)
                return Response({
                    "success": True,
                    "tool_type": tool_type,
                    "content": content,
                })
        except Exception as e:
            logger.error(f"[Sphera Guest] Génération échouée : {e}")
            return Response({"error": f"La génération IA a échoué : {e}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
