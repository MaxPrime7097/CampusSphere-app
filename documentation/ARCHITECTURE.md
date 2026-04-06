# Architecture CampusSphere

## Vue d'ensemble

CampusSphere est une plateforme collaborative étudiante full-stack. Le frontend React communique avec le backend Django via une API REST. L'authentification est gérée par Supabase Auth, qui émet des tokens échangés contre des JWT Django.

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Vercel)                    │
│              React 18 + TypeScript + Vite                │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / REST API
┌──────────────────────▼──────────────────────────────────┐
│                     BACKEND (Render)                     │
│              Django 5.2 + DRF + Simple JWT               │
└──────────┬───────────────────────────┬───────────────────┘
           │                           │
┌──────────▼──────────┐   ┌────────────▼────────────────┐
│   PostgreSQL (prod) │   │   Supabase Auth              │
│   SQLite (dev)      │   │   (email + OAuth)            │
└─────────────────────┘   └─────────────────────────────┘
```

## Structure Frontend

```
frontend/src/
├── admin/                    # Panel d'administration
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   └── types/
├── components/
│   ├── auth/                 # Composants d'authentification
│   ├── chat/                 # MiniChat intégré aux sphères
│   ├── errors/               # Error boundaries
│   ├── feed/                 # CreatePost, PostCard, FriendSuggestions
│   ├── forms/                # Combobox (université, filière, niveau, etc.)
│   ├── kanban/               # KanbanBoard pour les tâches
│   ├── layout/               # AppLayout, Sidebar, Navigation
│   ├── modals/               # Modales (création, édition, upload)
│   ├── sphere/               # SphereOverview
│   ├── ui/                   # Composants Shadcn/UI de base
│   └── upload/               # FileUpload
├── config/                   # Feature flags
├── constants/                # Types de ressources, notifications, etc.
├── hooks/                    # Hooks personnalisés
├── i18n/                     # Internationalisation (fr/en)
├── lib/                      # Utilitaires (supabase, utils, date, etc.)
├── pages/
│   ├── admin/                # Pages admin
│   ├── public/               # Login, Register, CompleteProfile, Landing, etc.
│   ├── Home.tsx
│   ├── Profile.tsx
│   ├── Spheres.tsx
│   ├── SphereDetail.tsx
│   ├── Resources.tsx
│   ├── Messages.tsx
│   ├── Notifications.tsx
│   ├── Settings.tsx
│   └── ...
├── services/
│   └── api.ts                # Toutes les fonctions d'appel API
├── styles/
└── types/                    # Types TypeScript partagés
```

## Structure Backend

```
backend/
├── campus_sphere/            # Configuration Django principale
│   ├── settings.py
│   ├── urls.py
│   ├── views.py              # Health check
│   ├── cache.py              # Gestion du cache
│   ├── security.py
│   ├── admin_views.py        # Vues admin
│   └── supabase_views.py     # Vues Supabase
├── users/                    # Authentification et profils
│   ├── models.py             # User, Connection, UserBlock, AdminAuditLog
│   ├── serializers.py        # Sérialiseurs + SupabaseProfileCompletionSerializer
│   ├── views.py              # Auth, profil, connexions, Supabase exchange
│   ├── urls.py
│   ├── impact_policy.py      # Règles de calcul du score d'impact
│   ├── signals.py
│   └── throttles.py
├── spheres/                  # Sphères collaboratives
├── posts/                    # Posts et commentaires
├── resources/                # Ressources partagées
├── tasks/                    # Tâches (Kanban)
├── messaging/                # Conversations et messages
├── notifications/            # Notifications
├── upload/                   # Upload de fichiers
└── tests/                    # Tests d'intégration
```

## Modèle de données principal

### User
```python
class User(AbstractBaseUser, PermissionsMixin):
    # Identité
    first_name, last_name, username, email
    # Académique
    university, faculty, study_year, student_id, campus, town
    # Profil
    bio, avatar, cover_photo, language
    # Supabase
    supabase_uid, phone_number, date_of_birth
    # Statut
    is_profile_complete  # False jusqu'à la fin de l'inscription
    # Gamification
    impact_score, current_mood
    # JSON
    skills, interests, previous_education, experiences, portfolio_links
```

### Sphere
```python
class Sphere:
    name, description, category, type
    is_private, require_approval
    color, icon, objective, target_audience
    duration, expires_at, auto_delete_on_expiry
    collaboration_types  # JSON
    banner_image
```

## Flux d'authentification

Voir [AUTH.md](./AUTH.md) pour le détail complet.

**Inscription email** :
```
Étape 1 (infos perso + mdp) → Supabase signUp → Email vérification
→ Retour sur /register?verified=true → Exchange token → Étapes 2-3
→ completeSupabaseProfile → is_profile_complete = True → /
```

**Inscription OAuth (Google/Facebook)** :
```
Clic OAuth → Supabase OAuth → /auth/callback
→ Exchange token → needs_profile_completion = True
→ /complete-profile (3 étapes sans mdp) → /
```

## Routing Frontend

| Route | Composant | Accès |
|-------|-----------|-------|
| `/` | Home | Protégé |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/auth/callback` | AuthCallback | Public |
| `/complete-profile` | CompleteProfile | Public |
| `/register/complete` | CompleteProfile | Public |
| `/profile` | Profile | Protégé |
| `/profile/:username` | Profile | Protégé |
| `/spheres` | Spheres | Protégé |
| `/spheres/:id` | SphereDetail | Protégé |
| `/resources` | Resources | Protégé |
| `/messages` | Messages | Protégé |
| `/notifications` | Notifications | Protégé |
| `/settings` | Settings | Protégé |
| `/admin/*` | AdminLayout | Admin |
| `/cs-inc` | Landing | Public |

## Variables d'environnement

### Frontend (.env)
```env
VITE_API_URL=http://127.0.0.1:8000
VITE_APP_NAME=CampusSphere
VITE_APP_ENV=development
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (.env)
```env
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173
DATABASE_URL=postgresql://user:pass@localhost:5432/campussphere
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=http://localhost:5173
```
