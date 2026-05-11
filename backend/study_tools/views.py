import logging
import os
import tempfile

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from resources.models import Resource
from spheres.models import Sphere
from .ai_service import extract_text_from_file, generate_with_fallback
from .models import StudySession
from .serializers import StudySessionSerializer, StudySessionListSerializer

logger = logging.getLogger(__name__)

VALID_TOOL_TYPES = {"fiche", "quiz", "flashcards"}


class GenerateFromResourceView(APIView):
    """
    POST /api/study/generate/from-resource/
    Body: { resource_id, tool_types: ["fiche", "quiz", ...] }

    Si une session existe déjà pour ce (owner, resource, tool_types), la retourne
    directement sans rappeler l'IA.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            return self._handle_post(request)
        except Exception as e:
            import traceback
            logger.error(f"UNHANDLED EXCEPTION in GenerateFromResourceView: {traceback.format_exc()}")
            return Response({"error": f"Erreur interne du serveur: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _handle_post(self, request):
        resource_id = request.data.get("resource_id")
        
        # In DRF, request.data can be a QueryDict
        if hasattr(request.data, "getlist"):
            tool_types_raw = request.data.getlist("tool_types")
            # If it's a list with one item, try parsing it as JSON
            if len(tool_types_raw) == 1:
                tool_types_raw = tool_types_raw[0]
        else:
            tool_types_raw = request.data.get("tool_types")

        tool_types = []
        if isinstance(tool_types_raw, str):
            try:
                import json
                parsed = json.loads(tool_types_raw)
                if isinstance(parsed, list):
                    tool_types = parsed
                else:
                    tool_types = [parsed]
            except Exception:
                tool_types = [t.strip() for t in tool_types_raw.split(",") if t.strip()]
        elif isinstance(tool_types_raw, list):
            tool_types = tool_types_raw

        # --- Validation ---
        if not resource_id:
            return Response(
                {"error": "resource_id est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not tool_types or not isinstance(tool_types, list):
            return Response(
                {"error": "tool_types doit être une liste non vide."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        for t in tool_types:
            if t not in VALID_TOOL_TYPES:
                return Response(
                    {"error": f"Le type d'outil '{t}' n'est pas valide. Choisis parmi : {', '.join(VALID_TOOL_TYPES)}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # --- Récupérer la ressource ---
        try:
            resource = Resource.objects.get(pk=resource_id)
        except Resource.DoesNotExist:
            return Response(
                {"error": "Ressource introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # --- Vérifier si session déjà générée ---
        existing = StudySession.objects.filter(
            owner=request.user,
            resource=resource,
            tool_types=tool_types,
        ).first()
        if existing:
            serializer = StudySessionSerializer(existing)
            return Response(
                {"success": True, "data": serializer.data, "cached": True},
                status=status.HTTP_200_OK,
            )

        # --- Vérifier que c'est un PDF ---
        file_path = resource.file.path if resource.file else None
        if not file_path or not os.path.exists(file_path):
            return Response(
                {"error": "Le fichier de la ressource est introuvable sur le serveur."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Extraire le texte ---
        try:
            text = extract_text_from_file(file_path)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ImportError as e:
            logger.error(f"[StudyTools] Dépendance manquante pour l'extraction : {e}")
            return Response(
                {"error": "Extraction non disponible sur ce serveur (dépendance manquante)."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if not text or len(text) < 50:
            return Response(
                {
                    "error": (
                        "Ce document ne contient pas de texte extractible. "
                        "Essaie avec un document numérique contenant du vrai texte."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Générer avec l'IA ---
        content = {}
        try:
            for t in tool_types:
                content[t] = generate_with_fallback(text, t)
        except Exception as e:
            logger.error(f"[StudyTools] Génération IA échouée : {e}")
            return Response(
                {"error": f"La génération IA a échoué : {e}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # --- Sauvegarder la session ---
        session = StudySession.objects.create(
            owner=request.user,
            resource=resource,
            tool_types=tool_types,
            content=content,
        )

        serializer = StudySessionSerializer(session)
        return Response(
            {"success": True, "data": serializer.data, "cached": False},
            status=status.HTTP_201_CREATED,
        )


class GenerateFromUploadView(APIView):
    """
    POST /api/study/generate/from-upload/
    Form-data: { file, tool_types (JSON string list) }

    Le fichier est temporaire — extrait, généré, supprimé.
    La session est quand même sauvegardée avec source_filename.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            return self._handle_post(request)
        except Exception as e:
            import traceback
            logger.error(f"UNHANDLED EXCEPTION in GenerateFromUploadView: {traceback.format_exc()}")
            return Response({"error": f"Erreur interne du serveur: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _handle_post(self, request):
        uploaded_file = request.FILES.get("file")
        
        # Parse tool_types from Form-data
        if hasattr(request.data, "getlist"):
            tool_types_raw = request.data.getlist("tool_types")
            if len(tool_types_raw) == 1:
                tool_types_raw = tool_types_raw[0]
        else:
            tool_types_raw = request.data.get("tool_types")

        tool_types = []
        if isinstance(tool_types_raw, str):
            try:
                import json
                parsed = json.loads(tool_types_raw)
                if isinstance(parsed, list):
                    tool_types = parsed
                else:
                    tool_types = [parsed]
            except Exception:
                tool_types = [t.strip() for t in tool_types_raw.split(",") if t.strip()]
        elif isinstance(tool_types_raw, list):
            tool_types = tool_types_raw
        elif tool_types_raw:
            tool_types = [str(tool_types_raw)]

        # --- Validation ---
        if not uploaded_file:
            print("ERROR 400: uploaded_file is None")
            return Response(
                {"error": "Un fichier est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not tool_types or not isinstance(tool_types, list):
            print(f"ERROR 400: tool_types invalid. tool_types_raw: {tool_types_raw}, parsed: {tool_types}")
            return Response(
                {"error": "tool_types doit être une liste non vide."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        for t in tool_types:
            if t not in VALID_TOOL_TYPES:
                print(f"ERROR 400: invalid tool_type '{t}'")
                return Response(
                    {"error": f"Le type d'outil '{t}' n'est pas valide. Choisis parmi : {', '.join(VALID_TOOL_TYPES)}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Vérification basique du type MIME et de l'extension
        content_type = uploaded_file.content_type or ""
        filename = uploaded_file.name or ""
        valid_extensions = (".pdf", ".docx", ".txt")
        if not any(filename.lower().endswith(ext) for ext in valid_extensions):
            print(f"ERROR 400: invalid extension. filename: {filename}, content_type: {content_type}")
            return Response(
                {"error": "Seuls les fichiers PDF, DOCX et TXT sont acceptés."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Extraction de l'extension pour le fichier temporaire
        ext = os.path.splitext(filename)[1].lower()

        # --- Écrire dans un fichier temporaire ---
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(
                delete=False, suffix=ext, prefix="campussphere_study_"
            ) as tmp:
                for chunk in uploaded_file.chunks():
                    tmp.write(chunk)
                tmp_path = tmp.name

            # --- Extraire le texte ---
            try:
                text = extract_text_from_file(tmp_path)
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except ImportError as e:
                logger.error(f"[StudyTools] Dépendance manquante : {e}")
                return Response(
                    {"error": "Extraction non disponible sur ce serveur (dépendance manquante)."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            if not text or len(text) < 50:
                return Response(
                    {
                        "error": (
                            "Ce document ne contient pas de texte extractible. "
                            "Essaie avec un document numérique contenant du vrai texte."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # --- Générer avec l'IA ---
            content = {}
            try:
                for t in tool_types:
                    content[t] = generate_with_fallback(text, t)
            except Exception as e:
                logger.error(f"[StudyTools] Génération IA échouée : {e}")
                return Response(
                    {"error": f"La génération IA a échoué : {e}"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

        finally:
            # Toujours supprimer le fichier temporaire
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

        # --- Sauvegarder la session ---
        session = StudySession.objects.create(
            owner=request.user,
            resource=None,
            source_filename=uploaded_file.name,
            tool_types=tool_types,
            content=content,
        )

        serializer = StudySessionSerializer(session)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_201_CREATED,
        )


class StudySessionListView(APIView):
    """
    GET /api/study/sessions/
    Retourne toutes les sessions de l'utilisateur courant.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        tool_type = request.query_params.get("tool_type")
        sessions = StudySession.objects.filter(owner=request.user)
        if tool_type and tool_type in VALID_TOOL_TYPES:
            # Recherche si le type demandé est dans le JSON array tool_types
            sessions = sessions.filter(tool_types__contains=[tool_type])
        serializer = StudySessionListSerializer(sessions, many=True)
        return Response({"success": True, "data": serializer.data})


class StudySessionDetailView(APIView):
    """
    GET /api/study/sessions/<id>/
    Retourne le détail complet d'une session (avec le contenu JSON).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            session = StudySession.objects.get(pk=pk, owner=request.user)
        except StudySession.DoesNotExist:
            return Response(
                {"error": "Session introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = StudySessionSerializer(session)
        return Response({"success": True, "data": serializer.data})

    def delete(self, request, pk):
        try:
            session = StudySession.objects.get(pk=pk, owner=request.user)
        except StudySession.DoesNotExist:
            return Response(
                {"error": "Session introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ShareStudySessionView(APIView):
    """
    POST /api/study/sessions/<id>/share/
    Body: { sphere_id }

    Marque la session comme partagée dans une sphère.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        sphere_id = request.data.get("sphere_id")
        if not sphere_id:
            return Response(
                {"error": "sphere_id est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            session = StudySession.objects.get(pk=pk, owner=request.user)
        except StudySession.DoesNotExist:
            return Response(
                {"error": "Session introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            sphere = Sphere.objects.get(pk=sphere_id)
        except Sphere.DoesNotExist:
            return Response(
                {"error": "Sphère introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Vérifier que l'utilisateur est membre de la sphère
        is_member = sphere.memberships.filter(user=request.user, status="active").exists()
        if not is_member and sphere.created_by != request.user:
            return Response(
                {"error": "Tu dois être membre de cette sphère pour y partager une session."},
                status=status.HTTP_403_FORBIDDEN,
            )

        session.is_shared = True
        session.shared_in_sphere = sphere
        session.save(update_fields=["is_shared", "shared_in_sphere"])

        serializer = StudySessionSerializer(session)
        return Response({"success": True, "data": serializer.data})

    def delete(self, request, pk):
        """Annuler le partage."""
        try:
            session = StudySession.objects.get(pk=pk, owner=request.user)
        except StudySession.DoesNotExist:
            return Response(
                {"error": "Session introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )
        session.is_shared = False
        session.shared_in_sphere = None
        session.save(update_fields=["is_shared", "shared_in_sphere"])
        return Response({"success": True, "message": "Partage annulé."})


class SphereStudySessionsView(APIView):
    """
    GET /api/study/sphere/<sphere_id>/
    Retourne les sessions partagées dans une sphère.
    Accessible à tous les membres de la sphère.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, sphere_id):
        try:
            sphere = Sphere.objects.get(pk=sphere_id)
        except Sphere.DoesNotExist:
            return Response(
                {"error": "Sphère introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Vérifier l'accès (membre ou créateur)
        is_member = sphere.memberships.filter(user=request.user, status="active").exists()
        if not is_member and sphere.created_by != request.user:
            return Response(
                {"error": "Accès refusé."},
                status=status.HTTP_403_FORBIDDEN,
            )

        sessions = StudySession.objects.filter(
            shared_in_sphere=sphere,
            is_shared=True,
        ).select_related("owner", "resource")

        serializer = StudySessionListSerializer(sessions, many=True)
        return Response({"success": True, "data": serializer.data})
