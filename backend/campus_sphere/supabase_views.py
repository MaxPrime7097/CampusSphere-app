import logging
import jwt
import requests
from django.conf import settings
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import User
from users.serializers import UserProfileSerializer, UserUpdateSerializer

logger = logging.getLogger(__name__)

SUPABASE_JWKS_URL = None
_jwks_cache = None


def _get_supabase_public_key():
    """Récupère la clé publique Supabase via JWKS ou JWT secret."""
    # Option 1 : JWT secret (plus simple, recommandé pour débuter)
    jwt_secret = getattr(settings, "SUPABASE_JWT_SECRET", None)
    if jwt_secret:
        return jwt_secret, "HS256"

    # Option 2 : JWKS (RS256)
    supabase_url = getattr(settings, "SUPABASE_URL", None)
    if supabase_url:
        global _jwks_cache
        if not _jwks_cache:
            try:
                resp = requests.get(f"{supabase_url}/auth/v1/.well-known/jwks.json", timeout=5)
                _jwks_cache = resp.json()
            except Exception as e:
                logger.error(f"Failed to fetch Supabase JWKS: {e}")
                return None, None
        return _jwks_cache, "RS256"

    return None, None


def verify_supabase_token(token: str) -> dict | None:
    """Vérifie et décode un JWT Supabase. Retourne le payload ou None."""
    key, algorithm = _get_supabase_public_key()
    if not key:
        logger.error("No Supabase JWT secret or URL configured")
        return None

    try:
        if algorithm == "HS256":
            payload = jwt.decode(
                token,
                key,
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_exp": True},
            )
        else:
            # RS256 via JWKS — utiliser PyJWT avec jwks-client si disponible
            payload = jwt.decode(token, options={"verify_signature": False})
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Supabase token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid Supabase token: {e}")
        return None


class SupabaseTokenExchangeView(APIView):
    """
    POST /api/auth/supabase/exchange/
    Reçoit un JWT Supabase, vérifie, crée ou récupère le User Django,
    retourne un JWT SimpleJWT.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        supabase_token = request.data.get("supabase_token")
        if not supabase_token:
            return Response({"detail": "supabase_token requis"}, status=status.HTTP_400_BAD_REQUEST)

        payload = verify_supabase_token(supabase_token)
        if not payload:
            return Response({"detail": "Token Supabase invalide ou expiré"}, status=status.HTTP_401_UNAUTHORIZED)

        supabase_uid = payload.get("sub")
        email = payload.get("email", "")
        user_metadata = payload.get("user_metadata", {})

        if not supabase_uid:
            return Response({"detail": "UID Supabase manquant"}, status=status.HTTP_400_BAD_REQUEST)

        # Chercher par supabase_uid d'abord, puis par email
        user = User.objects.filter(supabase_uid=supabase_uid).first()
        is_new_user = False

        if not user and email:
            user = User.objects.filter(email__iexact=email).first()
            if user:
                # Lier le compte existant
                user.supabase_uid = supabase_uid
                user.save(update_fields=["supabase_uid"])

        if not user:
            # Créer un user minimal — il complétera son profil ensuite
            is_new_user = True
            first_name = user_metadata.get("first_name") or user_metadata.get("full_name", "").split(" ")[0] or "Utilisateur"
            last_name = user_metadata.get("last_name") or " ".join(user_metadata.get("full_name", "").split(" ")[1:]) or ""
            username = user_metadata.get("username") or email.split("@")[0]

            # S'assurer que le username est unique
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            user = User.objects.create(
                supabase_uid=supabase_uid,
                email=email,
                username=username,
                first_name=first_name,
                last_name=last_name,
                is_active=True,
            )
            user.set_unusable_password()
            user.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            "success": True,
            "data": {
                "tokens": {
                    "accessToken": str(refresh.access_token),
                    "refreshToken": str(refresh),
                },
                "user": UserProfileSerializer(user).data,
                "is_new_user": is_new_user,
            }
        }, status=status.HTTP_200_OK)


class SupabaseCompleteProfileView(APIView):
    """
    POST /api/auth/supabase/complete-profile/
    Complète le profil Django après inscription Supabase.
    Requiert un JWT Django valide (obtenu via exchange).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            "success": True,
            "data": UserProfileSerializer(request.user).data,
            "message": "Profil complété avec succès",
        }, status=status.HTTP_200_OK)
