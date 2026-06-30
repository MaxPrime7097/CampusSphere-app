# CampusSphere V1

Plateforme collaborative étudiante — frontend React/Vite + backend Django/DRF avec authentification Supabase (email + OAuth), sphères de collaboration, ressources, tâches, messagerie, notifications et **Sphera** (assistant IA académique).

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Shadcn/UI |
| Backend | Django 5.2, Django REST Framework, Simple JWT |
| Auth | Supabase Auth (email/password + Google/Facebook OAuth) |
| Base de données | PostgreSQL (prod) / SQLite (dev) |
| Déploiement | Vercel (frontend) + Render (backend) |
| IA (Sphera) | Claude Haiku → Gemini Flash → Groq Llama (fallback chain) |

## Structure du projet

```
CampusSphere/
├── frontend/
│   ├── src/sphera/        # Intégration Sphera dans l'app principale
│   └── sphera-app/        # Application Sphera standalone (Vite + React)
├── backend/
│   └── sphera/            # App Django : sessions IA, annales, Q&A
├── documentation/         # Documentation complète
├── SPHERA_DOCUMENTATION.md  # Docs techniques Sphera V2 (SSO, PDF, déploiement)
└── README.md
```

## Démarrage rapide

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Variables d'environnement
set SECRET_KEY=dev-secret-key
set DEBUG=True
set ALLOWED_HOSTS=localhost,127.0.0.1
set CORS_ALLOWED_ORIGINS=http://localhost:5173
set CSRF_TRUSTED_ORIGINS=http://localhost:5173

python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install

# Créer le fichier .env
echo VITE_API_URL=http://127.0.0.1:8000 > .env
echo VITE_SUPABASE_URL=https://your-project.supabase.co >> .env
echo VITE_SUPABASE_ANON_KEY=your-anon-key >> .env

npm run dev
```

## Documentation

Toute la documentation est dans le dossier [`documentation/`](./documentation/) :

| Fichier | Contenu |
|---------|---------|
| [ARCHITECTURE.md](./documentation/ARCHITECTURE.md) | Architecture technique, structure des dossiers, flux de données |
| [API.md](./documentation/API.md) | Référence complète des endpoints API |
| [COMPONENTS.md](./documentation/COMPONENTS.md) | Guide des composants frontend |
| [AUTH.md](./documentation/AUTH.md) | Flux d'authentification (email + OAuth) |
| [DEPLOYMENT.md](./documentation/DEPLOYMENT.md) | Guide de déploiement production |
| [IMPACT_POLICY.md](./documentation/IMPACT_POLICY.md) | Règles de calcul du score d'impact |
| [CACHE_POLICY.md](./documentation/CACHE_POLICY.md) | Politique de cache API |

Documentation Sphera :

| Fichier | Contenu |
|---------|---------|
| [SPHERA_DOCUMENTATION.md](./SPHERA_DOCUMENTATION.md) | Architecture SSO, moteur PDF, déploiement Sphera standalone |

## Endpoints API principaux

```
Auth:
  POST /api/users/auth/register/
  POST /api/users/auth/login/
  GET  /api/users/auth/me/
  POST /api/auth/refresh/
  POST /api/users/auth/supabase/exchange-token/
  POST /api/users/auth/supabase/complete-profile/

Ressources:
  /api/users/...
  /api/spheres/...
  /api/posts/...
  /api/resources/...
  /api/tasks/...
  /api/conversations/...
  /api/notifications/...

SpheraIA:
  POST /api/sphera/generate/from-resource/   # Générer fiche/quiz/flashcards depuis une ressource
  POST /api/sphera/generate/from-upload/     # Générer depuis un fichier uploadé
  POST /api/sphera/generate/annale/          # Corriger une annale
  GET  /api/sphera/sessions/                 # Mes sessions de révision
  GET  /api/sphera/sessions/<id>/            # Détails d'une session
  POST /api/sphera/sessions/<id>/ask/        # Q&A sur le cours
  GET  /api/sphera/sessions/<id>/suggestions/ # Suggestions de questions
  POST /api/sphera/sessions/<id>/share/      # Partager dans une sphère
  GET  /api/sphera/annales/                  # Mes sessions d'annales
  POST /api/sphera/annales/<id>/ask/         # Q&A sur l'annale
  POST /api/sphera/annales/<id>/share/       # Partager l'annale dans une sphère
  GET  /api/sphera/sphere/<id>/              # Sessions partagées dans une sphère
  GET  /api/sphera/sphere/<id>/annales/      # Annales partagées dans une sphère
  POST /api/sphera/guest/generate/           # Génération invité (sans auth, 5/h)

Santé:
  GET /api/health/
```

### Sphera Standalone

```bash
cd frontend/sphera-app
npm install
npm run dev
```

Variables `.env` requises :
```
VITE_API_URL=http://127.0.0.1:8000
```

Variables supplémentaires sur l'app principale pour activer le SSO :
```
VITE_SPHERA_STANDALONE_URL=http://localhost:4173
```
