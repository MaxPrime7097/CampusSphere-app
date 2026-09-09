# Référence API CampusSphere

> **Statut : référence pratique, pas spécification.**
> Ce document est organisé par domaine et sert de survol rapide. Il a été écrit à l'époque du
> backend Django et n'a pas été réécrit route par route.
>
> **En cas de désaccord, [API_CONTRACT.md](./API_CONTRACT.md) fait autorité** : c'est la
> spécification exhaustive contre laquelle la suite de tests de contrat est écrite, et elle
> marque `[CHANGE]` chaque écart volontaire vis-à-vis du comportement Django. Pour savoir si une
> route existe et qui l'appelle, voir [API_INVENTORY.md](./API_INVENTORY.md).

Base URL : `http://127.0.0.1:3000` (dev) / `https://api.campussphere.app` (prod)

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

Format d'erreur :
```json
{
  "success": false,
  "error": "Message d'erreur",
  "detail": "Détails supplémentaires"
}
```

---

## Authentification

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/api/users/auth/register/` | Non | Inscription classique email/mdp |
| POST | `/api/users/auth/login/` | Non | Connexion email/mdp |
| GET | `/api/users/auth/me/` | Oui | Profil utilisateur actuel |
| POST | `/api/auth/refresh/` | Non | Rafraîchir le JWT |
| POST | `/api/users/auth/logout/` | Oui | Déconnexion (blacklist refresh token) |
| POST | `/api/users/auth/change-password/` | Oui | Changer le mot de passe |
| POST | `/api/users/auth/change-email/` | Oui | Changer l'email |
| DELETE | `/api/users/auth/delete-account/` | Oui | Supprimer le compte |
| POST | `/api/users/auth/password-reset/` | Non | Envoyer lien de reset mot de passe |
| POST | `/api/users/auth/supabase/exchange-token/` | Non | Échanger token Supabase → JWT applicatif |
| POST | `/api/users/auth/supabase/complete-profile/` | Oui | Compléter le profil après inscription |

### POST `/api/users/auth/supabase/exchange-token/`
```json
// Body
{ "access_token": "<supabase_access_token>" }

// Response
{
  "success": true,
  "data": {
    "tokens": { "accessToken": "...", "refreshToken": "..." },
    "user": { ... },
    "needs_profile_completion": true,
    "is_new_user": true
  }
}
```

### POST `/api/users/auth/supabase/complete-profile/`
Champs obligatoires : `username`, `university`, `faculty`, `study_year`, `student_id`
```json
// Body
{
  "username": "john_doe",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+237600000000",
  "date_of_birth": "2000-01-15",
  "university": "universite_yaounde_1",
  "faculty": "developpement_web",
  "study_year": "l3",
  "student_id": "21A001",
  "campus": "Campus Principal",
  "town": "Yaoundé",
  "language": "fr",
  "skills": ["React", "Python"],
  "interests": ["Programmation", "IA"],
  "previous_education": [{ "degree": "licence", "school": "...", "year": "2021" }],
  "experiences": [{ "title": "Dev", "company": "CampusSphere 🚀", "duration": "3 mois", "description": "..." }],
  "portfolio_links": [{ "name": "GitHub", "url": "https://github.com/..." }]
}
```

### POST `/api/auth/refresh/`
```json
// Body
{ "refresh": "<refresh_token>" }

// Response
{ "access": "<new_access_token>" }
```

---

## Utilisateurs

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/users/<id>/` | Non | Profil par ID |
| GET | `/api/users/by-username/<username>/` | Non | Profil par username |
| GET | `/api/users/profile/` | Oui | Mon profil complet |
| PATCH | `/api/users/profile/` | Oui | Modifier mon profil |
| GET | `/api/users/search/?q=<terme>` | Oui | Rechercher des utilisateurs |
| GET | `/api/users/privacy/` | Oui | Paramètres de confidentialité |
| PUT | `/api/users/privacy/` | Oui | Modifier la confidentialité |
| POST | `/api/users/data-export/` | Oui | Exporter ses données |
| GET | `/api/users/blocks/` | Oui | Liste des utilisateurs bloqués |
| POST | `/api/users/blocks/` | Oui | Bloquer un utilisateur |
| DELETE | `/api/users/blocks/<id>/` | Oui | Débloquer |

Champs protégés par la politique de confidentialité (non-connexions ne peuvent pas voir) :
`email`, `phone_number`, `date_of_birth`, `student_id`

### Connexions

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/users/<id>/connections/` | Oui | Connexions d'un utilisateur |
| GET | `/api/users/<id>/connection-relation/` | Oui | Relation avec un utilisateur |
| POST | `/api/users/<id>/connection-relation/` | Oui | Envoyer une demande de connexion |
| DELETE | `/api/users/<id>/connection-relation/` | Oui | Supprimer la connexion |

### GET `/api/users/<id>/connection-relation/` — Response
```json
{
  "success": true,
  "data": {
    "target_user_id": 42,
    "is_self": false,
    "is_connected": true,
    "can_connect": false,
    "can_disconnect": true,
    "connection": { "id": 7, "status": "accepted", ... }
  }
}
```

---

## Sphères

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/spheres/` | Oui | Liste des sphères |
| POST | `/api/spheres/` | Oui | Créer une sphère |
| GET | `/api/spheres/<id>/` | Oui | Détails d'une sphère |
| PUT | `/api/spheres/<id>/` | Oui | Modifier une sphère |
| DELETE | `/api/spheres/<id>/` | Oui | Supprimer une sphère |
| POST | `/api/spheres/<id>/join/` | Oui | Rejoindre (direct ou demande) |
| POST | `/api/spheres/<id>/leave/` | Oui | Quitter |
| DELETE | `/api/spheres/<id>/cancel-request/` | Oui | Annuler une demande en attente |
| GET | `/api/spheres/<id>/members/` | Oui | Liste des membres |
| POST | `/api/spheres/<id>/members/` | Oui | Ajouter un membre |
| PATCH | `/api/spheres/<id>/members/<id>/` | Oui | Modifier rôle/statut d'un membre |
| DELETE | `/api/spheres/<id>/members/<id>/` | Oui | Retirer un membre |
| GET | `/api/spheres/<id>/overview/` | Oui | Vue d'ensemble (stats, activité) |
| POST | `/api/spheres/<id>/banner/` | Oui | Upload/suppression bannière |
| GET | `/api/spheres/<id>/files/` | Oui | Fichiers de la sphère |
| POST | `/api/spheres/<id>/files/` | Oui | Upload fichier dans la sphère |
| DELETE | `/api/spheres/<id>/files/<id>/` | Oui | Supprimer un fichier |
| POST | `/api/spheres/<id>/extend-duration/` | Oui | Prolonger la durée |
| GET | `/api/spheres/user/spheres/` | Oui | Mes sphères (rejointes) |

### POST `/api/spheres/<id>/join/` — Response
```json
{
  "success": true,
  "data": {
    "status": "active",   // ou "pending" si approbation requise
    "message": "..."
  }
}
```

---

## Posts

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/posts/` | Oui | Feed de posts |
| POST | `/api/posts/` | Oui | Créer un post |
| GET | `/api/posts/<id>/` | Oui | Détails d'un post |
| PUT | `/api/posts/<id>/` | Oui | Modifier un post |
| DELETE | `/api/posts/<id>/` | Oui | Supprimer un post |
| POST | `/api/posts/<id>/like/` | Oui | Liker / unliker |
| POST | `/api/posts/<id>/save/` | Oui | Sauvegarder / retirer |
| POST | `/api/posts/<id>/pin/` | Oui | Épingler / désépingler |
| POST | `/api/posts/<id>/report/` | Oui | Signaler |
| POST | `/api/posts/<id>/impact-rate/` | Oui | Noter l'impact (1-5) |
| GET | `/api/posts/<id>/comments/` | Oui | Commentaires |
| POST | `/api/posts/<id>/comments/` | Oui | Commenter |
| PUT | `/api/posts/comments/<id>/` | Oui | Modifier un commentaire |
| DELETE | `/api/posts/comments/<id>/` | Oui | Supprimer un commentaire |
| POST | `/api/posts/comments/<id>/like/` | Oui | Liker un commentaire |
| GET | `/api/posts/user/<id>/` | Oui | Posts d'un utilisateur |
| GET | `/api/posts/sphere/<id>/` | Oui | Posts d'une sphère |
| GET | `/api/posts/saved/` | Oui | Posts sauvegardés |

### POST `/api/posts/<id>/impact-rate/`
Note l'impact d'un post. La note (1–5) est ajoutée au score d'impact de l'auteur du post.
```json
// Body
{ "value": 4 }

// Response
{ "success": true, "data": { "impact_score": 28 } }
```

---

## Ressources

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/resources/` | Oui | Liste des ressources |
| POST | `/api/resources/` | Oui | Upload ressource (`multipart/form-data`) |
| GET | `/api/resources/<id>/` | Oui | Détails |
| PUT | `/api/resources/<id>/` | Oui | Modifier titre/description |
| DELETE | `/api/resources/<id>/` | Oui | Supprimer |
| POST | `/api/resources/<id>/download/` | Oui | Télécharger (retourne le fichier binaire) |
| GET | `/api/resources/<id>/preview/` | Oui | URL de prévisualisation |
| POST | `/api/resources/<id>/save/` | Oui | Sauvegarder / retirer des favoris |
| POST | `/api/resources/<id>/report/` | Oui | Signaler |
| POST | `/api/resources/<id>/share/` | Oui | Tracker un partage (analytics) |
| GET | `/api/resources/saved/` | Oui | Ressources sauvegardées |
| GET | `/api/resources/user/<id>/` | Oui | Ressources d'un utilisateur |
| GET | `/api/resources/sphere/<id>/` | Oui | Ressources d'une sphère |

Upload d'une ressource déclenche automatiquement **+5 points d'impact** pour l'auteur.

### POST `/api/resources/` — Body (`multipart/form-data`)
```
file:        <fichier>
title:       "Cours React.js"
description: "Cours complet..."
subject:     "developpement_web"
type:        "cours"
visibility:  "public"
tags:        ["react","javascript"]
sphere:      <sphere_id>   (optionnel)
```

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
| POST | `/api/tasks/<id>/assign/` | Oui | Assigner à un membre |
| GET | `/api/tasks/sphere/<id>/` | Oui | Tâches d'une sphère |
| GET | `/api/tasks/user/` | Oui | Mes tâches |

### Statuts Kanban
`todo` → `in_progress` → `review` → `done`

### PATCH `/api/tasks/<id>/move/`
```json
// Body
{ "kanban_status": "in_progress" }
```

---

## Messagerie

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/conversations/` | Oui | Liste des conversations |
| POST | `/api/conversations/` | Oui | Créer une conversation |
| GET | `/api/conversations/<id>/` | Oui | Détails |
| PATCH | `/api/conversations/<id>/` | Oui | Renommer |
| DELETE | `/api/conversations/<id>/` | Oui | Supprimer |
| GET | `/api/conversations/<id>/messages/` | Oui | Messages (paginés) |
| POST | `/api/conversations/<id>/messages/` | Oui | Envoyer un message |
| PATCH | `/api/conversations/<id>/messages/<id>/` | Oui | Modifier un message |
| DELETE | `/api/conversations/<id>/messages/<id>/` | Oui | Supprimer un message |
| POST | `/api/conversations/<id>/read/` | Oui | Marquer comme lu |
| POST | `/api/conversations/<id>/unread/` | Oui | Marquer comme non lu |
| POST | `/api/conversations/<id>/leave/` | Oui | Quitter la conversation |
| POST | `/api/conversations/<id>/avatar/` | Oui | Upload avatar groupe |
| POST | `/api/conversations/private/create/` | Oui | Créer une conversation privée |
| POST | `/api/conversations/group/create/` | Oui | Créer un groupe |

Ces endpoints ne sont **jamais mis en cache** (données temps réel). Voir `CACHE_POLICY.md`.

### POST `/api/conversations/private/create/`
```json
// Body
{ "recipient_id": 42 }
```

### POST `/api/conversations/group/create/`
```json
// Body
{ "name": "Groupe TP React", "participant_ids": [2, 5, 8] }
```

---

## Notifications

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/notifications/` | Oui | Liste (paginée, filtrable) |
| GET | `/api/notifications/<id>/` | Oui | Détails |
| PUT | `/api/notifications/<id>/read/` | Oui | Marquer lue |
| DELETE | `/api/notifications/<id>/` | Oui | Supprimer |
| PUT | `/api/notifications/read-all/` | Oui | Tout marquer lu |
| GET | `/api/notifications/settings/` | Oui | Paramètres de notification |
| PUT | `/api/notifications/settings/` | Oui | Modifier les paramètres |
| GET | `/api/notifications/stats/` | Oui | Compteurs non lus |

Ces endpoints ne sont **jamais mis en cache**. Voir `CACHE_POLICY.md`.

### GET `/api/notifications/?read=unread&type=connection_request`
Paramètres de filtre : `read` (`all`/`read`/`unread`), `type`, `page`, `page_size`, `ordering`

---

## Sphera — Assistant IA académique

Base path : `/api/sphera/`
Rétrocompatibilité : les mêmes routes sont aussi accessibles sous `/api/study/`.

Sphera est l'assistante IA de CampusSphere. Elle génère des outils d'étude (fiches, quiz, flashcards) et des corrections d'annales à partir de fichiers PDF/DOCX/TXT, et permet un Q&A contextuel sur le contenu extrait.

Chaîne de fallback IA : **Claude Haiku → Gemini Flash → Groq Llama** (le premier provider disponible répond).

### V1 — Sessions de révision (Fiche / Quiz / Flashcards)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/api/sphera/generate/from-resource/` | Oui | Générer depuis une ressource existante |
| POST | `/api/sphera/generate/from-upload/` | Oui | Générer depuis un fichier uploadé |
| GET | `/api/sphera/sessions/` | Oui | Lister mes sessions de révision |
| GET | `/api/sphera/sessions/<id>/` | Oui | Détails d'une session |
| DELETE | `/api/sphera/sessions/<id>/` | Oui | Supprimer une session |
| PATCH | `/api/sphera/sessions/<id>/add-tool/` | Oui | Ajouter un outil à une session existante |
| GET | `/api/sphera/sessions/<id>/suggestions/` | Oui | Obtenir 4 suggestions de questions |
| POST | `/api/sphera/sessions/<id>/share/` | Oui | Partager (par lien ou dans une sphère) |
| DELETE | `/api/sphera/sessions/<id>/share/` | Oui | Désactiver le partage |
| GET | `/api/sphera/sphere/<sphere_id>/` | Oui | Sessions partagées dans une sphère |

#### POST `/api/sphera/generate/from-resource/`
```json
// Body
{
  "resource_id": 12,
  "tool_types": ["fiche", "quiz", "flashcards"]
}

// Response (201 ou 200 si cache)
{
  "success": true,
  "cached": false,
  "data": {
    "id": 7,
    "owner": 1,
    "owner_username": "john_doe",
    "resource": 12,
    "resource_title": "Cours React.js",
    "resource_file_url": "/media/resources/cours.pdf",
    "source_filename": "",
    "tool_types": ["fiche", "quiz"],
    "content": {
      "fiche": { "titre": "...", "resume": "...", "points_cles": [...], "definitions": [...], "formules": [...], "a_retenir": [...] },
      "quiz": { "titre": "...", "questions": [...] }
    },
    "qa_history": [],
    "has_qa": true,
    "is_shared": false,
    "shared_in_sphere": null,
    "sphere_name": null,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

Types d'outils valides : `"fiche"`, `"quiz"`, `"flashcards"`

Si une session identique (même `owner` + `resource` + `tool_types`) existe déjà, elle est retournée depuis le cache (`cached: true`) avec HTTP 200.

#### POST `/api/sphera/generate/from-upload/` — Body (`multipart/form-data`)
```
file:        <fichier PDF, DOCX ou TXT>
tool_types:  '["fiche","quiz"]'   (JSON string ou liste)
```
Un upload crée implicitement une ressource avec `visibility: "friends"` liée à la session.

#### PATCH `/api/sphera/sessions/<id>/add-tool/`
Ajoute un outil manquant à une session existante (réutilise le texte déjà extrait).
```json
// Body
{ "tool_type": "flashcards" }
```

#### GET `/api/sphera/sessions/<id>/suggestions/`
Génère et met en cache 4 questions de révision contextuelles sur le cours.
```json
// Response
{ "success": true, "data": { "suggestions": ["Question 1 ?", "Question 2 ?", "Question 3 ?", "Question 4 ?"] } }
```

#### POST `/api/sphera/sessions/<id>/share/`
```json
// Partage par lien uniquement
{}

// Partage dans une sphère
{ "sphere_id": 3 }
```
L'utilisateur doit être membre actif (ou créateur) de la sphère pour y partager.

---

### V2 — Q&A sur le cours

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/api/sphera/sessions/<id>/ask/` | Oui | Poser une question sur le cours |

#### POST `/api/sphera/sessions/<id>/ask/`
Répond à une question en se basant **exclusivement** sur le texte extrait du cours. Chaque échange est sauvegardé dans `qa_history`.
```json
// Body
{ "question": "Qu'est-ce qu'un hook React ?" }

// Response
{
  "success": true,
  "data": {
    "question": "Qu'est-ce qu'un hook React ?",
    "answer": "Un hook est une fonction spéciale qui...",
    "created_at": "2025-05-28T10:30:00Z"
  }
}
```

---

### V2 — Annales

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/api/sphera/generate/annale/` | Oui | Générer une correction d'annale |
| GET | `/api/sphera/annales/` | Oui | Lister mes sessions d'annales |
| GET | `/api/sphera/annales/<id>/` | Oui | Détails d'une annale |
| DELETE | `/api/sphera/annales/<id>/` | Oui | Supprimer une annale |
| POST | `/api/sphera/annales/<id>/ask/` | Oui | Q&A sur l'annale |
| POST | `/api/sphera/annales/<id>/share/` | Oui | Partager (par lien ou dans une sphère) |
| DELETE | `/api/sphera/annales/<id>/share/` | Oui | Désactiver le partage |
| GET | `/api/sphera/sphere/<sphere_id>/annales/` | Oui | Annales partagées dans une sphère |

#### POST `/api/sphera/generate/annale/` — Body (`multipart/form-data` ou JSON)
```
// Source de l'annale : l'un ou l'autre
file:              <fichier PDF, DOCX ou TXT>
resource_id:       <id d'une ressource existante>

// Mode de correction
mode:              "complete" | "rapide"   (défaut : "complete")

// Croisement avec un cours (optionnel)
cours_resource_id: <id d'une ressource cours>
```

Modes :
- `complete` — correction exhaustive avec explication détaillée par question
- `rapide` — réponse directe sans longues explications

Si `cours_resource_id` est fourni, la correction croise l'annale avec le cours et ajoute `source_cours` (référence de chapitre) dans chaque question.

Types de questions auto-détectés : `qcm`, `ouvert`, `code`, `preuve`

```json
// Response (201)
{
  "success": true,
  "data": {
    "id": 3,
    "owner": 1,
    "owner_username": "john_doe",
    "mode": "complete",
    "source_filename": "Examen_React_2024.pdf",
    "resource": null,
    "source_title": "Examen_React_2024.pdf",
    "resource_file_url": null,
    "cours_resource": null,
    "cours_title": null,
    "content": {
      "titre": "Examen React 2024",
      "sections": [
        {
          "nom": "Section A",
          "questions": [
            {
              "numero": "1",
              "enonce": "Qu'est-ce que JSX ?",
              "reponse": "JSX est une extension syntaxique...",
              "explication": "Cette extension permet de...",
              "type": "ouvert"
            }
          ]
        }
      ],
      "conseils_generaux": ["Relisez bien les hooks", "Pratiquez les composants fonctionnels"]
    },
    "qa_history": [],
    "is_shared": false,
    "shared_in_sphere": null,
    "sphere_name": null,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

### Mode invité — Génération sans auth

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/api/sphera/guest/generate/` | Non | Générer sans compte (non sauvegardé) |

Limité à **5 requêtes/heure par IP**. Le résultat n'est pas sauvegardé en base.

#### POST `/api/sphera/guest/generate/` — Body (`multipart/form-data`)
```
file:       <fichier PDF, DOCX ou TXT>
tool_type:  "fiche" | "quiz" | "flashcards" | "annale"
mode:       "complete" | "rapide"   (pour annale uniquement, optionnel)
```

```json
// Response (fiche/quiz/flashcards)
{
  "success": true,
  "tool_type": "fiche",
  "content": { "titre": "...", "resume": "...", ... }
}

// Response (annale)
{
  "success": true,
  "tool_type": "annale",
  "mode": "complete",
  "content": { "titre": "...", "sections": [...] }
}
```

---

### Structure du contenu Sphera

**Fiche (`content.fiche`)**
```json
{
  "titre": "Titre du cours",
  "resume": "Résumé exhaustif (3-4 paragraphes minimum)",
  "points_cles": ["Point 1", "Point 2"],
  "definitions": [{ "terme": "...", "definition": "..." }],
  "formules": ["formule ou concept abstrait"],
  "a_retenir": ["conseil de révision", "piège à éviter"]
}
```

**Quiz (`content.quiz`)**
```json
{
  "titre": "Quiz - Titre du cours",
  "questions": [
    {
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "bonne_reponse": "A",
      "explication": "Explication de la bonne réponse"
    }
  ]
}
```

**Flashcards (`content.flashcards`)**
```json
{
  "titre": "Flashcards - Titre du cours",
  "cartes": [
    { "recto": "Question ou terme", "verso": "Réponse ou définition complète" }
  ]
}
```

**Annale (`content`)**
```json
{
  "titre": "Titre de l'examen",
  "sections": [
    {
      "nom": "Section A",
      "questions": [
        {
          "numero": "1",
          "enonce": "L'énoncé de la question",
          "reponse": "Réponse complète",
          "explication": "Raisonnement détaillé",
          "source_cours": "Chapitre 3 — Hooks",
          "type": "qcm|ouvert|code|preuve"
        }
      ]
    }
  ],
  "conseils_generaux": ["Conseil 1", "Conseil 2"]
}
```
Note : `source_cours` n'est présent que si un `cours_resource_id` a été fourni.

---

## Santé

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/health/` | Non | État du serveur |

```json
// Response
{ "status": "ok", "timestamp": "..." }
```

---

## Codes HTTP

| Code | Signification |
|------|--------------|
| 200 | Succès |
| 201 | Créé |
| 204 | Supprimé (pas de contenu) |
| 400 | Requête invalide / données manquantes |
| 401 | Non authentifié (token manquant ou expiré) |
| 403 | Non autorisé (permissions insuffisantes) |
| 404 | Ressource introuvable |
| 409 | Conflit (ex : email déjà utilisé) |
| 429 | Trop de requêtes (rate limiting) |
| 500 | Erreur serveur interne |
