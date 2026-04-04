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


def _get_jwks():
    """Récupère les clés publiques Supabase via JWKS (RS256)."""
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache

    supabase_url = getattr(settings, "SUPABASE_URL", "").strip().rstrip("/")
    if not supabase_url:
        logger.error("SUPABASE_URL not configured")
        return None

    try:
        resp = requests.get(
            f"{supabase_url}/auth/v1/.well-known/jwks.json",
            timeout=10
        )
        resp.raise_for_status()
        _jwks_cache = resp.json()
        logger.info(f"JWKS fetched successfully: {len(_jwks_cache.get('keys', []))} keys")
        return _jwks_cache
    except Exception as e:
        logger.error(f"Failed to fetch Supabase JWKS: {e}")
        return None


def verify_supabase_token(token: str) -> dict | None:
    """
    Vérifie un JWT Supabase.
    Essaie RS256 via JWKS en premier (nouveaux projets),
    puis HS256 via Legacy JWT Secret (anciens projets).
    """
    supabase_url = getattr(settings, "SUPABASE_URL", "").strip()
    jwt_secret = getattr(settings, "SUPABASE_JWT_SECRET", "").strip()

    # --- Méthode 1 : RS256 via JWKS (nouveaux projets Supabase) ---
    if supabase_url:
        jwks = _get_jwks()
        if jwks and jwks.get("keys"):
            for key_data in jwks["keys"]:
                try:
                    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key_data)
                    payload = jwt.decode(
                        token,
                        public_key,
                        algorithms=["RS256"],
                        options={"verify_aud": False},
                    )
                    logger.info(f"Token verified via RS256 JWKS for sub={payload.get('sub')}")
                    return payload
                except jwt.ExpiredSignatureError:
                    logger.warning("Supabase token expired")
                    return None
                except jwt.InvalidTokenError:
                    continue  # Essayer la prochaine clé

    # --- Méthode 2 : HS256 via Legacy JWT Secret (anciens projets) ---
    if jwt_secret:
        for verify_aud in [True, False]:
            try:
                options = {"verify_aud": verify_aud}
                payload = jwt.decode(
                    token,
                    jwt_secret,
                    algorithms=["HS256"],
                    audience="authenticated" if verify_aud else None,
                    options=options,
                )
                logger.info(f"Token verified via HS256 for sub={payload.get('sub')}")
                return payload
            except jwt.ExpiredSignatureError:
                logger.warning("Supabase token expired")
                return None
            except jwt.InvalidTokenError:
                continue

    logger.error(
        "Could not verify Supabase token. "
        "Make sure SUPABASE_URL is set on Render (for RS256/JWKS). "
        f"SUPABASE_URL={'set' if supabase_url else 'NOT SET'}, "
        f"SUPABASE_JWT_SECRET={'set' if jwt_secret else 'NOT SET'}"
    )
    return None


class SupabaseTokenExchangeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        supabase_token = request.data.get("supabase_token")
        if not supabase_token:
            return Response(
                {"detail": "supabase_token requis"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Décoder sans vérification pour le debug
        try:
            raw = jwt.decode(supabase_token, options={"verify_signature": False})
            logger.info(
                f"Token header alg={jwt.get_unverified_header(supabase_token).get('alg')}, "
                f"sub={raw.get('sub')}, email={raw.get('email')}, aud={raw.get('aud')}"
            )
        except Exception:
            raw = {}

        payload = verify_supabase_token(supabase_token)

        if not payload:
            # En dev uniquement : accepter sans vérification
            if getattr(settings, "DEBUG", False) and raw.get("sub"):
                logger.warning("DEV MODE: skipping Supabase token verification")
                payload = raw
            else:
                return Response(
                    {
                        "detail": "Token Supabase invalide ou expiré.",
                        "hint": "Vérifiez que SUPABASE_URL est bien défini sur Render (Settings > Environment).",
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        supabase_uid = payload.get("sub")
        email = payload.get("email", "")
        user_metadata = payload.get("user_metadata", {})

        if not supabase_uid:
            return Response(
                {"detail": "UID Supabase manquant dans le token"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Chercher par supabase_uid, puis par email
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
            first_name = (
                user_metadata.get("first_name")
                or (full_name.split(" ")[0] if full_name else "")
                or "Utilisateur"
            )
            last_name = (
                user_metadata.get("last_name")
                or (" ".join(full_name.split(" ")[1:]) if full_name else "")
                or first_name
            )
            base_username = (
                user_metadata.get("username")
                or (email.split("@")[0] if email else f"user_{supabase_uid[:8]}")
            )
            username = base_username
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
