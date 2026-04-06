# Documentation CampusSphere

## Index

| Fichier | Description |
|---------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Structure du projet, modèle de données, routing, variables d'environnement |
| [AUTH.md](./AUTH.md) | Flux d'authentification email et OAuth, endpoints Supabase, is_profile_complete |
| [API.md](./API.md) | Référence complète de tous les endpoints REST |
| [COMPONENTS.md](./COMPONENTS.md) | Guide des composants frontend (combobox, modales, pages, hooks) |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Déploiement Vercel + Render, configuration Supabase, checklist |
| [IMPACT_POLICY.md](./IMPACT_POLICY.md) | Règles de calcul du score d'impact utilisateur |
| [CACHE_POLICY.md](./CACHE_POLICY.md) | Politique de cache API backend |

## Démarrage rapide

Voir le [README principal](../README.md) pour les commandes de démarrage local.

## Points clés de l'architecture

- **Auth** : Supabase Auth → échange de token → JWT Django
- **Inscription** : 3 étapes (email) ou 3 étapes sans mdp (OAuth), `is_profile_complete` garantit la complétion
- **Combobox** : Tous les champs de sélection utilisent des combobox avec suggestions (université, filière, niveau, compétences, etc.)
- **API** : Toutes les fonctions dans `frontend/src/services/api.ts`
- **Normalisation** : `normalizeUser/Sphere/Post/Resource()` pour harmoniser camelCase/snake_case
