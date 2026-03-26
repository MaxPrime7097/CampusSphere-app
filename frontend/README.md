# CampusSphere Frontend (React/Vite)

Frontend web de CampusSphere.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + composants UI
- React Router

## Installation & démarrage

```bash
npm install

cat > .env << 'EOT'
VITE_API_URL=http://127.0.0.1:8000
VITE_APP_NAME=CampusSphere
VITE_APP_ENV=development
EOT

npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Contrat API attendu

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

Voir `../DEPLOYMENT.md` pour la procédure Vercel + Render complète.
