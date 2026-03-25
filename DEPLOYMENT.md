# CampusSphere Production Deployment Guide

## Overview
CampusSphere is now ready for deployment to Vercel (frontend) and Render (backend).

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel CLI installed
- Vercel account

### Steps
1. **Build the frontend**
   ```bash
   cd frontend/
   npm install
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables** in Vercel Dashboard:
   - `VITE_API_URL`: Your Render backend URL
   - `VITE_APP_NAME`: CampusSphere
   - `VITE_APP_VERSION`: 1.0.0

## Backend Deployment (Render)

### Prerequisites
- Render account
- Render CLI (optional)

### Steps
1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Deploy to Render**
   - Go to Render.com
   - Click "New Web Service"
   - Connect your GitHub repository
   - Select the main branch
   - Set the build command: `python manage.py collectstatic --noinput`
   - Set the start command: `gunicorn campus_sphere.wsgi:application --bind 0.0.0.0:8000`

3. **Configure Environment Variables** in Render:
   - `DEBUG`: `False`
   - `SECRET_KEY`: Generate a secure key
   - `ALLOWED_HOSTS`: Your Vercel domain
   - `DATABASE_URL`: Your PostgreSQL database URL
   - `REDIS_URL`: Your Redis URL (if using WebSockets)

## Database Setup

### Option 1: Render PostgreSQL
- Use Render's built-in PostgreSQL
- Set the DATABASE_URL in Render environment

### Option 2: External Database
- Configure your own PostgreSQL database
- Update DATABASE_URL accordingly

## Final Steps

1. **Test the deployment**
   - Frontend: Visit your Vercel URL
   - Backend: Test API endpoints

2. **Set up monitoring**
   - Check logs in both Vercel and Render
   - Verify SSL certificates are working

3. **Update production settings**
   - Review security configurations
   - Set up proper error handling

## Troubleshooting

### Common Issues
- **CORS errors**: Ensure VITE_API_URL matches your backend
- **Database connection**: Verify DATABASE_URL is correct
- **Static files**: Ensure collectstatic ran successfully

### Support
- Check Vercel and Render documentation
- Review the remaining documentation files for advanced configurations

---

**Note**: All development and testing files have been removed. The remaining codebase is production-ready for Vercel + Render deployment.