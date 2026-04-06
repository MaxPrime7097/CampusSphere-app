# CampusSphere V1

Plateforme collaborative étudiante — frontend React/Vite + backend Django/DRF avec authentification Supabase (email + OAuth), sphères de collaboration, ressources, tâches, messagerie et notifications.

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Shadcn/UI |
| Backend | Django 5.2, Django REST Framework, Simple JWT |
| Auth | Supabase Auth (email/password + Google/Facebook OAuth) |
| Base de données | PostgreSQL (prod) / SQLite (dev) |
| Déploiement | Vercel (frontend) + Render (backend) |

## Structure du projet

```
CampusSphere/
├── frontend/          # Application React/Vite
├── backend/           # API Django REST
├── documentation/     # Documentation complète
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

Santé:
  GET /api/health/
```
