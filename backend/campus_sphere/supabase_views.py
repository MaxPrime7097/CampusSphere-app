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
REQUIRED_ONBOARDING_FIELDS = ("university", "faculty", "study_year", "student_id")

_jwks_cache = None


def _decode_token_unverified(token: str) -> dict:
    try:
        import jwt as pyjwt
        return pyjwt.decode(token, options={"verify_signature": False})
    except Exception as e:
        logger.error(f"Cannot decode token: {e}")
        return {}


def _verify_jwks(token: str) -> dict | None:
    """Vérifie via JWKS — supporte ES256 (ECDSA) et RS256 (RSA)."""
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
            logger.info(f"JWKS fetched: {len(_jwks_cache.get('keys', []))} keys")
        except Exception as e:
            logger.error(f"JWKS fetch failed: {e}")
            return None

    try:
        import jwt as pyjwt
        from jwt.algorithms import RSAAlgorithm, ECAlgorithm
    except ImportError:
        logger.error("PyJWT[crypto] not installed")
        return None

    for key_data in _jwks_cache.get("keys", []):
        try:
            kty = key_data.get("kty", "")
            if kty == "EC":
                public_key = ECAlgorithm.from_jwk(key_data)
                algorithms = ["ES256", "ES384", "ES512"]
            elif kty == "RSA":
                public_key = RSAAlgorithm.from_jwk(key_data)
                algorithms = ["RS256", "RS384", "RS512"]
            else:
                logger.warning(f"Unknown key type: {kty}")
                continue

            payload = pyjwt.decode(
                token,
                public_key,
                algorithms=algorithms,
                options={"verify_aud": False},
            )
            logger.info(f"Token verified via {kty}/JWKS")
            return payload
        except Exception as e:
            import jwt as pyjwt
            if isinstance(e, pyjwt.ExpiredSignatureError):
                logger.warning("Token expired")
                return None
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
    payload = _verify_jwks(token)
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

            raw = _decode_token_unverified(supabase_token)
            if not raw.get("sub"):
                return Response(
                    {"detail": "Token illisible"},
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
                    return Response(
                        {
                            "detail": "Token Supabase invalide ou expiré",
                            "alg": alg,
                            "SUPABASE_URL_set": bool(getattr(settings, "SUPABASE_URL", "")),
                        },
                        status=status.HTTP_401_UNAUTHORIZED,
                    )

            supabase_uid = payload.get("sub")
            email = payload.get("email", "")
            user_metadata = payload.get("user_metadata", {}) or {}

            user = None
            is_new_user = False

            try:
                user = User.objects.filter(supabase_uid=supabase_uid).first()
            except Exception:
                logger.error("supabase_uid field missing — run: python manage.py migrate")

            if not user and email:
                user = User.objects.filter(email__iexact=email).first()
                if user:
                    try:
                        user.supabase_uid = supabase_uid
                        user.save(update_fields=["supabase_uid"])
                    except Exception:
                        pass

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
                    profile_completed=False,
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


class SupabaseCompleteProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _validate_required_onboarding_fields(self, user, payload):
        missing_fields = []
        for field_name in REQUIRED_ONBOARDING_FIELDS:
            incoming_value = payload.get(field_name, getattr(user, field_name, ""))
            if not str(incoming_value or "").strip():
                missing_fields.append(field_name)

        if missing_fields:
            field_errors = {field: ["Ce champ est obligatoire pour finaliser l'onboarding."] for field in missing_fields}
            return field_errors
        return {}

    def post(self, request):
        validation_errors = self._validate_required_onboarding_fields(request.user, request.data)
        if validation_errors:
            return Response(
                {
                    "success": False,
                    "detail": "Profil incomplet",
                    "errors": validation_errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(profile_completed=True)
        return Response({
            "success": True,
            "data": UserProfileSerializer(request.user).data,
            "message": "Profil complété avec succès",
        }, status=status.HTTP_200_OK)


class SupabaseDebugView(APIView):
    """GET /api/auth/supabase/debug/ — diagnostic sans auth"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        import sys
        import django

        try:
            import jwt as pyjwt
            jwt_ok = True
            jwt_version = pyjwt.__version__
        except ImportError as e:
            jwt_ok = False
            jwt_version = str(e)

        try:
            import cryptography
            crypto_ok = True
            crypto_version = cryptography.__version__
        except ImportError as e:
            crypto_ok = False
            crypto_version = str(e)

        try:
            User.objects.filter(supabase_uid=None).count()
            uid_field_ok = True
        except Exception:
            uid_field_ok = False

        supabase_url = getattr(settings, "SUPABASE_URL", "").strip()
        jwks_ok = False
        jwks_error = None
        jwks_keys = []
        if supabase_url:
            try:
                resp = requests.get(
                    f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json",
                    timeout=5
                )
                jwks_ok = resp.status_code == 200
                if jwks_ok:
                    jwks_keys = [
                        {"kty": k.get("kty"), "alg": k.get("alg"), "kid": k.get("kid")}
                        for k in resp.json().get("keys", [])
                    ]
                else:
                    jwks_error = f"HTTP {resp.status_code}"
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
            "JWKS_keys": jwks_keys,
            "JWKS_error": jwks_error,
        })
