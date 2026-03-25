# 🎓 CampusSphere - Plateforme Collaborative Étudiante

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-org/campus-sphere)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5+-blue.svg)](https://www.typescriptlang.org/)
[![Quality Gates](https://img.shields.io/badge/quality%20gates-check%20%2B%20tests%20%2B%20build-informational)](#-quality-gates)

> **CampusSphere** est une plateforme collaborative destinée aux étudiants camerounais pour partager des ressources, collaborer dans des sphères thématiques, et créer des connexions académiques et professionnelles.

## 🌟 Fonctionnalités Principales

### 👥 **Sphères Collaboratives**
- Création et gestion de sphères thématiques
- Système de permissions (publiques, privées avec approbation)
- Chat intégré pour la collaboration en temps réel
- Système de tâches avec attribution et progression
- Partage de ressources au sein des sphères

### 📚 **Gestion des Ressources**
- Upload et partage de documents (PDF, DOC, PPT, ZIP)
- Système de tags et catégorisation
- Recherche avancée avec filtres
- Score d'impact basé sur les interactions
- Actions: Prévisualiser, Enregistrer, Télécharger

### 💬 **Communication**
- Feed principal avec posts et interactions
- Messagerie privée et de groupe
- Système de mentions et notifications
- Chat intégré dans les sphères

### 👤 **Profils Étudiants**
- Profils complets avec informations académiques
- Photo de couverture et avatar personnalisables
- Gestion des formations et expériences
- Score d'impact et mood du moment
- Système de connexions

### 🎯 **Système d'Impact**
- Points basés sur les contributions
- Création de posts: +10 pts
- Upload de ressources: +15 pts
- Completion de tâches: +5 pts
- Interactions et téléchargements: +1-2 pts

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- npm 9+
- Git

### Installation
```bash
# Cloner le repository
git clone https://github.com/your-org/campus-sphere.git
cd campus-sphere

# Installer les dépendances
npm install

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

### **Gradients**
```css
.campus-gradient {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
```

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev              # Serveur de développement
npm run build            # Build de production
npm run preview          # Preview du build

# Qualité du code
npm run lint             # Linting ESLint
npm run lint:fix         # Correction automatique

# Tests (à implémenter)
npm run test             # Tests unitaires
npm run test:coverage    # Tests avec couverture
```

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

L'application utilise des données mock pour la démonstration :

### **Utilisateurs**
- 50+ utilisateurs avec profils complets
- Universités camerounaises (13 principales)
- Filières académiques (29 domaines)
- Niveaux d'études (BTS, Licence, Master, Doctorat)

### **Sphères**
- Sphères publiques et privées
- Différentes catégories (Académique, Événement, Marketplace)
- Système de permissions et approbation

### **Ressources**
- Documents PDF, DOC, PPT, ZIP
- Métadonnées complètes (matière, type, audience)
- Système de tags et recherche

## 🚀 Déploiement

### **Frontend (Vercel)**
```bash
# Déploiement automatique
vercel --prod

# Variables d'environnement
VITE_API_URL=https://api.campus-sphere.com
VITE_APP_NAME=CampusSphere
```

### **Backend (Railway)**
```bash
# Déploiement
railway up

# Variables d'environnement
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
REDIS_URL=redis://...
```

## 🤝 Contribution

### **Structure du Projet**
```
src/
├── components/           # Composants réutilisables
│   ├── ui/              # Composants UI de base
│   ├── forms/           # Composants de formulaires
│   ├── layout/          # Composants de mise en page
│   ├── modals/          # Modales et dialogues
│   ├── feed/            # Composants du feed
│   └── chat/            # Composants de chat
├── pages/               # Pages principales
├── hooks/               # Hooks personnalisés
├── lib/                 # Utilitaires
└── styles/              # Styles CSS
```

### **Guidelines**
1. Utilisez TypeScript pour tous les nouveaux composants
2. Suivez les conventions de nommage (PascalCase pour les composants)
3. Documentez les props avec des interfaces TypeScript
4. Utilisez les composants Shadcn/UI existants
5. Respectez le système de design CampusSphere

## 📈 Roadmap

### **Phase 1 - MVP** ✅
- [x] Authentification et profils
- [x] Sphères collaboratives
- [x] Posts et ressources
- [x] Messagerie basique
- [x] Système d'impact score

### **Phase 2 - Améliorations** 🔄
- [ ] Notifications push
- [ ] Recherche avancée
- [ ] Système de recommandations
- [ ] Analytics utilisateur
- [ ] Mobile app (React Native)

### **Phase 3 - Fonctionnalités Avancées** 📅
- [ ] Calendrier d'événements
- [ ] Système de badges
- [ ] Marketplace étudiant
- [ ] Intégration universités
- [ ] API publique

## 🐛 Problèmes Connus

- Les modales de création de tâches et d'upload nécessitent des corrections
- Le système de notifications est en cours d'implémentation
- L'upload de fichiers nécessite une configuration backend

## 📞 Support

Pour toute question ou problème :
- **Issues**: [GitHub Issues](https://github.com/your-org/campus-sphere/issues)
- **Documentation**: Consultez les fichiers de documentation
- **Email**: support@campus-sphere.com

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **Shadcn/UI** pour les composants UI
- **Tailwind CSS** pour le système de design
- **Lucide React** pour les icônes
- **Vite** pour l'outil de build
- **React** pour le framework frontend

---

**CampusSphere** - Connecter, Partager, Grandir ensemble sur le campus camerounais 🎓✨
