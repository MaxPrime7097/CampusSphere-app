# Politique d'architecture — Cache API

## Objectif
Éviter les incohérences de données côté client en gardant **des réponses fraîches** pour les flux sensibles au temps réel.

## Règle stricte
**Ne pas appliquer `@cache_page` (ni tout cache de réponse HTTP équivalent) sur les endpoints suivants :**

1. **Messagerie**
   - `/api/conversations/*`
   - `/messages/*`
2. **Notifications** (toutes les routes de notifications)
3. **Actions mutables** (création/modification d’état), par exemple :
   - `join`
   - `leave`
   - `save`
   - `like`
   - `mark-read`
   - et toute action similaire qui modifie l’état serveur
4. **Tout endpoint dépendant d’un état temps réel**
   - unread counts
   - présence/statut
   - fils de discussion actifs
   - compteurs d’interactions

## Exigence de fraîcheur
Les routes ci-dessus doivent toujours renvoyer des données à jour :
- pas de cache applicatif de page/réponse,
- pas de cache reverse proxy/CDN qui servirait une réponse périmée,
- invalider explicitement tout cache dérivé si nécessaire.

## Checklist anti-régression (PR Review)
- [ ] Aucune nouvelle route de messagerie/notifications n’utilise `@cache_page`.
- [ ] Aucune action mutable (`join`, `leave`, `save`, `like`, `mark-read`, etc.) n’est mise en cache.
- [ ] Les endpoints temps réel sont configurés en réponses fraîches uniquement.
- [ ] Si un cache est ajouté sur une route API, la justification d’architecture est documentée.

## Note d’implémentation
Pour ces endpoints sensibles, préférer des en-têtes HTTP orientés fraîcheur (ex: `Cache-Control: no-store`) et une stratégie d’invalidation ciblée plutôt qu’un cache de page.
