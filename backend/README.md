# CampusSphere Backend (Django/DRF)

API backend de CampusSphere.

## Stack

- Django 5.2
- Django REST Framework
- Simple JWT
- django-filter
- Channels (optionnel avec Redis)

## Démarrage local

```bash
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

## Vérifications

```bash
SECRET_KEY=testkeyfortests12345678901234567890 DEBUG=True ALLOWED_HOSTS=localhost CORS_ALLOWED_ORIGINS=http://localhost:3000 CSRF_TRUSTED_ORIGINS=http://localhost:3000 python manage.py check
SECRET_KEY=testkeyfortests12345678901234567890 DEBUG=True ALLOWED_HOSTS=localhost CORS_ALLOWED_ORIGINS=http://localhost:3000 CSRF_TRUSTED_ORIGINS=http://localhost:3000 python manage.py test
<<<<<<< codex/analyze-code-and-provide-overall-status-dfoazs
```

## Endpoints clés

- `POST /api/users/auth/register/`
- `POST /api/users/auth/login/`
- `GET /api/users/auth/me/`
- `POST /api/auth/refresh/`
- `GET /api/health/`

Modules:
- Users: `/api/users/`
- Spheres: `/api/spheres/`
- Posts: `/api/posts/`
- Resources: `/api/resources/`
- Tasks: `/api/tasks/`
- Conversations: `/api/conversations/`
- Notifications: `/api/notifications/`

## Déploiement

Voir `../DEPLOYMENT.md`.

## Stockage fichiers S3 (optionnel)

Le backend supporte S3 via `django-storages` + `boto3`.

Variables minimales:

```env
USE_S3=True
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_STORAGE_BUCKET_NAME=...
AWS_S3_REGION_NAME=eu-west-1
```

Optionnel:

```env
AWS_S3_CUSTOM_DOMAIN=cdn.example.com
AWS_QUERYSTRING_AUTH=False
AWS_S3_FILE_OVERWRITE=False
```
=======
```

## Endpoints clés

- `POST /api/users/auth/register/`
- `POST /api/users/auth/login/`
- `GET /api/users/auth/me/`
- `POST /api/auth/refresh/`
- `GET /api/health/`

Modules:
- Users: `/api/users/`
- Spheres: `/api/spheres/`
- Posts: `/api/posts/`
- Resources: `/api/resources/`
- Tasks: `/api/tasks/`
- Conversations: `/api/conversations/`
- Notifications: `/api/notifications/`

## Déploiement

Voir `../DEPLOYMENT.md`.
>>>>>>> main
