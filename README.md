# CampusSphere & Sphera — Monorepo

Plateforme collaborative étudiante et suite d'apprentissage par IA propulsée par un monorepo **pnpm workspaces** et **Turborepo**.

- **CampusSphere** : Réseau social étudiant, sphères de collaboration, documents, cours, tâches, messagerie, notifications et modal de génération d'outils d'étude 1-clic.
- **Sphera** : Application interactive dédiée à l'apprentissage (cartes mentales interactives, quiz solo/multijoueur en direct, fiches mémo, synthèses audio de cours, annales d'examens).
- **Backend Node/Express** : API centrale commune avec Prisma 5, PostgreSQL, Redis et connecteurs LLM (Claude Haiku, Gemini Flash, Groq Llama).

---

## Architecture du Monorepo

```
campussphere-monorepo/
├── apps/
│   ├── campus/              # @cs/campus — Application CampusSphere (Vite + React 18)
│   ├── sphera/              # @cs/sphera — Application Sphera dédiée (Vite + React 18)
│   └── backend/             # @cs/backend — API Node 22 / Express 5 + Prisma (inchangé)
├── packages/
│   ├── ui/                  # @cs/ui — Design system partagé (Button, Dialog, Tabs, cn...)
│   ├── types/               # @cs/types — Types TypeScript de domaine partagés
│   ├── api-client/          # @cs/api-client — Client API unifié avec auto-refresh JWT
│   └── sso/                 # @cs/sso — Handshake SSO cross-domain, bridge iframe & popup
├── turbo.json               # Pipeline d'orchestration Turborepo (build, lint, typecheck, test)
├── pnpm-workspace.yaml      # Configuration des packages du workspace
└── package.json             # Scripts racine
```

---

## Démarrage Rapide

### Prérequis
- Node.js >= 20.x
- pnpm >= 9.x (recommandé v10)

```bash
# Installation de toutes les dépendances du monorepo
pnpm install
```

### Développement local

```bash
# Lancer les applications frontend simultanément
pnpm dev

# Ou lancer une application spécifique :
pnpm dev:campus    # CampusSphere -> http://localhost:5173
pnpm dev:sphera    # Sphera App   -> http://localhost:5174 ou 4173
pnpm dev:backend   # API Backend  -> http://localhost:3000
```

### Vérifications & Qualité

```bash
pnpm typecheck     # Vérification TypeScript sur l'ensemble des 7 packages (turbo)
pnpm lint          # Linting ESLint (turbo)
pnpm test          # Tests unitaires Vitest (turbo)
pnpm build         # Build de production de tous les packages (turbo)
```

---

## Déploiement Vercel

Le déploiement des deux frontends s'effectue sur les **2 projets Vercel existants** sans interruption :

### 1. Projet Vercel : CampusSphere (`campussphere.app`)
- **Root Directory** : `apps/campus`
- **Build Command** : `pnpm build` (ou laisser Vercel détecter automatiquement via Turborepo)
- **Output Directory** : `dist`
- **Install Command** : `pnpm install`

### 2. Projet Vercel : Sphera (`sphera.campussphere.app`)
- **Root Directory** : `apps/sphera`
- **Build Command** : `pnpm build`
- **Output Directory** : `dist`
- **Install Command** : `pnpm install`

### Variables d'environnement essentielles

| Variable | Apps | Description |
|---|---|---|
| `VITE_API_URL` | campus, sphera | URL de l'API backend (`https://api.campussphere.app` en prod) |
| `VITE_SUPABASE_URL` | campus | URL de l'instance Supabase Auth |
| `VITE_SUPABASE_ANON_KEY` | campus | Clé anonyme Supabase |
| `VITE_SPHERA_STANDALONE_URL` | campus | URL de Sphera (`https://sphera.campussphere.app` en prod) |

---

## Packages Partagés

### `@cs/ui`
Composants UI partagés basés sur Tailwind CSS et Radix Primitives :
`Button`, `Badge`, `Dialog`, `Tabs`, `SharedTabs`, `Progress`, `Skeleton`, `Alert`, `Select`, `SpheraIcon`, et utilitaire `cn`.

### `@cs/types`
Modèles canoniques partagés entre frontends et backend :
`StudySession`, `AnnaleSession`, `ToolType`, `GenerationQuota`, `SpheraProfileData`, `ApiResponse<T>`, etc.

### `@cs/api-client`
Client HTTP unifié configuré avec gestion des tokens, mutex anti-refresh race conditions, et méthodes typées pour les endpoints `/api/sphera/*`.

### `@cs/sso`
Module d'authentification cross-application :
- Validation stricte des origines (`campussphere.app`, `sphera.campussphere.app`, dev localhost).
- Iframe bridge pour le SSO silencieux transparent.
- Helper popup Google-style pour les navigateurs bloquant les cookies/stockages tiers.

---

## Base de Données & Backend

- **0 modification de schéma de base de données** nécessaire.
- Le backend (`apps/backend`) reste la source de vérité unique pour les données utilisateur, les sphères, et les sessions Sphera IA.
