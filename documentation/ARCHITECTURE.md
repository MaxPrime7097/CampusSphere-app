# Architecture Monorepo CampusSphere & Sphera

## Vue d'ensemble

CampusSphere est une plateforme collaborative étudiante full-stack et Sphera est son application d'apprentissage par IA dédiée. Les deux applications frontend sont organisées en **monorepo pnpm workspaces + Turborepo** et consomment une API centrale commune Node/Express.

```
┌────────────────────────────┐    SSO Bridge    ┌────────────────────────────┐
│    CampusSphere (Vercel)   │◄──(postMessage)─►│       Sphera (Vercel)      │
│   campussphere.app         │                  │   sphera.campussphere.app  │
│   apps/campus (@cs/campus) │                  │   apps/sphera (@cs/sphera) │
└─────────────┬──────────────┘                  └─────────────┬──────────────┘
              │                                               │
              │             Packages Partagés (packages/)     │
              ├───────────────────────┬───────────────────────┤
              │ • @cs/ui              │ • @cs/types           │
              │ • @cs/api-client      │ • @cs/sso             │
              │                       │                       │
              └───────────────┬───────┴───────────────────────┘
                              │ HTTPS / REST + WebSockets
                              ▼
              ┌───────────────────────────────────────────────┐
              │             BACKEND API (Render)              │
              │          apps/backend (@cs/backend)           │
              │   Node 22 + Express 5 + TypeScript + Prisma   │
              └───┬──────────────┬──────────────┬─────────────┘
                  │              │              │
              ┌───▼────────┐ ┌───▼────────┐ ┌───▼─────────┐
              │ PostgreSQL │ │   Redis    │ │  Supabase   │
              │ (Supabase, │ │ fan-out WS │ │    Auth     │
              │  Supavisor)│ │ rate limit │ │ email+OAuth │
              └────────────┘ └────────────┘ └─────────────┘
```

**Rôle de Redis :**
Tout ce qui doit être partagé entre les instances du backend y vit : la diffusion des événements WebSocket, les compteurs de rate limiting et le verrou de leadership pour les tâches planifiées.

---

## Structure du Monorepo

```
campussphere-monorepo/
├── apps/
│   ├── campus/              # @cs/campus — Réseau social étudiant & hub de cours
│   ├── sphera/              # @cs/sphera — Application d'étude interactive (Mindmaps, Audio, Quiz live)
│   └── backend/             # @cs/backend — API Node 22 / Express 5 + Prisma 5
├── packages/
│   ├── ui/                  # @cs/ui — Design system partagé (Button, Badge, Dialog, Tabs, cn...)
│   ├── types/               # @cs/types — Modèles de données canoniques
│   ├── api-client/          # @cs/api-client — Client HTTP unifié avec auto-refresh token
│   └── sso/                 # @cs/sso — Handshake cross-domain SSO (iframe bridge + popup)
├── documentation/           # Spécifications techniques et guides
│   └── features/            # Documentation des fonctionnalités spécifiques
├── turbo.json               # Orchestration des builds, lints, typechecks et tests
├── pnpm-workspace.yaml      # Définition des workspaces pnpm
└── package.json             # Scripts racine
```

---

## 1. Application CampusSphere (`apps/campus`)

Application principale sous React 18, TypeScript, Tailwind CSS, et Vite :

```
apps/campus/src/
├── admin/                    # Panel d'administration
├── components/
│   ├── auth/                 # Formulaires et flow d'auth
│   ├── chat/                 # MiniChat intégré aux sphères
│   ├── feed/                 # Posts, commentaires, suggestions
│   ├── forms/                # Combobox (université, filière, niveau)
│   ├── kanban/               # Gestionnaire de tâches Kanban
│   ├── layout/               # AppLayout, Sidebar, Navigation
│   ├── modals/               # Modales de création, édition, upload
│   └── ui/                   # Re-exports de @cs/ui + composants spécifiques
├── pages/
│   ├── public/               # Landing, Login, Register, CompleteProfile
│   ├── sso/                  # SSOBridge (iframe bridge) & SSOPopup
│   ├── Home.tsx              # Fil d'actualité
│   ├── Spheres.tsx           # Sphères étudiantes
│   └── ...
├── services/                 # Appels API (@cs/api-client & api.ts)
└── sphera/                   # Intégration légère de Sphera
    ├── components/study/     # StudyToolsModal (génération 1-clic depuis les cours)
    └── pages/                # Redirection vers Sphera Standalone
```

### Rôle de CampusSphere vis-à-vis de Sphera :
- **Génération rapide 1-clic** : L'étudiant peut déclencher la génération d'outils d'étude directement depuis une fiche de cours ou un document dans une sphère via `StudyToolsModal`.
- **Aperçu léger** : Les fiches mémo et résumés s'affichent instantanément.
- **Redirection SSO** : Les outils lourds (Mindmaps interactives 2D, lecteurs audio, quiz multijoueurs en direct) renvoient via un bouton « Ouvrir dans Sphera » directement dans l'application dédiée avec session pré-chargée.

---

## 2. Application Sphera (`apps/sphera`)

Application d'étude interactive dédiée sous React 18, TypeScript, Tailwind CSS, et Vite :

```
apps/sphera/src/
├── components/
│   ├── app/                  # ResultViews (MindmapView, AudioSummaryView, FicheView...)
│   ├── auth/                 # Panneaux d'authentification Sphera
│   ├── common/               # Composants partagés (Navbar, Footer, SEO)
│   ├── live/                 # Quiz multijoueur en direct (Host, Join, Lobby, LivePlay)
│   └── study/                # Mindmap React Flow, Flashcards interactives
├── contexts/
│   └── SpheraAuthContext.tsx # Context d'auth avec silent SSO automatique (@cs/sso)
├── pages/
│   ├── Dashboard.tsx         # Tableau de bord des sessions de révision
│   ├── CreateSession.tsx     # Création guidée avec upload & sélection d'outils
│   ├── SessionDetail.tsx     # Espace de travail interactif multi-outils
│   ├── AnnaleDetail.tsx      # Correction détaillée d'annales d'examen
│   ├── QuizLiveHost.tsx      # Animation de session quiz en direct
│   ├── QuizLiveJoin.tsx      # Participation joueur avec code PIN
│   └── ...
└── services/
    └── spheraApi.ts          # Service API Sphera basé sur @cs/types & @cs/api-client
```

---

## 3. Packages Partagés (`packages/`)

### `@cs/ui`
- Contient les composants de base : `Button`, `Badge`, `Dialog`, `Tabs`, `SharedTabs`, `Progress`, `Skeleton`, `Alert`, `Select`, `SpheraIcon`.
- Export de la fonction utilitaire `cn` (`clsx` + `twMerge`).
- Assure une cohérence visuelle parfaite entre CampusSphere et Sphera.

### `@cs/types`
- Centralise les interfaces et types du domaine : `StudySession`, `AnnaleSession`, `ToolType`, `GenerationQuota`, `ApiResponse<T>`, `SpheraProfileData`, `SpheraPreferencesData`, etc.

### `@cs/api-client`
- Client Axios / fetch unifié avec gestion automatique de l'expiration JWT, mutex de rafraîchissement (`performRefreshRaw`), et méthodes typées pour les routes `/api/sphera/*`.

### `@cs/sso`
- Protocole de messagerie sécurisé `postMessage` avec liste blanche stricte des origines autorisées (`campussphere.app`, `sphera.campussphere.app`, et localhost).
- `attemptSilentSso()` : Iframe cachée interrogeant automatiquement le localStorage de CampusSphere.
- `openSsoPopup()` : Fallback popup Google-style pour les navigateurs restreignant les iframes cross-origin.

---

## 4. API Backend (`apps/backend`)

API centrale Node 22 / Express 5 avec ORM Prisma :

```
apps/backend/
├── prisma/
│   ├── schema.prisma         # 33 modèles relationnels PostgreSQL
│   └── migrations/           # Migrations de production
├── src/
│   ├── app.ts                # Montage Express
│   ├── server.ts             # Écouteur HTTP + WebSockets + jobs
│   ├── config/env.ts         # Validation stricte des variables d'environnement
│   ├── routes/               # Routes modulaires (/api/users, /api/spheres, /api/sphera...)
│   ├── services/
│   │   ├── ai/               # Chaîne de fallback IA (DeepSeek V3.2, Claude Haiku, Groq)
│   │   ├── extraction.ts     # Extraction de texte PDF/DOCX (poppler, tesseract)
│   │   └── impact.ts         # Calcul du score d'impact étudiant
│   └── realtime/
│       ├── hub.ts            # Diffusion multi-instances Redis
│       └── websocket.ts      # Gestionnaires de sockets temps réel
```

- **Compatibilité absolue** : 0 modification de schéma de base de données nécessaire lors du passage en monorepo.
- **Docker & Render** : Le fichier `Dockerfile` dans `apps/backend/` est autonome et déployé via `render.yaml`.
