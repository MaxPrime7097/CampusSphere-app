# Architecture CampusSphere

## Vue d'ensemble

CampusSphere est une plateforme collaborative étudiante full-stack. Le frontend React communique avec le backend Node/Express via une API REST et des WebSockets. L'authentification est gérée par Supabase Auth, dont les tokens sont échangés contre des JWT signés par le backend.

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Vercel)                    │
│              React 18 + TypeScript + Vite                │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / REST + WebSocket
┌──────────────────────▼──────────────────────────────────┐
│              BACKEND (Render, N instances)               │
│        Node 22 + Express 5 + TypeScript + Prisma         │
└───┬──────────────┬──────────────┬───────────────┬────────┘
    │              │              │               │
┌───▼────────┐ ┌───▼────────┐ ┌───▼─────────┐ ┌───▼──────────┐
│ PostgreSQL │ │   Redis    │ │  Supabase   │ │  S3 (fichiers)│
│ (Supabase, │ │ fan-out WS │ │    Auth     │ │              │
│  Supavisor)│ │ rate limit │ │ email+OAuth │ │              │
│            │ │ jobs lock  │ │             │ │              │
└────────────┘ └────────────┘ └─────────────┘ └──────────────┘
```

**Pourquoi Redis est structurant.** Tout ce qui doit être partagé *entre* instances y vit :
la diffusion des événements WebSocket, les compteurs de rate limiting et le verrou qui
désigne l'instance chargée d'exécuter les tâches planifiées. Sans lui, chaque instance
retombe sur un état local — correct pour une seule instance, silencieusement faux au-delà
(messages livrés aux seuls clients de la même instance, limites multipliées par le nombre
d'instances, jobs exécutés N fois). Le serveur refuse donc de démarrer en production sans
`REDIS_URL`, sauf `SINGLE_INSTANCE=true` posé explicitement.

Aucune session collante n'est nécessaire : les WebSockets partagent l'écouteur HTTP et la
diffusion passe par Redis.

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
├── prisma/
│   ├── schema.prisma         # 33 modèles — source de vérité du schéma
│   └── migrations/           # Appliquées par `prisma migrate deploy`
├── src/
│   ├── app.ts                # Assemblage Express (middlewares, montage des routes)
│   ├── server.ts             # Écouteur HTTP + attachement WebSocket + démarrage jobs
│   ├── config/
│   │   └── env.ts            # Lecture/validation des variables (assertProductionConfig)
│   ├── routes/               # Un routeur par domaine
│   │   ├── auth.routes.ts        users.routes.ts      spheres.routes.ts
│   │   ├── posts.routes.ts       resources.routes.ts  tasks.routes.ts
│   │   ├── messaging.routes.ts   notifications.routes.ts
│   │   ├── sphera.routes.ts      uploads.routes.ts    search.routes.ts
│   │   ├── admin.routes.ts       health.routes.ts     supabaseAuth.ts
│   │   └── index.ts              # Montage sous /api
│   ├── middleware/           # requireAuth, rate limiting, erreurs, upload
│   ├── serializers/          # Formes de réponse (contrat API)
│   ├── services/             # Logique métier
│   │   ├── ai/               # Chaîne Claude → Gemini → Groq, prompts, parsing JSON
│   │   ├── impact.ts         # Score d'impact
│   │   ├── extraction.ts     # Texte depuis PDF/DOCX/images (pdftotext, tesseract)
│   │   ├── email.ts          # SMTP + templates HTML
│   │   └── verification.ts
│   ├── realtime/
│   │   ├── hub.ts            # Abstraction de canaux, diffusion via Redis
│   │   └── websocket.ts      # Upgrade, autorisation, /ws/chat|conversations|notifications
│   ├── jobs/                 # Tâches planifiées + verrou de leadership
│   └── lib/                  # prisma, redis, rateLimit, visibility, storage…
└── tests/
    ├── contract/             # Boîte noire HTTP contre un serveur déjà lancé
    ├── integration/          # Démarrent leur propre serveur (rate limits actifs)
    └── unit/
```

La correspondance avec les anciennes apps Django est directe : `users/` → `users.routes.ts`
+ `auth.routes.ts`, `spheres/` → `spheres.routes.ts`, etc. Les routes conservent leurs URLs.

## Modèle de données principal

Source de vérité : [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma) — 33 modèles.

Le schéma est une **refonte, pas un miroir** du schéma Django : pas de `django_content_type`,
pas de `auth_permission`, pas de nommage `users_user`, pas de ledger de migrations Django. Les
tables s'appellent `users`, `spheres`, `posts`… Les identifiants restent des entiers, parce que
toutes les routes du contrat matchent `<int:pk>` et sérialisent les ids en nombres — passer en
UUID casserait l'API. `UploadedFile` garde un UUID, sa route étant `<uuid:pk>`.

### User → table `users`
```prisma
model User {
  id, email @unique, username @unique, firstName, lastName
  passwordHash            // argon2id. Null pour les comptes Supabase-only
  supabaseUid @unique

  university, faculty, studyYear, studentId, campus, town
  bio, avatar, coverPhoto, phoneNumber, dateOfBirth, language (Json)

  profileVisibility, postVisibility   // enum ProfileVisibility
  impactScore, currentMood

  skills, interests, previousEducation, experiences, portfolioLinks  // Json
}
```

`is_profile_complete` n'est **pas** une colonne : il est calculé à la lecture sur
`university` + `faculty` + `study_year`. Django stockait le drapeau avec une liste de champs
requis vide, si bien que `all([])` valait toujours vrai et que le profil était déclaré complet
dès la première connexion. Voir [API_CONTRACT.md](./API_CONTRACT.md) §3.1.

### Sphere → table `spheres`
```prisma
model Sphere {
  name, description, category (enum), sphereType (enum)
  color, icon, bannerImage
  isPrivate, requireApproval
  objective, targetAudience
  duration, expiresAt, autoDeleteOnExpiry
  collaborationTypes (Json)
  memberCount        // dénormalisé — recalculé à chaque mutation d'adhésion
  impactScore
  createdById → User
}
```

Les sphères expirées sont supprimées par une tâche planifiée horaire quand
`autoDeleteOnExpiry` est vrai (`src/jobs/`), et non plus au hasard d'une requête.

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
VITE_API_URL=http://127.0.0.1:3000       # prod : https://api.campussphere.app
VITE_APP_NAME=CampusSphere
VITE_APP_ENV=development
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

`VITE_API_URL` doit toujours être défini : à défaut le frontend devine l'URL du backend
d'après le hostname, et son repli local vise `127.0.0.1:8000` — le port de Django.

### Backend (.env)

Référence complète et commentée : [`backend/.env.example`](../backend/.env.example).
Les **noms sont identiques à ceux de Django**, de sorte que la configuration Render existante
est reprise telle quelle ; `DIRECT_URL` et `SINGLE_INSTANCE` sont les seuls ajouts.

```env
# Base de données — deux endpoints du même PostgreSQL Supabase
DATABASE_URL=postgresql://…@…pooler.supabase.com:6543/postgres?pgbouncer=true  # pooled
DIRECT_URL=postgresql://…@…pooler.supabase.com:5432/postgres                   # session

SECRET_KEY=…
DEBUG=true
PORT=3000
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080
FRONTEND_URL=http://localhost:8080

SUPABASE_URL=…
SUPABASE_JWT_SECRET=…
SUPABASE_SERVICE_ROLE_KEY=…

ANTHROPIC_API_KEY=…   GEMINI_API_KEY=…   GROQ_API_KEY=…

USE_S3=false          # doit valoir true en production
AWS_ACCESS_KEY_ID=…   AWS_SECRET_ACCESS_KEY=…
AWS_STORAGE_BUCKET_NAME=…   AWS_S3_REGION_NAME=eu-west-1

REDIS_URL=            # obligatoire en production, sauf SINGLE_INSTANCE=true
SINGLE_INSTANCE=

EMAIL_HOST_USER=…     EMAIL_HOST_PASSWORD=…
DISABLE_RATE_LIMITS=  # dev/test uniquement — refusé en production
```

**Pourquoi deux URLs de base de données.** `DATABASE_URL` vise le pooler en mode transaction
(port 6543), ce qui permet à N instances de partager un budget de connexions ; `pgbouncer=true`
y est obligatoire, sans quoi les *prepared statements* de Prisma cassent. `DIRECT_URL` vise le
mode session (port 5432) et ne sert qu'à `prisma migrate deploy`, qui a besoin d'un état de
session (verrous consultatifs, DDL transactionnel) qu'un pooler en mode transaction ne fournit
pas. Ne pas utiliser l'hôte direct `db.<ref>.supabase.co` : il ne résout qu'en IPv6 et reste
donc injoignable depuis Render.

Le serveur valide sa configuration au démarrage (`assertProductionConfig`) et refuse de démarrer
en production avec une `SECRET_KEY` de développement, `DEBUG=true`, `USE_S3=false`,
`DISABLE_RATE_LIMITS` posé, ou sans `REDIS_URL` ni `SINGLE_INSTANCE`.
