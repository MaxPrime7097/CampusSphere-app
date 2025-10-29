# 🔌 Spécification API CampusSphere

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification](#authentification)
3. [Utilisateurs](#utilisateurs)
4. [Sphères](#sphères)
5. [Posts](#posts)
6. [Ressources](#ressources)
7. [Tâches](#tâches)
8. [Messages](#messages)
9. [Notifications](#notifications)
10. [Upload de fichiers](#upload-de-fichiers)
11. [Codes d'erreur](#codes-derreur)
12. [Exemples de requêtes](#exemples-de-requêtes)

---

## 🎯 Vue d'ensemble

### Base URL
```
Production: https://api.campus-sphere.com
Development: http://localhost:3001
```

### Headers requis
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### Format des réponses
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Pagination
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🔐 Authentification

### POST /api/auth/register
**Description**: Inscription d'un nouvel utilisateur

**Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "university": "douala",
  "faculty": "informatique",
  "studyYear": "l3",
  "studentId": "2021001234",
  "campus": "Campus Principal",
  "town": "douala",
  "language": "fr"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "university": "douala",
      "faculty": "informatique",
      "studyYear": "l3",
      "impactScore": 0,
      "currentMood": "excited",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### POST /api/auth/login
**Description**: Connexion utilisateur

**Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### POST /api/auth/refresh
**Description**: Renouvellement du token d'accès

**Body**:
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

### POST /api/auth/logout
**Description**: Déconnexion utilisateur

**Headers**: `Authorization: Bearer <token>`

### GET /api/auth/me
**Description**: Récupération du profil utilisateur actuel

**Headers**: `Authorization: Bearer <token>`

---

## 👤 Utilisateurs

### GET /api/users/:id
**Description**: Récupération d'un utilisateur par ID

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "https://cdn.campus-sphere.com/avatars/uuid.jpg",
    "coverPhoto": "https://cdn.campus-sphere.com/covers/uuid.jpg",
    "bio": "Étudiant en informatique passionné par le développement web",
    "university": "douala",
    "faculty": "informatique",
    "studyYear": "l3",
    "studentId": "2021001234",
    "campus": "Campus Principal",
    "town": "douala",
    "language": "fr",
    "impactScore": 150,
    "currentMood": "motivated",
    "joinedSpheres": ["sphere1", "sphere2"],
    "connections": ["user1", "user2"],
    "skills": ["JavaScript", "React", "Node.js"],
    "interests": ["Développement", "IA", "Blockchain"],
    "previousEducation": [
      {
        "degree": "Baccalauréat",
        "school": "Lycée Technique",
        "year": "2020"
      }
    ],
    "experiences": [
      {
        "title": "Développeur Frontend",
        "company": "TechCorp",
        "duration": "2023 - Présent",
        "description": "Développement d'applications React"
      }
    ],
    "portfolioLinks": [
      {
        "name": "GitHub",
        "url": "https://github.com/johndoe"
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### PUT /api/users/:id
**Description**: Mise à jour du profil utilisateur

**Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Nouvelle bio",
  "university": "yaounde1",
  "faculty": "mathematiques",
  "studyYear": "m1",
  "skills": ["JavaScript", "Python", "Machine Learning"],
  "interests": ["IA", "Data Science", "Blockchain"]
}
```

### POST /api/users/:id/avatar
**Description**: Upload de l'avatar utilisateur

**Content-Type**: `multipart/form-data`

**Body**: `file` (image, max 5MB)

### POST /api/users/:id/cover
**Description**: Upload de la photo de couverture

**Content-Type**: `multipart/form-data`

**Body**: `file` (image, max 10MB)

### GET /api/users/:id/connections
**Description**: Liste des connexions utilisateur

**Query Parameters**:
- `page` (optional): Numéro de page (default: 1)
- `limit` (optional): Nombre d'éléments par page (default: 20)

### POST /api/users/:id/connections
**Description**: Ajouter une connexion

**Body**:
```json
{
  "targetUserId": "uuid"
}
```

### DELETE /api/users/:id/connections/:connectionId
**Description**: Supprimer une connexion

### GET /api/users/search
**Description**: Recherche d'utilisateurs

**Query Parameters**:
- `q`: Terme de recherche
- `university`: Filtrer par université
- `faculty`: Filtrer par filière
- `studyYear`: Filtrer par niveau d'études
- `page`: Numéro de page
- `limit`: Nombre d'éléments par page

---

## 🌐 Sphères

### GET /api/spheres
**Description**: Liste des sphères

**Query Parameters**:
- `category`: Filtrer par catégorie
- `type`: Filtrer par type
- `isPrivate`: Filtrer par visibilité
- `search`: Recherche par nom/description
- `page`: Numéro de page
- `limit`: Nombre d'éléments par page

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Développeurs Web",
      "description": "Sphère pour les développeurs web du Cameroun",
      "category": "academic",
      "type": "study",
      "color": "#10b981",
      "icon": "code",
      "isPrivate": false,
      "requireApproval": true,
      "memberCount": 45,
      "impactScore": 1200,
      "createdBy": {
        "id": "uuid",
        "firstName": "Admin",
        "lastName": "User",
        "username": "admin"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

### POST /api/spheres
**Description**: Création d'une nouvelle sphère

**Body**:
```json
{
  "name": "Développeurs Web",
  "description": "Sphère pour les développeurs web du Cameroun",
  "category": "academic",
  "type": "study",
  "color": "#10b981",
  "icon": "code",
  "isPrivate": false,
  "requireApproval": true,
  "objective": "Partager des connaissances en développement web",
  "targetAudience": "Étudiants en informatique",
  "duration": "permanent",
  "collaborationTypes": ["study", "projects"]
}
```

### GET /api/spheres/:id
**Description**: Détails d'une sphère

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Développeurs Web",
    "description": "Sphère pour les développeurs web du Cameroun",
    "category": "academic",
    "type": "study",
    "color": "#10b981",
    "icon": "code",
    "isPrivate": false,
    "requireApproval": true,
    "memberCount": 45,
    "impactScore": 1200,
    "createdBy": { ... },
    "members": [
      {
        "id": "uuid",
        "user": { ... },
        "role": "admin",
        "joinedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "recentActivity": [
      {
        "type": "post",
        "data": { ... },
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### PUT /api/spheres/:id
**Description**: Mise à jour d'une sphère

### DELETE /api/spheres/:id
**Description**: Suppression d'une sphère

### POST /api/spheres/:id/join
**Description**: Rejoindre une sphère

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "joined", // ou "pending" si approbation requise
    "message": "Vous avez rejoint la sphère avec succès"
  }
}
```

### POST /api/spheres/:id/leave
**Description**: Quitter une sphère

### GET /api/spheres/:id/members
**Description**: Liste des membres d'une sphère

**Query Parameters**:
- `role`: Filtrer par rôle (admin, moderator, member)
- `page`: Numéro de page
- `limit`: Nombre d'éléments par page

### POST /api/spheres/:id/members
**Description**: Ajouter un membre à une sphère

**Body**:
```json
{
  "userId": "uuid",
  "role": "member"
}
```

### DELETE /api/spheres/:id/members/:memberId
**Description**: Supprimer un membre d'une sphère

### GET /api/spheres/:id/posts
**Description**: Posts d'une sphère

### GET /api/spheres/:id/tasks
**Description**: Tâches d'une sphère

### GET /api/spheres/:id/resources
**Description**: Ressources d'une sphère

---

## 📝 Posts

### GET /api/posts
**Description**: Liste des posts

**Query Parameters**:
- `sphereId`: Filtrer par sphère
- `authorId`: Filtrer par auteur
- `category`: Filtrer par catégorie
- `subject`: Filtrer par matière
- `type`: Filtrer par type
- `tags`: Filtrer par tags
- `search`: Recherche dans le contenu
- `page`: Numéro de page
- `limit`: Nombre d'éléments par page

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "content": "Nouveau cours sur React disponible !",
      "author": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "username": "johndoe",
        "avatar": "https://cdn.campus-sphere.com/avatars/uuid.jpg"
      },
      "sphereId": "uuid",
      "sphere": {
        "id": "uuid",
        "name": "Développeurs Web"
      },
      "category": "academic",
      "visibility": "sphere",
      "subject": "informatique",
      "type": "cours",
      "audience": "Étudiants en informatique",
      "location": "Douala",
      "tags": ["react", "javascript", "frontend"],
      "files": [
        {
          "id": "uuid",
          "name": "cours-react.pdf",
          "url": "https://cdn.campus-sphere.com/files/uuid.pdf",
          "size": 2048576,
          "type": "application/pdf"
        }
      ],
      "allowComments": true,
      "likes": 15,
      "comments": 3,
      "impactScore": 25,
      "isPinned": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

### POST /api/posts
**Description**: Création d'un nouveau post

**Body**:
```json
{
  "content": "Nouveau cours sur React disponible !",
  "sphereId": "uuid",
  "category": "academic",
  "visibility": "sphere",
  "subject": "informatique",
  "type": "cours",
  "audience": "Étudiants en informatique",
  "location": "Douala",
  "tags": ["react", "javascript", "frontend"],
  "allowComments": true,
  "files": ["file_uuid_1", "file_uuid_2"]
}
```

### GET /api/posts/:id
**Description**: Détails d'un post

### PUT /api/posts/:id
**Description**: Mise à jour d'un post

### DELETE /api/posts/:id
**Description**: Suppression d'un post

### POST /api/posts/:id/like
**Description**: Liker/unliker un post

**Response**:
```json
{
  "success": true,
  "data": {
    "liked": true,
    "likesCount": 16
  }
}
```

### GET /api/posts/:id/comments
**Description**: Commentaires d'un post

### POST /api/posts/:id/comments
**Description**: Ajouter un commentaire

**Body**:
```json
{
  "content": "Excellent cours, merci pour le partage !"
}
```

### POST /api/posts/:id/pin
**Description**: Épingler/désépingler un post

---

## 📚 Ressources

### GET /api/resources
**Description**: Liste des ressources

**Query Parameters**:
- `authorId`: Filtrer par auteur
- `subject`: Filtrer par matière
- `type`: Filtrer par type
- `audience`: Filtrer par audience
- `tags`: Filtrer par tags
- `search`: Recherche dans le titre/description
- `page`: Numéro de page
- `limit`: Nombre d'éléments par page

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Cours complet React.js",
      "description": "Cours complet sur React.js pour débutants",
      "file": {
        "id": "uuid",
        "name": "cours-react.pdf",
        "url": "https://cdn.campus-sphere.com/files/uuid.pdf",
        "size": 2048576,
        "type": "application/pdf"
      },
      "author": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "username": "johndoe",
        "avatar": "https://cdn.campus-sphere.com/avatars/uuid.jpg"
      },
      "subject": "informatique",
      "type": "cours",
      "visibility": "public",
      "audience": "Étudiants en informatique",
      "tags": ["react", "javascript", "frontend"],
      "impactScore": 45,
      "stats": {
        "downloads": 120,
        "views": 350,
        "saves": 25
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

### POST /api/resources
**Description**: Upload d'une nouvelle ressource

**Content-Type**: `multipart/form-data`

**Body**:
```
file: <file>
title: "Cours complet React.js"
description: "Cours complet sur React.js pour débutants"
subject: "informatique"
type: "cours"
visibility: "public"
audience: "Étudiants en informatique"
tags: ["react", "javascript", "frontend"]
```

### GET /api/resources/:id
**Description**: Détails d'une ressource

### PUT /api/resources/:id
**Description**: Mise à jour d'une ressource

### DELETE /api/resources/:id
**Description**: Suppression d'une ressource

### POST /api/resources/:id/download
**Description**: Télécharger une ressource

**Response**: Fichier binaire

### POST /api/resources/:id/save
**Description**: Sauvegarder une ressource dans les favoris

### DELETE /api/resources/:id/save
**Description**: Supprimer une ressource des favoris

### POST /api/resources/:id/view
**Description**: Marquer une ressource comme vue

---

## ✅ Tâches

### GET /api/tasks
**Description**: Liste des tâches

**Query Parameters**:
- `sphereId`: Filtrer par sphère
- `assignedToId`: Filtrer par assigné
- `priority`: Filtrer par priorité
- `isCompleted`: Filtrer par statut
- `page`: Numéro de page
- `limit`: Nombre d'éléments par page

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Créer la documentation API",
      "description": "Rédiger la documentation complète de l'API",
      "assignedToId": "uuid",
      "assignedTo": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "username": "johndoe",
        "avatar": "https://cdn.campus-sphere.com/avatars/uuid.jpg"
      },
      "priority": "high",
      "dueDate": "2024-01-20T23:59:59Z",
      "isCompleted": false,
      "impactPoints": 10,
      "sphereId": "uuid",
      "sphere": {
        "id": "uuid",
        "name": "Développeurs Web"
      },
      "createdBy": { ... },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

### POST /api/tasks
**Description**: Création d'une nouvelle tâche

**Body**:
```json
{
  "title": "Créer la documentation API",
  "description": "Rédiger la documentation complète de l'API",
  "assignedToId": "uuid",
  "priority": "high",
  "dueDate": "2024-01-20T23:59:59Z",
  "impactPoints": 10,
  "sphereId": "uuid"
}
```

### GET /api/tasks/:id
**Description**: Détails d'une tâche

### PUT /api/tasks/:id
**Description**: Mise à jour d'une tâche

### DELETE /api/tasks/:id
**Description**: Suppression d'une tâche

### POST /api/tasks/:id/complete
**Description**: Marquer une tâche comme terminée

**Response**:
```json
{
  "success": true,
  "data": {
    "task": { ... },
    "impactPointsEarned": 10,
    "newImpactScore": 160
  }
}
```

### POST /api/tasks/:id/assign
**Description**: Assigner une tâche

**Body**:
```json
{
  "assignedToId": "uuid"
}
```

---

## 💬 Messages

### GET /api/conversations
**Description**: Liste des conversations

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "private", // ou "group"
      "name": "Conversation avec John Doe",
      "participants": [
        {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe",
          "username": "johndoe",
          "avatar": "https://cdn.campus-sphere.com/avatars/uuid.jpg"
        }
      ],
      "lastMessage": {
        "id": "uuid",
        "content": "Salut, comment ça va ?",
        "author": { ... },
        "createdAt": "2024-01-15T10:30:00Z"
      },
      "unreadCount": 2,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/conversations
**Description**: Créer une nouvelle conversation

**Body**:
```json
{
  "type": "private", // ou "group"
  "participantIds": ["uuid1", "uuid2"],
  "name": "Nom de la conversation" // optionnel pour les groupes
}
```

### GET /api/conversations/:id/messages
**Description**: Messages d'une conversation

**Query Parameters**:
- `page`: Numéro de page
- `limit`: Nombre d'éléments par page

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "content": "Salut, comment ça va ?",
      "author": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "username": "johndoe",
        "avatar": "https://cdn.campus-sphere.com/avatars/uuid.jpg"
      },
      "conversationId": "uuid",
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

### POST /api/conversations/:id/messages
**Description**: Envoyer un message

**Body**:
```json
{
  "content": "Salut, comment ça va ?"
}
```

### POST /api/conversations/:id/read
**Description**: Marquer les messages comme lus

---

## 🔔 Notifications

### GET /api/notifications
**Description**: Liste des notifications

**Query Parameters**:
- `type`: Filtrer par type
- `isRead`: Filtrer par statut de lecture
- `page`: Numéro de page
- `limit`: Nombre d'éléments par page

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "post_like",
      "title": "Nouveau like sur votre post",
      "message": "John Doe a aimé votre post 'Cours React'",
      "data": {
        "postId": "uuid",
        "userId": "uuid"
      },
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

### PUT /api/notifications/:id/read
**Description**: Marquer une notification comme lue

### DELETE /api/notifications/:id
**Description**: Supprimer une notification

### PUT /api/notifications/read-all
**Description**: Marquer toutes les notifications comme lues

---

## 📤 Upload de fichiers

### POST /api/upload
**Description**: Upload de fichiers

**Content-Type**: `multipart/form-data`

**Body**:
```
file: <file>
type: "avatar" | "cover" | "post" | "resource"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "original-filename.pdf",
    "url": "https://cdn.campus-sphere.com/files/uuid.pdf",
    "size": 2048576,
    "type": "application/pdf",
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

### DELETE /api/upload/:id
**Description**: Supprimer un fichier

---

## ❌ Codes d'erreur

### Codes HTTP
- `200`: Succès
- `201`: Créé avec succès
- `400`: Requête invalide
- `401`: Non authentifié
- `403`: Non autorisé
- `404`: Ressource non trouvée
- `409`: Conflit (ex: email déjà utilisé)
- `422`: Données de validation invalides
- `429`: Trop de requêtes
- `500`: Erreur serveur interne

### Format des erreurs
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Les données fournies sont invalides",
    "details": [
      {
        "field": "email",
        "message": "L'email doit être valide"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Codes d'erreur personnalisés
- `USER_NOT_FOUND`: Utilisateur non trouvé
- `SPHERE_NOT_FOUND`: Sphère non trouvée
- `POST_NOT_FOUND`: Post non trouvé
- `RESOURCE_NOT_FOUND`: Ressource non trouvée
- `TASK_NOT_FOUND`: Tâche non trouvée
- `CONVERSATION_NOT_FOUND`: Conversation non trouvée
- `NOTIFICATION_NOT_FOUND`: Notification non trouvée
- `FILE_TOO_LARGE`: Fichier trop volumineux
- `INVALID_FILE_TYPE`: Type de fichier invalide
- `ALREADY_MEMBER`: Déjà membre de la sphère
- `NOT_MEMBER`: Pas membre de la sphère
- `INSUFFICIENT_PERMISSIONS`: Permissions insuffisantes
- `VALIDATION_ERROR`: Erreur de validation
- `AUTHENTICATION_REQUIRED`: Authentification requise
- `INVALID_CREDENTIALS`: Identifiants invalides
- `EMAIL_ALREADY_EXISTS`: Email déjà utilisé
- `USERNAME_ALREADY_EXISTS`: Nom d'utilisateur déjà utilisé

---

## 💡 Exemples de requêtes

### Inscription complète
```bash
curl -X POST https://api.campus-sphere.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "university": "douala",
    "faculty": "informatique",
    "studyYear": "l3",
    "studentId": "2021001234",
    "campus": "Campus Principal",
    "town": "douala",
    "language": "fr"
  }'
```

### Création d'une sphère
```bash
curl -X POST https://api.campus-sphere.com/api/spheres \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Développeurs Web",
    "description": "Sphère pour les développeurs web du Cameroun",
    "category": "academic",
    "type": "study",
    "color": "#10b981",
    "icon": "code",
    "isPrivate": false,
    "requireApproval": true
  }'
```

### Création d'un post
```bash
curl -X POST https://api.campus-sphere.com/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "content": "Nouveau cours sur React disponible !",
    "sphereId": "uuid",
    "category": "academic",
    "visibility": "sphere",
    "subject": "informatique",
    "type": "cours",
    "audience": "Étudiants en informatique",
    "tags": ["react", "javascript", "frontend"],
    "allowComments": true
  }'
```

### Upload d'une ressource
```bash
curl -X POST https://api.campus-sphere.com/api/resources \
  -H "Authorization: Bearer <token>" \
  -F "file=@cours-react.pdf" \
  -F "title=Cours complet React.js" \
  -F "description=Cours complet sur React.js pour débutants" \
  -F "subject=informatique" \
  -F "type=cours" \
  -F "visibility=public" \
  -F "audience=Étudiants en informatique" \
  -F "tags=react,javascript,frontend"
```

### Création d'une tâche
```bash
curl -X POST https://api.campus-sphere.com/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Créer la documentation API",
    "description": "Rédiger la documentation complète de l'API",
    "assignedToId": "uuid",
    "priority": "high",
    "dueDate": "2024-01-20T23:59:59Z",
    "impactPoints": 10,
    "sphereId": "uuid"
  }'
```

---

## 🔧 Configuration Backend

### Variables d'environnement requises
```env
# Base de données
DATABASE_URL=postgresql://username:password@localhost:5432/campus_sphere
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=campus_sphere
DATABASE_USER=username
DATABASE_PASSWORD=password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Upload
UPLOAD_MAX_SIZE=52428800  # 50MB
UPLOAD_ALLOWED_TYPES=pdf,doc,docx,ppt,pptx,zip,jpg,jpeg,png,gif
UPLOAD_PATH=./uploads
CDN_URL=https://cdn.campus-sphere.com

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:3000,https://campus-sphere.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# WebSocket
WS_PORT=3002
```

### Structure de base de données recommandée
Voir la section "Structure de Base de Données" dans `DOCUMENTATION.md` pour le schéma SQL complet.

### Middleware recommandé
- **CORS**: Configuration des origines autorisées
- **Rate Limiting**: Limitation du nombre de requêtes
- **Helmet**: Sécurité des headers HTTP
- **Compression**: Compression des réponses
- **Logging**: Logs structurés avec Winston
- **Validation**: Validation des données avec Joi ou Zod
- **Authentication**: Middleware JWT
- **File Upload**: Multer pour l'upload de fichiers
- **Error Handling**: Gestion centralisée des erreurs

### Technologies recommandées
- **Node.js** avec **Express.js** ou **Fastify**
- **PostgreSQL** avec **Prisma** ou **TypeORM**
- **Redis** pour le cache et les sessions
- **JWT** pour l'authentification
- **Multer** pour l'upload de fichiers
- **Nodemailer** pour l'envoi d'emails
- **Socket.io** pour les WebSockets
- **Winston** pour les logs
- **Jest** pour les tests

Cette spécification API fournit tous les détails nécessaires pour implémenter le backend de CampusSphere. Chaque endpoint est documenté avec ses paramètres, réponses et exemples d'utilisation.
