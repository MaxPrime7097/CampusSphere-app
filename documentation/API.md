# Référence API CampusSphere

Base URL : `http://127.0.0.1:8000` (dev) / `https://your-backend.onrender.com` (prod)

Toutes les requêtes authentifiées nécessitent :
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Format de réponse standard :
```json
{
  "success": true,
  "data": { ... },
  "message": "...",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Authentification

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/api/users/auth/register/` | Non | Inscription classique |
| POST | `/api/users/auth/login/` | Non | Connexion email/mdp |
| GET | `/api/users/auth/me/` | Oui | Profil utilisateur actuel |
| POST | `/api/auth/refresh/` | Non | Rafraîchir le token |
| POST | `/api/users/auth/logout/` | Oui | Déconnexion |
| POST | `/api/users/auth/change-password/` | Oui | Changer le mot de passe |
| POST | `/api/users/auth/change-email/` | Oui | Changer l'email |
| DELETE | `/api/users/auth/delete-account/` | Oui | Supprimer le compte |
| POST | `/api/users/auth/password-reset/` | Non | Réinitialiser le mot de passe |
| POST | `/api/users/auth/supabase/exchange-token/` | Non | Échanger token Supabase → JWT Django |
| POST | `/api/users/auth/supabase/complete-profile/` | Oui | Compléter le profil après OAuth |

---

## Utilisateurs

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/users/<id>/` | Non | Profil par ID |
| GET | `/api/users/by-username/<username>/` | Non | Profil par username |
| GET/PATCH | `/api/users/profile/` | Oui | Voir/modifier son profil |
| GET | `/api/users/search/?q=...` | Oui | Rechercher des utilisateurs |
| GET/PUT | `/api/users/privacy/` | Oui | Paramètres de confidentialité |
| POST | `/api/users/data-export/` | Oui | Exporter ses données |
| GET/POST | `/api/users/blocks/` | Oui | Liste des blocages / bloquer |
| DELETE | `/api/users/blocks/<id>/` | Oui | Débloquer |

### Connexions

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/users/<id>/connections/` | Oui | Connexions d'un utilisateur |
| GET | `/api/users/<id>/connection-relation/` | Oui | Relation avec un utilisateur |
| POST | `/api/users/<id>/connection-relation/` | Oui | Se connecter |
| DELETE | `/api/users/<id>/connection-relation/` | Oui | Se déconnecter |

---

## Sphères

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/spheres/` | Oui | Liste des sphères |
| POST | `/api/spheres/` | Oui | Créer une sphère |
| GET | `/api/spheres/<id>/` | Oui | Détails d'une sphère |
| PUT | `/api/spheres/<id>/` | Oui | Modifier une sphère |
| DELETE | `/api/spheres/<id>/` | Oui | Supprimer une sphère |
| POST | `/api/spheres/<id>/join/` | Oui | Rejoindre |
| POST | `/api/spheres/<id>/leave/` | Oui | Quitter |
| DELETE | `/api/spheres/<id>/cancel-request/` | Oui | Annuler une demande |
| GET | `/api/spheres/<id>/members/` | Oui | Membres |
| POST | `/api/spheres/<id>/members/` | Oui | Ajouter un membre |
| PATCH | `/api/spheres/<id>/members/<id>/` | Oui | Modifier un membre |
| DELETE | `/api/spheres/<id>/members/<id>/` | Oui | Retirer un membre |
| GET | `/api/spheres/<id>/overview/` | Oui | Vue d'ensemble |
| POST | `/api/spheres/<id>/banner/` | Oui | Upload bannière |
| GET | `/api/spheres/<id>/files/` | Oui | Fichiers de la sphère |
| POST | `/api/spheres/<id>/files/` | Oui | Upload fichier |
| DELETE | `/api/spheres/<id>/files/<id>/` | Oui | Supprimer fichier |
| POST | `/api/spheres/<id>/extend-duration/` | Oui | Prolonger la durée |
| GET | `/api/spheres/user/spheres/` | Oui | Mes sphères |

---

## Posts

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/posts/` | Oui | Feed de posts |
| POST | `/api/posts/` | Oui | Créer un post |
| GET | `/api/posts/<id>/` | Oui | Détails d'un post |
| PUT | `/api/posts/<id>/` | Oui | Modifier un post |
| DELETE | `/api/posts/<id>/` | Oui | Supprimer un post |
| POST | `/api/posts/<id>/like/` | Oui | Liker/unliker |
| POST | `/api/posts/<id>/save/` | Oui | Sauvegarder |
| POST | `/api/posts/<id>/pin/` | Oui | Épingler |
| POST | `/api/posts/<id>/report/` | Oui | Signaler |
| POST | `/api/posts/<id>/impact-rate/` | Oui | Noter l'impact |
| GET | `/api/posts/<id>/comments/` | Oui | Commentaires |
| POST | `/api/posts/<id>/comments/` | Oui | Commenter |
| PUT | `/api/posts/comments/<id>/` | Oui | Modifier commentaire |
| DELETE | `/api/posts/comments/<id>/` | Oui | Supprimer commentaire |
| POST | `/api/posts/comments/<id>/like/` | Oui | Liker commentaire |
| GET | `/api/posts/user/<id>/` | Oui | Posts d'un utilisateur |
| GET | `/api/posts/sphere/<id>/` | Oui | Posts d'une sphère |
| GET | `/api/posts/saved/` | Oui | Posts sauvegardés |

---

## Ressources

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/resources/` | Oui | Liste des ressources |
| POST | `/api/resources/` | Oui | Upload ressource (multipart) |
| GET | `/api/resources/<id>/` | Oui | Détails |
| PUT | `/api/resources/<id>/` | Oui | Modifier |
| DELETE | `/api/resources/<id>/` | Oui | Supprimer |
| POST | `/api/resources/<id>/download/` | Oui | Télécharger |
| GET | `/api/resources/<id>/preview/` | Oui | URL de prévisualisation |
| POST | `/api/resources/<id>/save/` | Oui | Sauvegarder |
| POST | `/api/resources/<id>/report/` | Oui | Signaler |
| POST | `/api/resources/<id>/share/` | Oui | Tracker un partage |
| GET | `/api/resources/saved/` | Oui | Ressources sauvegardées |
| GET | `/api/resources/user/<id>/` | Oui | Ressources d'un utilisateur |
| GET | `/api/resources/sphere/<id>/` | Oui | Ressources d'une sphère |

---

## Tâches

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/tasks/` | Oui | Liste des tâches |
| POST | `/api/tasks/` | Oui | Créer une tâche |
| GET | `/api/tasks/<id>/` | Oui | Détails |
| PUT | `/api/tasks/<id>/` | Oui | Modifier |
| DELETE | `/api/tasks/<id>/` | Oui | Supprimer |
| POST | `/api/tasks/<id>/complete/` | Oui | Marquer terminée |
| PATCH | `/api/tasks/<id>/move/` | Oui | Déplacer dans le Kanban |
| POST | `/api/tasks/<id>/assign/` | Oui | Assigner |
| GET | `/api/tasks/sphere/<id>/` | Oui | Tâches d'une sphère |
| GET | `/api/tasks/user/` | Oui | Mes tâches |

---

## Messagerie

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/conversations/` | Oui | Liste des conversations |
| POST | `/api/conversations/` | Oui | Créer une conversation |
| GET | `/api/conversations/<id>/` | Oui | Détails |
| PATCH | `/api/conversations/<id>/` | Oui | Renommer |
| DELETE | `/api/conversations/<id>/` | Oui | Supprimer |
| GET | `/api/conversations/<id>/messages/` | Oui | Messages |
| POST | `/api/conversations/<id>/messages/` | Oui | Envoyer un message |
| PATCH | `/api/conversations/<id>/messages/<id>/` | Oui | Modifier message |
| DELETE | `/api/conversations/<id>/messages/<id>/` | Oui | Supprimer message |
| POST | `/api/conversations/<id>/read/` | Oui | Marquer lu |
| POST | `/api/conversations/<id>/unread/` | Oui | Marquer non lu |
| POST | `/api/conversations/<id>/leave/` | Oui | Quitter |
| POST | `/api/conversations/<id>/avatar/` | Oui | Upload avatar groupe |
| POST | `/api/conversations/private/create/` | Oui | Créer conversation privée |
| POST | `/api/conversations/group/create/` | Oui | Créer groupe |

---

## Notifications

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/notifications/` | Oui | Liste des notifications |
| GET | `/api/notifications/<id>/` | Oui | Détails |
| PUT | `/api/notifications/<id>/read/` | Oui | Marquer lue |
| DELETE | `/api/notifications/<id>/` | Oui | Supprimer |
| PUT | `/api/notifications/read-all/` | Oui | Tout marquer lu |
| GET | `/api/notifications/settings/` | Oui | Paramètres |
| PUT | `/api/notifications/settings/` | Oui | Modifier paramètres |
| GET | `/api/notifications/stats/` | Oui | Statistiques |

---

## Santé

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/health/` | Non | État du serveur |

---

## Codes d'erreur

| Code | Signification |
|------|--------------|
| 200 | Succès |
| 201 | Créé |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Ressource introuvable |
| 409 | Conflit (ex: email déjà utilisé) |
| 429 | Trop de requêtes (rate limiting) |
| 500 | Erreur serveur |

Format d'erreur :
```json
{
  "success": false,
  "error": "Message d'erreur",
  "detail": "Détails supplémentaires"
}
```
