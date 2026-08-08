# Documentation CampusSphere

## Index

### Spécification du backend (anglais)

Écrites pendant la migration Django → Node/Express, ces trois-là font autorité sur le
comportement de l'API.

| Fichier | Description |
|---------|-------------|
| [API_CONTRACT.md](./API_CONTRACT.md) | **Source de vérité** : forme de chaque requête/réponse, codes d'erreur, pagination, temps réel, jobs, rate limits. Les écarts volontaires vis-à-vis de Django sont marqués `[CHANGE]` |
| [API_INVENTORY.md](./API_INVENTORY.md) | Les 143 routes, leur statut de portage et leurs appelants frontend |
| [FRONTEND_CHANGES.md](./FRONTEND_CHANGES.md) | Ce que le frontend doit adapter (`FE-01` … `FE-10`), et ce qui fonctionne sans modification |

### Guides projet (français)

| Fichier | Description |
|---------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Structure du projet, modèle de données, routing, variables d'environnement |
| [AUTH.md](./AUTH.md) | Flux d'authentification email et OAuth, endpoints Supabase, `is_profile_complete`, limites email |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Déploiement Vercel + Render, configuration Supabase, checklist production |
| [API.md](./API.md) | Référence REST héritée de Django — **superseded** par `API_CONTRACT.md` en cas de désaccord |
| [COMPONENTS.md](./COMPONENTS.md) | Guide des composants frontend (combobox, modales, pages, hooks, services) |
| [IMPACT_POLICY.md](./IMPACT_POLICY.md) | Règles actives du score d'impact + propositions d'évolution |
| [CACHE_POLICY.md](./CACHE_POLICY.md) | Politique de cache API — endpoints jamais mis en cache |
| [SUPABASE_EMAIL_LIMITS.md](./SUPABASE_EMAIL_LIMITS.md) | Ajuster les quotas d'envoi email Supabase |

### Hors de ce dossier

| Fichier | Description |
|---------|-------------|
| [../backend/README.md](../backend/README.md) | Backend Node : exécution, migrations Prisma, scale-out, jobs, suites de tests |
| [../SPHERA_DOCUMENTATION.md](../SPHERA_DOCUMENTATION.md) | Architecture SSO Sphera, moteur PDF, déploiement standalone |

## Démarrage rapide

Voir le [README principal](../README.md) pour les commandes de démarrage local.

## Points clés de l'architecture

- **Backend** : Node 22 + Express 5 + TypeScript (ESM), Prisma sur PostgreSQL (Supabase)
- **Auth** : Supabase Auth → échange de token → JWT applicatif signé par le backend
- **Inscription email** : 3 étapes sur `/register`, redirection après vérification email via `?verified=true`
- **Inscription OAuth** : Pas de mot de passe, redirection vers `/complete-profile` (3 étapes identiques)
- **Profil complet** : `is_profile_complete=true` requis pour accéder à l'app — calculé sur `university` + `faculty` + `study_year`
- **Temps réel** : WebSocket natif sur le même écouteur HTTP, diffusion inter-instances via Redis
- **Combobox** : Tous les champs de sélection utilisent des combobox avec suggestions (université, filière, niveau, entreprise, diplôme, compétences, intérêts…)
- **API** : Toutes les fonctions dans `frontend/src/services/api.ts` — jamais de `fetch` direct
- **Normalisation** : `normalizeUser/Sphere/Post/Resource()` pour harmoniser camelCase/snake_case
- **Impact score** : +5 à l'upload d'une ressource + notation dynamique des posts (1–5 pts)

## Conventions

Ces documents décrivent le backend **Node/Express** sous `backend/`. L'ancien backend Django est
conservé sous `legacy/django-backend/` à titre de référence comportementale et n'est plus déployé ;
quand un document y renvoie, c'est explicite.
