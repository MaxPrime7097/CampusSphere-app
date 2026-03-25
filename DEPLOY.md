# CampusSphere Deployment Guide

## Quick Deployment Steps

### 1. Frontend (Vercel)
```bash
cd frontend/
vercel --prod
```

### 2. Backend (Render)
1. Push to GitHub:
```bash
git add .
git commit -m "Ready for production"
git push origin main
```

2. Deploy on Render.com:
- Create new Web Service
- Connect your GitHub repository
- Set build command: `python manage.py collectstatic --noinput`
- Set start command: `gunicorn campus_sphere.wsgi:application --bind 0.0.0.0:8000`

## Environment Variables Required

### Backend (Render)
- `SECRET_KEY`: Generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
- `DEBUG`: `False`
- `ALLOWED_HOSTS`: Your Vercel domain + Render domain
- `DATABASE_URL`: Your PostgreSQL database URL
- `REDIS_URL`: Your Redis URL (if using WebSockets)
- `JWT_SECRET`: Your JWT secret key
- `EMAIL_HOST_USER`: Your email address
- `EMAIL_HOST_PASSWORD`: Your email app password

### Frontend (Vercel)
- `VITE_API_URL`: Your Render backend URL
- `VITE_APP_NAME`: CampusSphere
- `VITE_APP_VERSION`: 1.0.0
- `VITE_APP_ENV`: production

## Configuration Files

### Backend
- `render.yaml`: Render deployment configuration
- `requirements.txt`: Python dependencies
- `campus_sphere/settings.py`: Django settings (already configured)

### Frontend
- `vercel.json`: Vercel deployment configuration
- `package.json`: Frontend dependencies
- `src/App.tsx`: Main application

## Post-Deployment

1. Test the application
2. Set up monitoring
3. Configure SSL certificates
4. Set up backups (if needed)

## CI/CD Ready
This codebase is ready for CI/CD via GitHub Actions - development and enhancements can continue without affecting the current deployment.