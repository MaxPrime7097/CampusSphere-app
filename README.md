# CampusSphere V1

Plateforme collaborative étudiante (frontend React/Vite + backend Django/DRF) avec authentification JWT, sphères de collaboration, ressources, tâches, messagerie et notifications.

## Stack technique

- **Frontend**: React 18, TypeScript, Vite, Tailwind
- **Backend**: Django 5.2, Django REST Framework, Simple JWT
- **DB**: PostgreSQL (prod) / SQLite (dev fallback)
- **Fichiers**: Local disk (dev) ou AWS S3 (prod via `USE_S3=True`)
- **Infra cible**: Vercel (frontend) + Render (backend)

## Arborescence

- `frontend/` — Application web
- `backend/` — API Django
- `DEPLOYMENT.md` — Runbook de déploiement production
- `DEPLOY.md` — Raccourci vers le runbook
- `documentation/` — Guides complémentaires

## Démarrage local (rapide)

### 1) Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

export SECRET_KEY=dev-secret-key
export DEBUG=True
export ALLOWED_HOSTS=localhost,127.0.0.1
export CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173
export CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173

python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### 2) Frontend

```bash
cd frontend
npm install
cat > .env << 'EOT'
VITE_API_URL=http://127.0.0.1:8000
VITE_APP_NAME=CampusSphere
VITE_APP_ENV=development
EOT

npm run dev
```

## Vérifications qualité

```bash
# Backend
cd backend
SECRET_KEY=testkeyfortests12345678901234567890 DEBUG=True ALLOWED_HOSTS=localhost CORS_ALLOWED_ORIGINS=http://localhost:3000 CSRF_TRUSTED_ORIGINS=http://localhost:3000 python manage.py check
SECRET_KEY=testkeyfortests12345678901234567890 DEBUG=True ALLOWED_HOSTS=localhost CORS_ALLOWED_ORIGINS=http://localhost:3000 CSRF_TRUSTED_ORIGINS=http://localhost:3000 python manage.py test

# Frontend
cd frontend
npm run build
npm run lint
```

## Endpoints API principaux

- Auth:
  - `POST /api/users/auth/register/`
  - `POST /api/users/auth/login/`
  - `GET /api/users/auth/me/`
  - `POST /api/auth/refresh/`
- Users: `/api/users/...`
- Spheres: `/api/spheres/...`
- Posts: `/api/posts/...`
- Resources: `/api/resources/...`
- Tasks: `/api/tasks/...`
- Messaging: `/api/conversations/...`
- Notifications: `/api/notifications/...`
- Santé: `GET /api/health/`

## Déploiement production

Suivre **DEPLOYMENT.md** (document de référence) pour:

- Variables d'environnement backend/frontend
- Activation S3 pour les uploads media
- Procédure Render + Vercel
- Checklist de validation post-déploiement
- Mesures de sécurité et rollback

## Notes importantes

- Les placeholders (`your-...`) doivent être remplacés par vos vrais domaines/envs avant prod.
- Le frontend dépend d'un environnement Node complet pour `vite` et `eslint`.
