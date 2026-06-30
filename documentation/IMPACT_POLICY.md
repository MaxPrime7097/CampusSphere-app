# Impact Policy

Source de vérité backend : `backend/users/impact_policy.py`

## Règles actives

| Événement | Points | Déclencheur | Implémentation |
|-----------|--------|-------------|----------------|
| Upload d'une ressource | **+5** | `resource.uploaded` | `resources/serializers.py` → `apply_impact_event(user, RESOURCE_UPLOADED)` |
| Notation d'un post | **dynamique (1–5)** | Valeur envoyée par le frontend | `posts/views.py` → `apply_impact_points(post.author, rating_value)` |

## Utilisation backend

```python
from users.impact_policy import apply_impact_event, apply_impact_points, RESOURCE_UPLOADED

# Upload ressource → +5 pts à l'auteur
apply_impact_event(user, RESOURCE_UPLOADED)

# Notation d'un post → points dynamiques (valeur de la note, 1 à 5)
apply_impact_points(post.author, rating_value)
```

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
