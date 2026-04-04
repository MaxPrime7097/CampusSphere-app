import logging
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


def _decode_token_unverified(token: str) -> dict:
    """Décode sans vérification — pour extraire sub/email en fallback."""
    try:
        import jwt as pyjwt
        return pyjwt.decode(token, options={"verify_signature": False})
    except Exception as e:
        logger.error(f"Cannot decode token at all: {e}")
        return {}


def _verify_rs256(token: str) -> dict | None:
    """Vérifie via JWKS RS256 (nouveaux projets Supabase)."""
    supabase_url = getattr(settings, "SUPABASE_URL", "").strip().rstrip("/")
    if not supabase_url:
        return None

    global _jwks_cache
    if not _jwks_cache:
        try:
            resp = requests.get(
                f"{supabase_url}/auth/v1/.well-known/jwks.json",
                timeout=10
            )
            resp.raise_for_status()
            _jwks_cache = resp.json()
        except Exception as e:
            logger.error(f"JWKS fetch failed: {e}")
            return None

    try:
        import jwt as pyjwt
        from jwt.algorithms import RSAAlgorithm
    except ImportError:
        logger.error("PyJWT not installed. Run: pip install PyJWT[crypto]")
        return None

    for key_data in _jwks_cache.get("keys", []):
        try:
            public_key = RSAAlgorithm.from_jwk(key_data)
            payload = pyjwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
            return payload
        except pyjwt.ExpiredSignatureError:
            logger.warning("Token expired (RS256)")
            return None
        except pyjwt.InvalidTokenError:
            continue

    return None


def _verify_hs256(token: str) -> dict | None:
    """Vérifie via Legacy JWT Secret HS256."""
    secret = getattr(settings, "SUPABASE_JWT_SECRET", "").strip()
    if not secret:
        return None

    try:
        import jwt as pyjwt
    except ImportError:
        return None

    for verify_aud in [True, False]:
        try:
            kwargs = {"algorithms": ["HS256"], "options": {"verify_aud": verify_aud}}
            if verify_aud:
                kwargs["audience"] = "authenticated"
            return pyjwt.decode(token, secret, **kwargs)
        except Exception:
            continue

    return None


def verify_supabase_token(token: str) -> dict | None:
    payload = _verify_rs256(token)
    if payload:
        return payload
    payload = _verify_hs256(token)
    if payload:
        return payload
    return None


class SupabaseTokenExchangeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            supabase_token = request.data.get("supabase_token", "").strip()
            if not supabase_token:
                return Response(
                    {"detail": "supabase_token requis"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Toujours décoder sans vérification pour avoir sub/email
            raw = _decode_token_unverified(supabase_token)
            if not raw.get("sub"):
                return Response(
                    {"detail": "Token illisible — format invalide"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                import jwt as pyjwt
                alg = pyjwt.get_unverified_header(supabase_token).get("alg", "?")
            except Exception:
                alg = "?"

            logger.info(
                f"Exchange attempt: alg={alg}, sub={raw.get('sub')}, "
                f"email={raw.get('email')}, aud={raw.get('aud')}"
            )

            payload = verify_supabase_token(supabase_token)

            if not payload:
                if getattr(settings, "DEBUG", False):
                    logger.warning("DEV: using unverified payload")
                    payload = raw
                else:
                    supabase_url = getattr(settings, "SUPABASE_URL", "")
                    jwt_secret = getattr(settings, "SUPABASE_JWT_SECRET", "")
                    return Response(
                        {
                            "detail": "Token Supabase invalide ou expiré",
                            "debug": {
                                "alg": alg,
                                "SUPABASE_URL_set": bool(supabase_url),
                                "SUPABASE_JWT_SECRET_set": bool(jwt_secret),
                            }
                        },
                        status=status.HTTP_401_UNAUTHORIZED
                    )

            supabase_uid = payload.get("sub")
            email = payload.get("email", "")
            user_metadata = payload.get("user_metadata", {}) or {}

            # Chercher ou créer le user Django
            user = None
            is_new_user = False

            # 1. Par supabase_uid
            try:
                user = User.objects.filter(supabase_uid=supabase_uid).first()
            except Exception:
                # Champ supabase_uid n'existe pas encore → migration pas appliquée
                logger.error("supabase_uid field missing — run: python manage.py migrate")
                user = None

            # 2. Par email
            if not user and email:
                user = User.objects.filter(email__iexact=email).first()
                if user:
                    try:
                        user.supabase_uid = supabase_uid
                        user.save(update_fields=["supabase_uid"])
                    except Exception:
                        pass

            # 3. Créer
            if not user:
                is_new_user = True
                full_name = user_metadata.get("full_name", "") or ""
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

                create_kwargs = dict(
                    email=email,
                    username=username,
                    first_name=first_name,
                    last_name=last_name,
                    is_active=True,
                )
                try:
                    create_kwargs["supabase_uid"] = supabase_uid
                except Exception:
                    pass

                user = User.objects.create(**create_kwargs)
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

        except Exception as e:
            logger.exception(f"Unexpected error in SupabaseTokenExchangeView: {e}")
            return Response(
                {"detail": f"Erreur serveur: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SupabaseDebugView(APIView):
    """GET /api/auth/supabase/debug/ — diagnostic sans auth"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        import sys
        import django

        # Test PyJWT
        try:
            import jwt as pyjwt
            jwt_version = pyjwt.__version__
            jwt_ok = True
        except ImportError as e:
            jwt_version = str(e)
            jwt_ok = False

        # Test cryptography (pour RS256)
        try:
            import cryptography
            crypto_version = cryptography.__version__
            crypto_ok = True
        except ImportError as e:
            crypto_version = str(e)
            crypto_ok = False

        # Test champ supabase_uid
        try:
            User.objects.filter(supabase_uid=None).count()
            uid_field_ok = True
        except Exception as e:
            uid_field_ok = False

        # Test JWKS fetch
        supabase_url = getattr(settings, "SUPABASE_URL", "").strip()
        jwks_ok = False
        jwks_error = None
        if supabase_url:
            try:
                resp = requests.get(f"{supabase_url}/auth/v1/.well-known/jwks.json", timeout=5)
                jwks_ok = resp.status_code == 200
                jwks_error = None if jwks_ok else f"HTTP {resp.status_code}"
            except Exception as e:
                jwks_error = str(e)

        return Response({
            "django": django.__version__,
            "python": sys.version,
            "PyJWT": {"ok": jwt_ok, "version": jwt_version},
            "cryptography": {"ok": crypto_ok, "version": crypto_version},
            "supabase_uid_field": uid_field_ok,
            "SUPABASE_URL_set": bool(supabase_url),
            "SUPABASE_JWT_SECRET_set": bool(getattr(settings, "SUPABASE_JWT_SECRET", "")),
            "JWKS_reachable": jwks_ok,
            "JWKS_error": jwks_error,
        })
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
