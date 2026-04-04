# Plan de migration Admin (legacy -> v2)

## Objectif

Basculer progressivement du dashboard legacy vers un panel v2 modulaire **sans régression fonctionnelle** ni rupture d'accès pour les administrateurs.

## Point d'entrée officiel

- Entrée unique: `/admin`
- Composant de routage central: `AdminPanelRouter`
- Règle de bascule:
  - `featureFlags.ADMIN_PANEL_V2 = false` -> rendu legacy (`/admin/legacy`)
  - `featureFlags.ADMIN_PANEL_V2 = true` -> redirection vers le panel v2 (`/admin/dashboard`)
- Les anciennes routes `/cs-inc/private/admin*` redirigent vers `/admin` pour compatibilité.

## Découpage des modules v2

Chaque module doit vivre sur une route isolée, sans imbriquer le dashboard legacy dans un composant v2.

- `/admin/dashboard` -> vue synthèse
- `/admin/users` -> gestion utilisateurs
- `/admin/moderation` -> signalements
- `/admin/spheres` -> gestion communautés
- `/admin/resources` -> validation ressources
- `/admin/logs` -> activités et audit

## Ordre de migration recommandé

1. **Users** (déjà prioritaire)
2. **Moderation**
3. **Spheres**
4. **Resources**
5. **Logs**
6. Retrait du legacy après validation complète

## Filet de sécurité anti-régression

Pour chaque module migré:

1. Vérifier chargement des données (loading/error/success)
2. Vérifier permissions admin (accès refusé hors rôle admin)
3. Vérifier navigation latérale + mobile
4. Vérifier liens profonds (`/admin/<module>`)
5. Vérifier redirections legacy -> `/admin`
6. Valider visuellement les états vides et erreurs API

## Critères de sortie (suppression legacy)

Le dashboard legacy peut être retiré uniquement si:

- tous les modules fonctionnels sont migrés sur `/admin/*`
- la parité API et permissions est validée
- les tests de navigation/routage sont verts
- aucun incident bloquant n'est observé en production durant la période de stabilisation
