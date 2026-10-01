# Documentation CampusSphere & Sphera

Ce dossier rassemble l'ensemble de la documentation technique, des spécifications d'architecture et des guides fonctionnels du monorepo.

---

## Index de la Documentation

### 1. Spécifications & Architecture Monorepo

| Fichier | Description |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Architecture monorepo, structure des dossiers (`apps/`, `packages/`), flux de données |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Déploiement multi-projets Vercel (`apps/campus`, `apps/sphera`) + Render (`apps/backend`) |
| [AUTH.md](./AUTH.md) | Flux d'authentification Supabase, JWT applicatif et handshake SSO cross-domain |
| [COMPONENTS.md](./COMPONENTS.md) | Guide des composants UI, package partagé `@cs/ui` et composants spécifiques |

### 2. Contrat d'API & Backend (Express / Prisma)

| Fichier | Description |
|---|---|
| [API_CONTRACT.md](./API_CONTRACT.md) | **Source de vérité** : forme des requêtes/réponses, erreurs, pagination, temps réel, jobs |
| [API_INVENTORY.md](./API_INVENTORY.md) | Inventaire des 143 routes backend, appelants frontend et statuts |
| [FRONTEND_CHANGES.md](./FRONTEND_CHANGES.md) | Adaptations frontend consommateur (`FE-01` … `FE-10`) |
| [API.md](./API.md) | Référence REST des endpoints |
| [CACHE_POLICY.md](./CACHE_POLICY.md) | Politique de cache API et endpoints sans cache |
| [IMPACT_POLICY.md](./IMPACT_POLICY.md) | Règles de calcul du score d'impact |
| [SUPABASE_EMAIL_LIMITS.md](./SUPABASE_EMAIL_LIMITS.md) | Gestion des quotas et limites d'envoi d'emails Supabase |

### 3. Spécifications Fonctionnelles & Fonctionnalités Clés (`documentation/features/`)

| Fichier | Description |
|---|---|
| [features/SPHERA_DOCUMENTATION.md](./features/SPHERA_DOCUMENTATION.md) | Architecture SSO Sphera, moteur PDF et mode standalone |
| [features/SPHERA_MINDMAP_AUDIO.md](./features/SPHERA_MINDMAP_AUDIO.md) | Spécifications des cartes mentales (React Flow) et résumés audio (TTS) |
| [features/SPHERA_PARAMETRES.md](./features/SPHERA_PARAMETRES.md) | Préférences utilisateur, mode d'étude et personnalisation Sphera |
| [features/QUIZ_MULTIJOUEUR.md](./features/QUIZ_MULTIJOUEUR.md) | Moteur de quiz multijoueur en temps réel (WebSockets / Redis) |
| [features/MODULE_EVENEMENTS.md](./features/MODULE_EVENEMENTS.md) | Module d'événements étudiants, billetterie et calendrier |
| [features/AI_ROUTING_FINAL.md](./features/AI_ROUTING_FINAL.md) | Routage intelligent des modèles IA (DeepSeek V3.2, Claude Haiku, Groq) |
| [features/BEDROCK_MIGRATION_CONTEXT.md](./features/BEDROCK_MIGRATION_CONTEXT.md) | Architecture et contexte d'intégration AWS Bedrock |

### 4. Contexte & Mémoire pour Agents IA

| Fichier | Description |
|---|---|
| [AI_CONTEXT.md](./AI_CONTEXT.md) | Journal d'historique technique, architecture et décisions pour les assistants IA |

### 5. Guides Développeur par Application

| Emplacement | Description |
|---|---|
| [../README.md](../README.md) | README racine du monorepo (commandes de dev, build, lint, test) |
| [../apps/backend/README.md](../apps/backend/README.md) | API Node/Express : migrations Prisma, Docker, jobs, tests de contrat |
| [../apps/campus/README.md](../apps/campus/README.md) | Frontend principal CampusSphere |
| [../apps/sphera/README.md](../apps/sphera/README.md) | Application d'apprentissage Sphera |

---

## Points Clés de l'Architecture Monorepo

- **Applications (`apps/`)** :
  - `apps/campus` (`@cs/campus`) : Plateforme collaborative et réseau social étudiant.
  - `apps/sphera` (`@cs/sphera`) : Espace d'étude interactif avec mindmaps, audio, quiz live.
  - `apps/backend` (`@cs/backend`) : API centrale commune Node 22 / Express 5 + Prisma.
- **Packages Partagés (`packages/`)** :
  - `packages/ui` (`@cs/ui`) : Design system unifié (Tailwind + Radix).
  - `packages/types` (`@cs/types`) : Modèles et contrats TypeScript canoniques.
  - `packages/api-client` (`@cs/api-client`) : Client HTTP typé avec auto-refresh token mutexé.
  - `packages/sso` (`@cs/sso`) : Handshake SSO sécurisé (postMessage iframe + popup).
- **Temps Réel & Jobs** : WebSocket natif sur l'API backend avec diffusion multi-instances via Redis.
- **Base de Données** : PostgreSQL (Supabase) via Prisma ORM avec zéro rupture de schéma.
