# CampusSphere — Guide de déploiement production (Vercel + Render)

Ce document est la référence de déploiement **production** pour CampusSphere.

---

## 1) Architecture cible

- **Frontend**: Vercel (Vite/React, dossier `frontend/`)
- **Backend**: Render Web Service (Django, dossier `backend/`)
- **Base de données**: PostgreSQL managé (Render PostgreSQL ou équivalent)
- **Optionnel**: Redis pour Channels / cache

---

## 2) Pré-checklist avant mise en prod

### Backend

- Variables d'environnement prêtes:
  - `SECRET_KEY` (forte, unique)
  - `DEBUG=False`
  - `ALLOWED_HOSTS`
  - `DATABASE_URL`
  - `CORS_ALLOWED_ORIGINS`
  - `CSRF_TRUSTED_ORIGINS`
- Endpoint de santé attendu: `/api/health/`
- Build/test locaux validés.

### Frontend

- `VITE_API_URL` pointe vers l'URL backend Render
- Build local OK (`npm run build`)
- Routes SPA correctement rewritées vers `index.html`

---

## 3) Déploiement backend (Render)

### Étape A — Créer le service

1. Render Dashboard → **New +** → **Web Service**
2. Connecter le repository GitHub
3. Sélectionner la branche cible (ex: `main`)
4. Root directory: `backend`

### Étape B — Commandes Render

- **Build command**
  ```bash
  pip install -r requirements.txt && python manage.py collectstatic --noinput
  ```
- **Start command**
  ```bash
  gunicorn campus_sphere.wsgi:application --bind 0.0.0.0:$PORT
  ```

### Étape C — Variables d'environnement backend

Exemple minimal:

```env
DEBUG=False
SECRET_KEY=<very-long-random-secret>
ALLOWED_HOSTS=<your-backend>.onrender.com,<your-frontend>.vercel.app
DATABASE_URL=postgresql://...
CORS_ALLOWED_ORIGINS=https://<your-frontend>.vercel.app
CSRF_TRUSTED_ORIGINS=https://<your-frontend>.vercel.app,https://<your-backend>.onrender.com
```

Optionnel:

```env
REDIS_URL=redis://...
EMAIL_HOST_USER=...
EMAIL_HOST_PASSWORD=...
USE_S3=True
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_STORAGE_BUCKET_NAME=...
AWS_S3_REGION_NAME=...
# optionnel:
# AWS_S3_CUSTOM_DOMAIN=cdn.example.com
# AWS_QUERYSTRING_AUTH=False
```

### Étape D — Mise à jour CORS/CSRF pour CampusSphere Uni (Vercel)

Dans Render → service backend → **Environment**:

1. Mettre à jour `CORS_ALLOWED_ORIGINS` en incluant explicitement:
   - `https://campus-sphere-uni.vercel.app`
2. Mettre à jour `CSRF_TRUSTED_ORIGINS` avec la même origine, plus les autres domaines frontend légitimes.
3. Si vous utilisez plusieurs previews Vercel contrôlées, envisager:
   - `CORS_ALLOWED_ORIGIN_REGEXES=^https://.*\.vercel\.app$`
   - ou une regex plus restrictive (préfixe de projet) pour limiter la surface d'exposition.
4. Redéployer le backend (manual deploy ou commit déclencheur).

Exemple orienté production:

```env
CORS_ALLOWED_ORIGINS=https://campus-sphere-uni.vercel.app,https://<other-stable-frontend>.vercel.app
CSRF_TRUSTED_ORIGINS=https://campus-sphere-uni.vercel.app,https://<other-stable-frontend>.vercel.app,https://<your-backend>.onrender.com
# Optionnel si previews Vercel:
# CORS_ALLOWED_ORIGIN_REGEXES=^https://campus-sphere-uni-.*\.vercel\.app$
```

### Étape E — Vérifier la préflight `OPTIONS /api/conversations/user/`

Après redéploiement, tester la préflight depuis votre poste:

```bash
curl -i -X OPTIONS "https://<your-backend>.onrender.com/api/conversations/user/" \
  -H "Origin: https://campus-sphere-uni.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

Vérifier dans la réponse:

- `Access-Control-Allow-Origin: https://campus-sphere-uni.vercel.app`
- Présence des méthodes autorisées dans `Access-Control-Allow-Methods`
- Présence des headers autorisés dans `Access-Control-Allow-Headers`

### Étape F — Health check Render

- Path: `/api/health/`

---

## 4) Déploiement frontend (Vercel)

### Étape A — Créer le projet

1. Vercel Dashboard → **Add New Project**
2. Importer le repository
3. **Root Directory**: `frontend`
4. Framework détecté: Vite

### Étape B — Variables d'environnement frontend

```env
VITE_API_URL=https://<your-backend>.onrender.com
VITE_APP_NAME=CampusSphere
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
```

### Étape C — Vérification post-deploy

- Ouvrir l'URL Vercel
- Vérifier login/register
- Vérifier chargement des pages protégées
- Vérifier appels API (Network) vers backend Render

---

## 5) Commandes de validation recommandées

### Backend

```bash
cd backend
SECRET_KEY=testkeyfortests12345678901234567890 DEBUG=True ALLOWED_HOSTS=localhost python manage.py check
SECRET_KEY=testkeyfortests12345678901234567890 DEBUG=True ALLOWED_HOSTS=localhost python manage.py test
```

### Frontend

```bash
cd frontend
npm install
npm run build
npm run lint
```

---

## 6) Points de sécurité production

- Ne jamais exposer `SECRET_KEY`
- `DEBUG=False` en prod
- `ALLOWED_HOSTS` strictement définis
- `CORS_ALLOWED_ORIGINS` et `CSRF_TRUSTED_ORIGINS` stricts (pas de `*`)
- HTTPS obligatoire côté plateformes (Vercel/Render)

---

## 7) Activation S3 (stockage fichiers)

Le backend supporte le stockage media local **ou** S3 selon `USE_S3`.

- `USE_S3=False` (défaut): fichiers sur disque local (`MEDIA_ROOT`)
- `USE_S3=True`: fichiers media envoyés vers S3 (`media/` prefix)

Variables S3 minimales:

```env
USE_S3=True
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_STORAGE_BUCKET_NAME=...
AWS_S3_REGION_NAME=eu-west-1
```

Variables optionnelles:

```env
AWS_S3_CUSTOM_DOMAIN=cdn.example.com
AWS_QUERYSTRING_AUTH=False
AWS_S3_FILE_OVERWRITE=False
```

---

## 8) Rollback rapide

- Garder un tag Git de release (`v1.x.x`)
- En cas d'incident:
  - rollback frontend via Vercel (previous deployment)
  - rollback backend via Render (previous deploy)
  - rollback DB uniquement si migration destructive
