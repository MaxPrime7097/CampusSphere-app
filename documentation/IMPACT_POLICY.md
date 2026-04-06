# Impact Policy

## Règles actives

| Événement | Points | Déclencheur |
|-----------|--------|-------------|
| Upload d'une ressource | **+5** | `resource.uploaded` — quand un utilisateur publie une ressource |
| Notation d'un post | **dynamique** | Quand un utilisateur note l'impact d'un post (valeur 1-5 envoyée par le frontend) |

## Implémentation backend

- `backend/users/impact_policy.py` — source de vérité
- `resources/serializers.py` — applique `RESOURCE_UPLOADED` (+5) à la création
- `posts/views.py` — applique `apply_impact_points(user, value)` sur `POST /api/posts/<id>/impact-rate/`

## Utilisation

```python
from users.impact_policy import apply_impact_event, apply_impact_points, RESOURCE_UPLOADED

# Upload ressource → +5 pts à l'auteur
apply_impact_event(user, RESOURCE_UPLOADED)

# Notation d'un post → points dynamiques (valeur de la note)
apply_impact_points(post.author, rating_value)
```

## Propositions d'évolution (à valider)

Ces règles sont pensées pour refléter l'**impact réel** sur la communauté :

| Événement | Points proposés | Justification |
|-----------|----------------|---------------|
| Ressource téléchargée par un autre | +1 | La ressource est utile à quelqu'un |
| Ressource sauvegardée par un autre | +1 | La ressource est jugée précieuse |
| Post noté avec impact élevé (≥4) | +3 | Le contenu a eu un impact fort |
| Tâche complétée dans une sphère | +2 | Contribution concrète à un projet |
| Commentaire reçu sur une ressource | +1 | La ressource génère de l'engagement |
| Première ressource uploadée | +10 | Bonus d'onboarding |
| Sphère créée avec 10+ membres | +5 | Création d'une communauté active |

> Ces règles favorisent les **contributions qui profitent aux autres** plutôt que la simple activité.
> Un utilisateur qui uploade des ressources très téléchargées gagne plus qu'un utilisateur qui poste beaucoup sans engagement.
