# Déploiement CampusSphere

Ce fichier est un raccourci.

<<<<<<< codex/analyze-code-and-provide-overall-status-dfoazs
👉 Utilisez **`DEPLOYMENT.md`** comme document principal pour le déploiement production (Render + Vercel), les variables d'environnement (y compris S3) et la checklist post-déploiement.
=======
👉 Utilisez **`DEPLOYMENT.md`** comme document principal pour le déploiement production (Render + Vercel), les variables d'environnement et la checklist post-déploiement.
>>>>>>> main

## Raccourci commandes

```bash
# Backend
cd backend
SECRET_KEY=testkeyfortests12345678901234567890 DEBUG=True ALLOWED_HOSTS=localhost CORS_ALLOWED_ORIGINS=http://localhost:3000 CSRF_TRUSTED_ORIGINS=http://localhost:3000 python manage.py check
SECRET_KEY=testkeyfortests12345678901234567890 DEBUG=True ALLOWED_HOSTS=localhost CORS_ALLOWED_ORIGINS=http://localhost:3000 CSRF_TRUSTED_ORIGINS=http://localhost:3000 python manage.py test

# Frontend
cd frontend
npm install
npm run build
```
