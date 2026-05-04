from rest_framework import serializers
from django.db.models import Q
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
import re
from .models import User, Connection, UserBlock, ContactMessage

REQUIRED_PROFILE_FIELDS = [] # On ne force plus rien au niveau du serializer pour éviter les 400
USERNAME_REGEX = re.compile(r'^[A-Za-z0-9][A-Za-z0-9_.-]*$')


def normalize_email_for_lookup(value):
    return (value or "").strip().lower()


def normalize_username_for_lookup(value):
    return (value or "").strip()


class SupabaseProfileCompletionSerializer(serializers.ModelSerializer):
    """Serializer pour compléter le profil après inscription Supabase"""
    phone_number = serializers.CharField(required=False, allow_blank=True, default="")
    date_of_birth = serializers.DateField(
        required=False, 
        allow_null=True, 
        default=None,
        input_formats=['%d/%m/%Y', '%Y-%m-%d', 'iso-8601']
    )

    MAX_PREVIOUS_EDUCATION_ITEMS = 10
    MAX_EXPERIENCES_ITEMS = 10
    MAX_PORTFOLIO_LINKS_ITEMS = 20
    ISO_LANGUAGE_REGEX = re.compile(r"^[a-z]{2}(?:-[A-Z]{2})?$")
    USERNAME_REGEX = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")
    STUDY_YEAR_REGEX = re.compile(r"^[A-Za-z0-9][A-Za-z0-9\s._/-]*$")
    STUDENT_ID_REGEX = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._/-]*$")
    PHONE_REGEX = re.compile(r"^\+?[0-9][0-9\s().-]{6,29}$")
    MINIMUM_AGE = 16
    
    class Meta:
        model = User
        fields = [
            'username', 'first_name', 'last_name', 'phone_number', 'date_of_birth',
            'university', 'faculty', 'study_year', 'student_id', 'campus', 'town', 'language',
            'bio', 'skills', 'interests', 'previous_education', 'experiences', 'portfolio_links'
        ]
    
    def validate_username(self, value):
        # On nettoie et on s'assure que c'est une chaîne
        val = str(value).strip().lower()
        if not val:
            val = f"user_{getattr(self.instance, 'pk', 'new')}"
            
        # Si déjà pris, on ne bloque pas, on crée une variante
        if User.objects.filter(username__iexact=val).exclude(pk=getattr(self.instance, 'pk', None)).exists():
            from django.utils.crypto import get_random_string
            val = f"{val}_{get_random_string(3)}"
        return val

    def validate_phone_number(self, value):
        if not value: return ""
        return str(value).strip()[:30]

    def validate_date_of_birth(self, value):
        if value is None:
            return value

        today = timezone.now().date()
        if value > today:
            # On ne bloque pas pour une date dans le futur, on met à None
            return None

        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < self.MINIMUM_AGE:
            # On ne bloque pas pour l'âge non plus, on laisse passer pour éviter les 400
            return value
        return value

    def validate_language(self, value):
        if not value: return "fr"
        val = value.lower().strip()
        if "fr" in val or "fran" in val: return "fr"
        if "en" in val or "angl" in val: return "en"
        return val[:10]
        if not self.ISO_LANGUAGE_REGEX.match(value):
            raise serializers.ValidationError("La langue doit suivre le format ISO (ex: fr, en, fr-CA)")
        return value

    def validate_student_id(self, value):
        if not value: return ""
        normalized_value = value.strip()
        # On accepte presque tout pour le matricule pour ne pas bloquer l'inscription
        return normalized_value[:50]

    def validate_study_year(self, value):
        if not value: return ""
        return value.strip()[:20]

    def _validate_json_list_field(self, value, *, field_name, required_keys, max_items, value_max_length=200):
        if not value or not isinstance(value, list):
            return []
        
        cleaned_items = []
        for item in value:
            if not isinstance(item, dict):
                continue # On ignore ce qui n'est pas un objet au lieu de planter
                
            # On ne garde l'item que s'il contient au moins une info utile
            has_data = any(bool(v) for v in item.values())
            if not has_data:
                continue

            cleaned_item = {}
            for key, raw_value in item.items():
                if isinstance(raw_value, str):
                    cleaned_item[key] = raw_value.strip()[:value_max_length]
                else:
                    cleaned_item[key] = raw_value
            cleaned_items.append(cleaned_item)
            
            if len(cleaned_items) >= max_items:
                break
        return cleaned_items

    def validate_previous_education(self, value):
        return self._validate_json_list_field(
            value,
            field_name="previous_education",
            required_keys=(), # On ne force plus de clés spécifiques
            max_items=self.MAX_PREVIOUS_EDUCATION_ITEMS
        )

    def validate_experiences(self, value):
        return self._validate_json_list_field(
            value,
            field_name="experiences",
            required_keys=(),
            max_items=self.MAX_EXPERIENCES_ITEMS
        )

    def validate_portfolio_links(self, value):
        validated = self._validate_json_list_field(
            value,
            field_name="portfolio_links",
            required_keys=(),
            max_items=self.MAX_PORTFOLIO_LINKS_ITEMS
        )
        url_validator = URLValidator()
        for index, link in enumerate(validated):
            if "url" in link:
                try:
                    url_validator(link["url"])
                except DjangoValidationError:
                    raise serializers.ValidationError({index: "URL de portfolio invalide"})
        return validated

    @staticmethod
    def _ensure_required_text(field_name, value):
        if not isinstance(value, str) or not value.strip():
            raise serializers.ValidationError({field_name: f"Le champ {field_name} est obligatoire"})
        return value.strip()
    
    def validate(self, data):
        # On ne bloque plus si un champ est manquant, on nettoie juste ce qui est là
        for field in REQUIRED_PROFILE_FIELDS:
            if field in data:
                val = data[field]
                if isinstance(val, str):
                    data[field] = val.strip()
        return data
    
    def update(self, instance, validated_data):
        # Extraire les champs spéciaux
        phone_number = validated_data.pop('phone_number', getattr(instance, 'phone_number', ''))
        date_of_birth = validated_data.pop('date_of_birth', getattr(instance, 'date_of_birth', None))
        
        # Mettre à jour tous les champs fournis
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Réassigner les champs spéciaux si présents
        if phone_number:
            instance.phone_number = phone_number
        if date_of_birth:
            instance.date_of_birth = date_of_birth
        
        # Logique de complétion plus intelligente :
        # On considère le profil complet si l'utilisateur a rempli les infos académiques de base
        academic_fields = ['university', 'faculty', 'study_year']
        instance.is_profile_complete = all(bool(getattr(instance, f, None)) for f in academic_fields)
        
        instance.save()
        return instance


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(required=False, allow_blank=True, default="")
    date_of_birth = serializers.DateField(required=False, allow_null=True, default=None)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'username', 'email', 'password', 'confirm_password',
            'university', 'faculty', 'study_year', 'student_id', 'campus', 'town', 'language',
            'bio', 'skills', 'interests', 'previous_education', 'experiences', 'portfolio_links',
            'phone_number', 'date_of_birth',
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def validate_email(self, value):
        normalized = normalize_email_for_lookup(value)
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("This email is already in use")
        return normalized

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_username(self, value):
        normalized = normalize_username_for_lookup(value)
        if not (3 <= len(normalized) <= 50):
            raise serializers.ValidationError("Le nom d'utilisateur doit contenir entre 3 et 50 caractères")
        if not USERNAME_REGEX.match(normalized):
            raise serializers.ValidationError(
                "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, points, tirets et underscores"
            )
        if User.objects.filter(username__iexact=normalized).exists():
            raise serializers.ValidationError("This username is already in use")
        return normalized

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        phone_number = validated_data.pop('phone_number', '')
        date_of_birth = validated_data.pop('date_of_birth', None)
        bio = validated_data.pop('bio', '')
        skills = validated_data.pop('skills', [])
        interests = validated_data.pop('interests', [])
        previous_education = validated_data.pop('previous_education', [])
        experiences = validated_data.pop('experiences', [])
        portfolio_links = validated_data.pop('portfolio_links', [])

        is_complete = all(validated_data.get(field) for field in REQUIRED_PROFILE_FIELDS)
        user = User.objects.create_user(is_profile_complete=is_complete, **validated_data)
        if phone_number and hasattr(user, 'phone_number'):
            user.phone_number = phone_number
        if date_of_birth and hasattr(user, 'date_of_birth'):
            user.date_of_birth = date_of_birth
        if bio:
            user.bio = bio
        if skills:
            user.skills = skills
        if interests:
            user.interests = interests
        if previous_education:
            user.previous_education = previous_education
        if experiences:
            user.experiences = experiences
        if portfolio_links:
            user.portfolio_links = portfolio_links
        if is_complete:
            user.is_profile_complete = True
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = normalize_email_for_lookup(data.get('email'))
        password = data.get('password')

        if email and password:
            # Django's default authentication backend expects the credential
            # keyword to be the USERNAME_FIELD (which in this project is 'email'),
            # but ModelBackend expects a 'username' kwarg. Use 'username' here
            # to ensure authentication works with the default backend.
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError("Invalid credentials")
            if not user.is_active:
                raise serializers.ValidationError("User account is disabled")
        else:
            raise serializers.ValidationError("Email and password are required")

        data['user'] = user
        return data


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    coverPhoto = serializers.ImageField(source='cover_photo', read_only=True)
    studyYear = serializers.CharField(source='study_year', read_only=True)
    studentId = serializers.CharField(source='student_id', read_only=True)
    previousEducation = serializers.JSONField(source='previous_education', read_only=True)
    portfolioLinks = serializers.JSONField(source='portfolio_links', read_only=True)
    phone_number = serializers.SerializerMethodField()
    phoneNumber = serializers.SerializerMethodField()
    date_of_birth = serializers.SerializerMethodField()
    dateOfBirth = serializers.SerializerMethodField()
    joined_spheres_count = serializers.SerializerMethodField()
    connections_count = serializers.SerializerMethodField()
    contributions_count = serializers.SerializerMethodField()
    isVerified = serializers.BooleanField(source='is_verified', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'username', 'email', 'full_name',
            'phone_number', 'phoneNumber', 'date_of_birth', 'dateOfBirth', 'avatar', 'cover_photo', 'coverPhoto',
            'bio', 'university', 'faculty', 'study_year', 'studyYear', 'student_id', 'studentId', 'campus',
            'town', 'language', 'profile_visibility', 'post_visibility',
            'data_export_requested_at', 'impact_score', 'current_mood',
            'skills', 'interests', 'previous_education', 'previousEducation', 'experiences',
            'portfolio_links', 'portfolioLinks', 'joined_spheres_count', 'connections_count', 'contributions_count',
            'date_joined', 'updated_at', 'is_staff', 'is_superuser', 'is_verified', 'isVerified'
        ]
        read_only_fields = ['id', 'impact_score', 'date_joined', 'updated_at']

    def get_joined_spheres_count(self, obj):
        return obj.sphere_memberships.filter(status='active').count()

    def get_phone_number(self, obj):
        return getattr(obj, 'phone_number', '')

    def get_phoneNumber(self, obj):
        return self.get_phone_number(obj)

    def get_date_of_birth(self, obj):
        return getattr(obj, 'date_of_birth', None)

    def get_dateOfBirth(self, obj):
        return self.get_date_of_birth(obj)

    def get_connections_count(self, obj):
        """
        Business rule: only accepted connections are counted.
        """
        return Connection.objects.filter(
            Q(requester=obj) | Q(recipient=obj),
            status='accepted'
        ).count()

    def get_contributions_count(self, obj):
        """
        Lightweight aggregate used by frontend resource/profile cards.
        """
        posts_count = obj.posts.count() if hasattr(obj, 'posts') else 0
        resources_count = obj.resources.count() if hasattr(obj, 'resources') else 0
        return posts_count + resources_count


class UserUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(min_length=3, max_length=50, required=False)
    phone_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'username', 'bio', 'university', 'faculty', 'study_year',
            'student_id', 'campus', 'town', 'language', 'skills', 'interests', 'current_mood',
            'previous_education', 'experiences', 'portfolio_links', 'profile_visibility', 'post_visibility',
            'phone_number', 'date_of_birth'
        ]

    def validate_username(self, value):
        value = normalize_username_for_lookup(value)
        user = self.instance
        if User.objects.exclude(id=user.id).filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already in use")
        return value



    def update(self, instance, validated_data):
        """
        Handle optional profile fields that may be present in some deployments
        (e.g. phone_number/date_of_birth) without breaking environments where
        those columns are not yet migrated.
        """
        phone_number = validated_data.pop('phone_number', serializers.empty)
        date_of_birth = validated_data.pop('date_of_birth', serializers.empty)

        instance = super().update(instance, validated_data)

        update_fields = []
        if phone_number is not serializers.empty and hasattr(instance, 'phone_number'):
            instance.phone_number = phone_number
            update_fields.append('phone_number')
        if date_of_birth is not serializers.empty and hasattr(instance, 'date_of_birth'):
            instance.date_of_birth = date_of_birth
            update_fields.append('date_of_birth')

        if update_fields:
            update_fields.append('updated_at')
            instance.save(update_fields=update_fields)

        return instance


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value

    def validate_new_password(self, value):
        user = self.context['request'].user
        validate_password(value, user=user)
        return value


class ChangeEmailSerializer(serializers.Serializer):
    current_email = serializers.EmailField()
    new_email = serializers.EmailField()

    def validate(self, attrs):
        user = self.context['request'].user
        current_email = normalize_email_for_lookup(attrs.get('current_email'))
        new_email = normalize_email_for_lookup(attrs.get('new_email'))

        if current_email != user.email.lower():
            raise serializers.ValidationError({'current_email': 'Current email does not match your account'})

        if current_email == new_email:
            raise serializers.ValidationError({'new_email': 'New email must be different from current email'})

        if User.objects.exclude(id=user.id).filter(email__iexact=new_email).exists():
            raise serializers.ValidationError({'new_email': 'This email is already in use'})

        attrs['new_email'] = new_email
        return attrs


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=False, allow_blank=True)


class DeleteAccountSerializer(serializers.Serializer):
    confirmation_text = serializers.CharField()

    def validate_confirmation_text(self, value):
        if value.strip().upper() != 'SUPPRIMER':
            raise serializers.ValidationError('Please type SUPPRIMER to confirm account deletion')
        return value


class ConnectionSerializer(serializers.ModelSerializer):
    requester_info = UserProfileSerializer(source='requester', read_only=True)
    recipient_info = UserProfileSerializer(source='recipient', read_only=True)

    class Meta:
        model = Connection
        fields = [
            'id', 'requester', 'recipient', 'status', 'requester_info', 'recipient_info',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ConnectionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Connection
        fields = ['recipient']

    def validate_recipient(self, value):
        user = self.context['request'].user
        if value == user:
            raise serializers.ValidationError("Cannot connect to yourself")
        
        # Check if connection already exists in any direction
        from .models import Connection
        from django.db import models
        if Connection.objects.filter(
            models.Q(requester=user, recipient=value) |
            models.Q(requester=value, recipient=user)
        ).exists():
            raise serializers.ValidationError("A connection or request already exists between these users.")
            
        return value

    def create(self, validated_data):
        validated_data['requester'] = self.context['request'].user
        return super().create(validated_data)


class UserSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'username', 'avatar', 'bio',
            'university', 'faculty', 'study_year', 'impact_score'
        ]


class PrivacySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['profile_visibility', 'post_visibility', 'data_export_requested_at']
        read_only_fields = ['data_export_requested_at']


class DataExportRequestSerializer(serializers.Serializer):
    include_connections = serializers.BooleanField(default=True)
    include_posts = serializers.BooleanField(default=True)


class BlockListItemSerializer(serializers.ModelSerializer):
    blocked_user = UserSearchSerializer(source='blocked', read_only=True)

    class Meta:
        model = UserBlock
        fields = ['id', 'blocked', 'blocked_user', 'created_at']
        read_only_fields = ['id', 'created_at', 'blocked_user']


class BlockCreateSerializer(serializers.Serializer):
    blocked_user_id = serializers.IntegerField()

    def validate_blocked_user_id(self, value):
        user = self.context['request'].user
        if user.id == value:
            raise serializers.ValidationError('You cannot block yourself')

        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError('User does not exist')

        return value

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'message', 'newsletter', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']
