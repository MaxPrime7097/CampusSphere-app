# CampusSphere Frontend (React/Vite)

<<<<<<< codex/analyze-code-and-provide-overall-status-ftifph
Frontend web de CampusSphere.
=======
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-org/campus-sphere)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5+-blue.svg)](https://www.typescriptlang.org/)
[![Quality Gates](https://img.shields.io/badge/quality%20gates-check%20%2B%20tests%20%2B%20build-informational)](#-quality-gates)
>>>>>>> main

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + composants UI
- React Router

## Installation & démarrage

```bash
npm install

<<<<<<< codex/analyze-code-and-provide-overall-status-ftifph
cat > .env << 'EOT'
VITE_API_URL=http://127.0.0.1:8000
VITE_APP_NAME=CampusSphere
VITE_APP_ENV=development
EOT
=======
# Démarrer le serveur de développement
npm run dev

# Build de production
npm run build
```

### Accès
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Documentation**: Voir les fichiers de documentation ci-dessous

## 📖 Documentation

### 📚 **Documentation Complète**
- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Documentation technique complète
- **[COMPONENTS_GUIDE.md](COMPONENTS_GUIDE.md)** - Guide des composants React
- **[API_SPECIFICATION.md](API_SPECIFICATION.md)** - Spécification API pour le backend
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Guide de déploiement et maintenance

### 🧩 **Composants Principaux**

#### **Composants de Formulaires**
- `UniversityCombobox` - Sélecteur d'universités camerounaises
- `FacultyCombobox` - Sélecteur de filières académiques
- `StudyLevelCombobox` - Sélecteur de niveaux d'études
- `CityCombobox` - Sélecteur de villes camerounaises
- `ProfessionCombobox` - Sélecteur de professions

#### **Composants de Modales**
- `CreateSpherePostModal` - Création de posts dans les sphères
- `UploadResourceModal` - Upload de ressources avec métadonnées
- `CreateTaskModal` - Création de tâches collaboratives
- `AddEducationModal` - Ajout de formations
- `AddExperienceModal` - Ajout d'expériences

#### **Composants de Layout**
- `AppLayout` - Layout principal responsive
- `MobileNavigation` - Navigation mobile avec 5 onglets
- `ProfileBubble` - Bulle de profil avec menu déroulant

### 🔌 **API Endpoints**

#### **Authentification**
```
POST /api/auth/register    # Inscription
POST /api/auth/login       # Connexion
POST /api/auth/refresh     # Renouvellement token
GET  /api/auth/me          # Profil utilisateur
```

#### **Sphères**
```
GET    /api/spheres        # Liste des sphères
POST   /api/spheres        # Création de sphère
GET    /api/spheres/:id    # Détails d'une sphère
POST   /api/spheres/:id/join # Rejoindre une sphère
```

#### **Posts & Ressources**
```
GET    /api/posts          # Liste des posts
POST   /api/posts          # Création de post
GET    /api/resources      # Liste des ressources
POST   /api/resources      # Upload de ressource
```

## 🏗️ Architecture Technique

### **Frontend**
- **React 18** + **TypeScript** + **Vite**
- **Shadcn/UI** + **Tailwind CSS** pour l'interface
- **React Router DOM** pour la navigation
- **Zod** pour la validation des formulaires
- **Lucide React** pour les icônes

### **Backend** (Implémenté)
- **Django 5.2** + **Django REST Framework**
- **JWT (Simple JWT)** pour l'authentification
- **PostgreSQL ou SQLite** selon l'environnement
- **Django Channels** (optionnel) pour le temps réel
- **Upload de fichiers** via endpoints DRF

### **Services Externes**
- **Cloudinary** pour le CDN et l'optimisation d'images
- **Sentry** pour le monitoring des erreurs
- **Vercel** pour le déploiement frontend
- **Railway/Heroku** pour le déploiement backend

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: < 640px
- **Tablette**: 640px - 768px
- **Desktop**: 768px - 1024px
- **Large**: 1024px+

### **Navigation**
- **Desktop**: Sidebar + TopBar
- **Mobile**: TopBar + Bottom Navigation (5 onglets)

## 🎨 Système de Design

### **Couleurs**
```css
--primary: #10b981        /* Vert CampusSphere */
--secondary: #f1f5f9      /* Gris clair */
--accent: #3b82f6         /* Bleu accent */
--background: #ffffff     /* Blanc */
--foreground: #0f172a     /* Noir */
```
>>>>>>> main

npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

<<<<<<< codex/analyze-code-and-provide-overall-status-ftifph
## Contrat API attendu
=======
## ⚡ Quick start réel (frontend + backend)

### 1) Backend (Django API)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Variables minimales pour démarrer en local
export SECRET_KEY=dev-secret-key
export DEBUG=True
export ALLOWED_HOSTS=localhost,127.0.0.1

python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### 2) Frontend (Vite + React)

```bash
cd frontend
npm install
echo "VITE_API_URL=http://127.0.0.1:8000" > .env
npm run dev
```

### 3) Vérifications rapides

```bash
# Backend
cd backend
SECRET_KEY=test DEBUG=True ALLOWED_HOSTS=localhost python manage.py check
SECRET_KEY=test DEBUG=True ALLOWED_HOSTS=localhost python manage.py test

# Frontend
cd frontend
npm run build
npm run lint
```

## ✅ Quality Gates

Le projet est considéré "vert" quand ces commandes passent:

```bash
# Backend
cd backend
SECRET_KEY=test DEBUG=True ALLOWED_HOSTS=localhost python manage.py check
SECRET_KEY=test DEBUG=True ALLOWED_HOSTS=localhost python manage.py test

# Frontend
cd frontend
npm run build
npm run lint
```

## 📊 Données Mock
>>>>>>> main

Le frontend consomme le backend Django via `VITE_API_URL`.

Auth:
- `POST /api/users/auth/register/`
- `POST /api/users/auth/login/`
- `GET /api/users/auth/me/`
- `POST /api/auth/refresh/`

Autres domaines:
- `/api/users/`
- `/api/spheres/`
- `/api/posts/`
- `/api/resources/`
- `/api/tasks/`
- `/api/conversations/`
- `/api/notifications/`

## Vérification avant prod

```bash
npm run build
npm run lint
```

## Déploiement

<<<<<<< codex/analyze-code-and-provide-overall-status-ftifph
Voir `../DEPLOYMENT.md` pour la procédure Vercel + Render complète.
=======
**CampusSphere** - Connecter, Partager, Grandir ensemble sur le campus camerounais 🎓✨
>>>>>>> main
