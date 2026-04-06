# Guide de Déploiement Production

## Architecture cible

```
Frontend (Vercel) ──── Backend (Render) ──── PostgreSQL (Supabase/Render)
                              │
                        Supabase Auth
```

---

## 1. Prérequis

- Compte [Vercel](https://vercel.com) (frontend)
- Compte [Render](https://render.com) (backend)
- Projet [Supabase](https://supabase.com) (auth + optionnellement DB)
- Repository Git (GitHub recommandé)

---

## 2. Déploiement Backend (Render)

### 2.1 Créer le service

1. Nouveau service → **Web Service**
2. Connecter le repository
3. **Root Directory** : `backend`
4. **Build Command** : `pip install -r requirements.txt`
5. **Start Command** : `gunicorn campus_sphere.wsgi:application`

### 2.2 Variables d'environnement Render

```env
SECRET_KEY=<générer une clé sécurisée>
DEBUG=False
ALLOWED_HOSTS=your-backend.onrender.com
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-frontend.vercel.app
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=https://your-frontend.vercel.app
```

### 2.3 Après le premier déploiement

```bash
# Via Render Shell ou en ajoutant à la start command
python manage.py migrate
python manage.py collectstatic --noinput
```

---

## 3. Déploiement Frontend (Vercel)

### 3.1 Créer le projet

1. Nouveau projet → importer le repository
2. **Root Directory** : `frontend`
3. **Build Command** : `npm run build`
4. **Output Directory** : `dist`

### 3.2 Variables d'environnement Vercel

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_APP_NAME=CampusSphere
VITE_APP_ENV=production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3.3 Configuration vercel.json

Le fichier `frontend/vercel.json` est déjà configuré pour le routing SPA.

---

## 4. Configuration Supabase

### 4.1 URL de redirection

Dans **Authentication → URL Configuration** :

```
Site URL: https://your-frontend.vercel.app

Redirect URLs:
  https://your-frontend.vercel.app/register
  https://your-frontend.vercel.app/auth/callback
```

### 4.2 Providers OAuth

Dans **Authentication → Providers** :
- **Google** : Activer + configurer Client ID/Secret depuis Google Cloud Console
- **Facebook** : Activer + configurer App ID/Secret depuis Meta Developers

---

## 5. Base de données

### Option A : PostgreSQL sur Render

1. Créer un **PostgreSQL** service sur Render
2. Copier l'**Internal Database URL** dans `DATABASE_URL` du backend

### Option B : Supabase PostgreSQL

1. Dans Supabase → **Settings → Database**
2. Copier la **Connection string (URI)**
3. Utiliser comme `DATABASE_URL`

---

## 6. Checklist post-déploiement

- [ ] `GET /api/health/` retourne `{"status": "ok"}`
- [ ] Inscription email fonctionne (email de vérification reçu)
- [ ] Inscription Google/Facebook fonctionne
- [ ] Upload de fichiers fonctionne
- [ ] Les migrations sont appliquées (`python manage.py showmigrations`)
- [ ] CORS configuré correctement (pas d'erreurs dans la console)
- [ ] Variables d'environnement toutes renseignées

---

## 7. Développement local

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate    # Windows
source venv/bin/activate # Linux/Mac
pip install -r requirements.txt

# Copier et adapter .env
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### Frontend
```bash
cd frontend
npm install
# Créer .env avec les variables locales
npm run dev
```

### Vérifications qualité
```bash
# Backend
cd backend
python manage.py check
python manage.py test

# Frontend
cd frontend
npm run build
npm run lint
```

---

## 8. Rollback

En cas de problème :

1. **Vercel** : Aller dans Deployments → cliquer sur un déploiement précédent → **Promote to Production**
2. **Render** : Aller dans le service → **Manual Deploy** → sélectionner un commit précédent
3. **Base de données** : Restaurer depuis un backup Supabase/Render

---

## 9. Sécurité

- Ne jamais committer les fichiers `.env`
- `SECRET_KEY` Django doit être unique et aléatoire en production
- `DEBUG=False` obligatoire en production
- `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais être exposé côté frontend
- Configurer le rate limiting (déjà en place via `AuthScopedRateThrottle`)
