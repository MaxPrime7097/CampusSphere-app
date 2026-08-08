# Politique d'architecture — Cache API

## Objectif
Éviter les incohérences de données côté client en gardant **des réponses fraîches** pour les flux sensibles au temps réel.

## État de l'implémentation

Cette politique est **appliquée par le code**, et non plus seulement par revue. Le middleware
`noStore` de [`backend/src/middleware/trailingSlash.ts`](../backend/src/middleware/trailingSlash.ts)
est monté globalement et pose `Cache-Control: no-store` sur :

- tout chemin commençant par `/api/conversations` ou `/api/notifications` ;
- **toute** requête dont la méthode n'est ni `GET` ni `HEAD` — ce qui couvre par construction
  l'ensemble des actions mutables listées plus bas, sans énumération à maintenir.

Aucun cache de réponse n'est par ailleurs implémenté côté backend : il n'y a pas d'équivalent
Express de `@cache_page`, donc la règle ci-dessous encadre surtout ce qu'on pourrait **ajouter**.

## Règle stricte
**Ne pas mettre en cache (middleware applicatif, reverse proxy ou CDN) les endpoints suivants :**

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
- [ ] Aucune nouvelle route de messagerie/notifications n’est mise en cache.
- [ ] Aucune action mutable (`join`, `leave`, `save`, `like`, `mark-read`, etc.) n’est mise en cache.
- [ ] Les endpoints temps réel sont configurés en réponses fraîches uniquement.
- [ ] Si un cache est ajouté sur une route API, la justification d’architecture est documentée.
- [ ] Une nouvelle famille de routes temps réel qui ne vit pas sous `/api/conversations` ou
      `/api/notifications` est ajoutée au motif de `noStore` — sans quoi ses réponses `GET`
      ne portent aucun en-tête de fraîcheur.

## Note d’implémentation
Préférer des en-têtes HTTP orientés fraîcheur (`Cache-Control: no-store`) et une invalidation
ciblée plutôt qu’un cache de page. À noter : les réponses `GET` hors messagerie/notifications ne
portent aujourd’hui **aucun** en-tête `Cache-Control`, et héritent donc du comportement par
défaut des caches intermédiaires. C’est acceptable tant qu’aucun CDN n’est placé devant l’API ;
si cela change, il faudra une politique explicite pour ces routes.
