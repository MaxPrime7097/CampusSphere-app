# Impact Policy

Source de vérité backend : [`backend/src/services/impact.ts`](../backend/src/services/impact.ts).
Le contrat est décrit dans [API_CONTRACT.md](./API_CONTRACT.md) §3.4.
L'implémentation Django d'origine reste consultable sous
`legacy/django-backend/users/impact_policy.py`.

## Règles actives

| Événement | Points | Déclencheur | Implémentation |
|-----------|--------|-------------|----------------|
| Upload d'une ressource | **+5** | Création d'une ressource | `applyImpactEvent(userId, "RESOURCE_UPLOADED")` |
| Notation d'un post | **dynamique (1–5)** | Valeur envoyée par le frontend | `recomputePostImpact(postId)` / `adjustPostImpact(postId, delta)` |

## Utilisation backend

```ts
import {
  applyImpactEvent,
  applyImpactDelta,
  recomputePostImpact,
} from "../services/impact.js";

// Upload ressource → +5 pts à l'auteur
await applyImpactEvent(userId, "RESOURCE_UPLOADED");

// Ajustement arbitraire (retrait d'une ressource, correction admin…)
await applyImpactDelta(userId, -5);

// Recalcul de l'impact d'un post à partir de la somme de ses notes
await recomputePostImpact(postId);
```

Chaque fonction accepte un `client` Prisma optionnel en dernier argument, afin de participer à
une transaction appelante plutôt que d'ouvrir la sienne. Le score d'un post est **recalculé par
agrégation** de ses notes plutôt qu'incrémenté au fil de l'eau : une note modifiée ou supprimée
ne peut donc pas laisser le total désynchronisé, ce qui était le cas côté Django.

## Ce qui n'est PAS inclus (intentionnellement)

Les règles suivantes ont été retirées pour garder le système simple et lisible :

| Événement retiré | Raison |
|-----------------|--------|
| Création de post | Favorise la quantité plutôt que la qualité |
| Création de commentaire | Difficile à mesurer l'impact réel |
| Téléchargement d'une ressource | Remplacé par la notation directe |
| Complétion de tâche | À réintégrer dans une phase future |

## Propositions d'évolution (à valider avant implémentation)

Ces règles sont pensées pour refléter l'**impact réel** sur la communauté :

| Événement | Points proposés | Justification |
|-----------|----------------|---------------|
| Ressource téléchargée par un autre | +1 | La ressource est concrètement utilisée |
| Ressource sauvegardée par un autre | +1 | La ressource est jugée précieuse |
| Post noté avec impact élevé (≥4) | +3 | Le contenu a eu un fort impact |
| Tâche complétée dans une sphère | +2 | Contribution concrète à un projet |
| Première ressource uploadée | +10 | Bonus d'onboarding |
| Sphère créée avec 10+ membres actifs | +5 | Création d'une communauté active |

> Le principe : favoriser les contributions qui **profitent réellement aux autres**, pas la simple activité.

## Frontend

L'impact score est affiché dans :
- La section profil (header)
- La card d'impact dans `/profile`

Il n'est **pas** affiché sur les cartes ressources ni dans la page détail d'une ressource.
