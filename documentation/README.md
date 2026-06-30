# Documentation CampusSphere

## Index

| Fichier | Description |
|---------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Structure du projet, modèle de données, routing, variables d'environnement |
| [AUTH.md](./AUTH.md) | Flux d'authentification email et OAuth, endpoints Supabase, is_profile_complete, limites email |
| [API.md](./API.md) | Référence complète de tous les endpoints REST avec corps de requête/réponse |
| [COMPONENTS.md](./COMPONENTS.md) | Guide des composants frontend (combobox, modales, pages, hooks, services) |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Déploiement Vercel + Render, configuration Supabase, checklist production |
| [IMPACT_POLICY.md](./IMPACT_POLICY.md) | Règles actives du score d'impact + propositions d'évolution |
| [CACHE_POLICY.md](./CACHE_POLICY.md) | Politique de cache API — endpoints jamais mis en cache |

## Démarrage rapide

Voir le [README principal](../README.md) pour les commandes de démarrage local.

## Points clés de l'architecture

- **Auth** : Supabase Auth → échange de token → JWT Django
- **Inscription email** : 3 étapes sur `/register`, redirection après vérification email via `?verified=true`
- **Inscription OAuth** : Pas de mot de passe, redirection vers `/complete-profile` (3 étapes identiques)
- **Profil complet** : `is_profile_complete=True` requis pour accéder à l'app — garanti par `completeSupabaseProfile()`
- **Combobox** : Tous les champs de sélection utilisent des combobox avec suggestions (université, filière, niveau, entreprise, diplôme, compétences, intérêts…)
- **API** : Toutes les fonctions dans `frontend/src/services/api.ts` — jamais de `fetch` direct
- **Normalisation** : `normalizeUser/Sphere/Post/Resource()` pour harmoniser camelCase/snake_case
- **Impact score** : +5 à l'upload d'une ressource + notation dynamique des posts (1–5 pts)
