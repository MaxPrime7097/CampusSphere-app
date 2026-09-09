# CampusSphere V1

Plateforme collaborative étudiante — frontend React/Vite + backend Node/Express avec authentification Supabase (email + OAuth), sphères de collaboration, ressources, tâches, messagerie, notifications et **Sphera** (assistant IA académique).

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Shadcn/UI |
| Backend | Node 22, Express 5, TypeScript (ESM), Prisma 5 |
| Auth | Supabase Auth (email/password + Google/Facebook OAuth) → JWT applicatif |
| Base de données | PostgreSQL (Supabase, via le pooler Supavisor) |
| État partagé | Redis — diffusion WebSocket, rate limiting, élection des jobs |
| Temps réel | WebSocket natif (`ws`) sur le même écouteur HTTP |
| Stockage | S3 (`USE_S3=true` obligatoire en production) |
| Déploiement | Vercel (frontend) + Render (backend, conteneur Docker) |
| IA (Sphera) | Claude Haiku → Gemini Flash → Groq Llama (fallback chain) |

## Structure du projet

```
CampusSphere/
├── frontend/
│   ├── src/sphera/        # Intégration Sphera dans l'app principale
│   └── sphera-app/        # Application Sphera standalone (Vite + React)
├── backend/               # API Node/Express + TypeScript (Prisma, PostgreSQL)
│   ├── prisma/            # Schéma de base de données
│   ├── src/               # Application Express
│   └── tests/contract/    # Suite de tests de contrat (boîte noire, HTTP)
├── legacy/
│   └── django-backend/    # Ancien backend Django — référence, non déployé
├── documentation/         # Documentation complète
├── SPHERA_DOCUMENTATION.md  # Docs techniques Sphera V2 (SSO, PDF, déploiement)
└── README.md
```

> **Migration Django → Node/Express : terminée sur cette branche, pas encore déployée.**
> `backend/` est l'implémentation courante ; l'ancienne est conservée sous
> `legacy/django-backend/` comme référence comportementale. Les 143 routes sont portées,
> la suite de contrat passe, et le chemin de déploiement (`./backend`) est inchangé — le
> service Render, son URL, son plan et son health check restent identiques.
>
> Trois variables doivent être renseignées avant le premier déploiement Node : `DIRECT_URL`,
> `REDIS_URL` (ou `SINGLE_INSTANCE=true`) et `USE_S3=true`. Le serveur **refuse de démarrer**
> sans elles. Voir [DEPLOYMENT.md](./documentation/DEPLOYMENT.md) §2bis.
>
> Voir [API_CONTRACT.md](./documentation/API_CONTRACT.md) et
> [API_INVENTORY.md](./documentation/API_INVENTORY.md).

## Démarrage rapide

### Backend

```bash
cd backend
cp .env.example .env           # renseigner au minimum DATABASE_URL
npm install
npx prisma generate
npx prisma migrate deploy      # jamais `migrate dev` — voir backend/README.md
npm run dev                    # http://127.0.0.1:3000
```

Redis est optionnel en local (`REDIS_URL=redis://127.0.0.1:6379`) mais **obligatoire en
production** : il porte la diffusion WebSocket entre instances, les compteurs de
rate limiting et l'élection des tâches planifiées. Sans lui le serveur refuse de démarrer
en production — à moins de poser explicitement `SINGLE_INSTANCE=true`, qui n'est correct
que pour exactement une instance. Détails dans [backend/README.md](./backend/README.md).

L'ancien backend Django reste exécutable depuis `legacy/django-backend/` pour comparaison.

### Frontend

```bash
cd frontend
npm install

# Créer le fichier .env
echo VITE_API_URL=http://127.0.0.1:3000 > .env
echo VITE_SUPABASE_URL=https://your-project.supabase.co >> .env
echo VITE_SUPABASE_ANON_KEY=your-anon-key >> .env

npm run dev
```

> `VITE_API_URL` doit **toujours** être défini, en local comme en production. Sans lui le
> frontend devine l'URL du backend d'après le hostname, et son repli local pointe sur
> `127.0.0.1:8000` — le port de Django, pas celui du backend Node (`3000`). En production,
> utiliser `https://api.campussphere.app`. Voir
> [FRONTEND_CHANGES.md](./documentation/FRONTEND_CHANGES.md) `FE-10`.

## Documentation

Toute la documentation est dans le dossier [`documentation/`](./documentation/) :

| Fichier | Contenu |
|---------|---------|
| [ARCHITECTURE.md](./documentation/ARCHITECTURE.md) | Architecture technique, structure des dossiers, flux de données |
| [API.md](./documentation/API.md) | Référence complète des endpoints API |
| [COMPONENTS.md](./documentation/COMPONENTS.md) | Guide des composants frontend |
| [AUTH.md](./documentation/AUTH.md) | Flux d'authentification (email + OAuth) |
| [DEPLOYMENT.md](./documentation/DEPLOYMENT.md) | Guide de déploiement production : variables Render, Redis, checklist |
| [API_CONTRACT.md](./documentation/API_CONTRACT.md) | **Spécification faisant autorité** : formes des requêtes/réponses, écarts marqués `[CHANGE]` (en anglais) |
| [API_INVENTORY.md](./documentation/API_INVENTORY.md) | Les 143 routes, leur statut et leurs appelants (en anglais) |
| [FRONTEND_CHANGES.md](./documentation/FRONTEND_CHANGES.md) | Ce que le frontend doit adapter (`FE-01` … `FE-10`, en anglais) |
| [backend/README.md](./backend/README.md) | Backend Node : exécution, scale-out, jobs, tests |
| [IMPACT_POLICY.md](./documentation/IMPACT_POLICY.md) | Règles de calcul du score d'impact |
| [CACHE_POLICY.md](./documentation/CACHE_POLICY.md) | Politique de cache API |

Documentation Sphera :

| Fichier | Contenu |
|---------|---------|
| [SPHERA_DOCUMENTATION.md](./SPHERA_DOCUMENTATION.md) | Architecture SSO, moteur PDF, déploiement Sphera standalone |

## Endpoints API principaux

```
Auth:
  POST /api/users/auth/register/
  POST /api/users/auth/login/
  GET  /api/users/auth/me/
  POST /api/auth/refresh/
  POST /api/users/auth/supabase/exchange-token/
  POST /api/users/auth/supabase/complete-profile/

Ressources:
  /api/users/...
  /api/spheres/...
  /api/posts/...
  /api/resources/...
  /api/tasks/...
  /api/conversations/...
  /api/notifications/...

SpheraIA:
  POST /api/sphera/generate/from-resource/   # Générer fiche/quiz/flashcards depuis une ressource
  POST /api/sphera/generate/from-upload/     # Générer depuis un fichier uploadé
  POST /api/sphera/generate/annale/          # Corriger une annale
  GET  /api/sphera/sessions/                 # Mes sessions de révision
  GET  /api/sphera/sessions/<id>/            # Détails d'une session
  POST /api/sphera/sessions/<id>/ask/        # Q&A sur le cours
  GET  /api/sphera/sessions/<id>/suggestions/ # Suggestions de questions
  POST /api/sphera/sessions/<id>/share/      # Partager dans une sphère
  GET  /api/sphera/annales/                  # Mes sessions d'annales
  POST /api/sphera/annales/<id>/ask/         # Q&A sur l'annale
  POST /api/sphera/annales/<id>/share/       # Partager l'annale dans une sphère
  GET  /api/sphera/sphere/<id>/              # Sessions partagées dans une sphère
  GET  /api/sphera/sphere/<id>/annales/      # Annales partagées dans une sphère
  POST /api/sphera/guest/generate/           # Génération invité (sans auth, 5/h)

Santé:
  GET /api/health/
```

### Sphera Standalone

```bash
cd frontend/sphera-app
npm install
npm run dev
```

Variables `.env` requises :
```
VITE_API_URL=http://127.0.0.1:3000
```

Variables supplémentaires sur l'app principale pour activer le SSO :
```
VITE_SPHERA_STANDALONE_URL=http://localhost:4173
```
