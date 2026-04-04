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

_jwks_cache = None


def _decode_with_secret(token: str, secret: str) -> dict | None:
    """Tente de décoder avec HS256, essaie avec et sans vérification d'audience."""
    # Essai 1 : avec audience "authenticated"
    try:
        return jwt.decode(token, secret, algorithms=["HS256"], audience="authenticated")
    except jwt.InvalidAudienceError:
        pass
    except jwt.ExpiredSignatureError:
        logger.warning("Supabase token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"HS256 decode failed (with audience): {e}")

    # Essai 2 : sans vérification d'audience (certains projets Supabase n'ont pas d'audience)
    try:
        return jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})
    except jwt.ExpiredSignatureError:
        logger.warning("Supabase token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"HS256 decode failed (without audience): {e}")
        return None


def _decode_without_verification(token: str) -> dict | None:
    """Décode sans vérifier la signature — utilisé en dernier recours ou dev."""
    try:
        return jwt.decode(token, options={"verify_signature": False})
    except Exception as e:
        logger.error(f"Failed to decode token without verification: {e}")
        return None


def verify_supabase_token(token: str) -> dict | None:
    """Vérifie et décode un JWT Supabase."""
    jwt_secret = getattr(settings, "SUPABASE_JWT_SECRET", "").strip()

    if jwt_secret:
        payload = _decode_with_secret(token, jwt_secret)
        if payload:
            return payload
        logger.error("SUPABASE_JWT_SECRET set but token verification failed — check the secret value")
        return None

    # Pas de secret configuré → log clair
    logger.error(
        "SUPABASE_JWT_SECRET is not set in environment variables. "
        "Add it in your Render dashboard: Settings > JWT Settings > JWT Secret"
    )
    return None


class SupabaseTokenExchangeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        supabase_token = request.data.get("supabase_token")
        if not supabase_token:
            return Response({"detail": "supabase_token requis"}, status=status.HTTP_400_BAD_REQUEST)

        # Debug : décoder sans vérification pour voir le contenu
        raw_payload = _decode_without_verification(supabase_token)
        logger.info(f"Supabase token sub={raw_payload.get('sub') if raw_payload else 'N/A'}, "
                    f"email={raw_payload.get('email') if raw_payload else 'N/A'}, "
                    f"aud={raw_payload.get('aud') if raw_payload else 'N/A'}")

        payload = verify_supabase_token(supabase_token)
        if not payload:
            # En développement, on peut utiliser le payload non vérifié
            # En production, on refuse
            debug = getattr(settings, "DEBUG", False)
            if debug and raw_payload:
                logger.warning("DEV MODE: using unverified Supabase token payload")
                payload = raw_payload
            else:
                return Response(
                    {"detail": "Token Supabase invalide ou expiré. Vérifiez SUPABASE_JWT_SECRET sur Render."},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        supabase_uid = payload.get("sub")
        email = payload.get("email", "")
        user_metadata = payload.get("user_metadata", {})

        if not supabase_uid:
            return Response({"detail": "UID Supabase manquant dans le token"}, status=status.HTTP_400_BAD_REQUEST)

        # Chercher par supabase_uid d'abord, puis par email
        user = User.objects.filter(supabase_uid=supabase_uid).first()
        is_new_user = False

        if not user and email:
            user = User.objects.filter(email__iexact=email).first()
            if user:
                user.supabase_uid = supabase_uid
                user.save(update_fields=["supabase_uid"])

        if not user:
            is_new_user = True
            full_name = user_metadata.get("full_name", "")
            first_name = user_metadata.get("first_name") or (full_name.split(" ")[0] if full_name else "Utilisateur")
            last_name = user_metadata.get("last_name") or (" ".join(full_name.split(" ")[1:]) if full_name else "")
            username = user_metadata.get("username") or (email.split("@")[0] if email else f"user_{supabase_uid[:8]}")

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
                last_name=last_name or first_name,
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
