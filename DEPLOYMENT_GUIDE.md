# 🚀 Guide de Déploiement CampusSphere

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Configuration de l'environnement](#configuration-de-lenvironnement)
4. [Déploiement Frontend](#déploiement-frontend)
5. [Déploiement Backend](#déploiement-backend)
6. [Configuration de la base de données](#configuration-de-la-base-de-données)
7. [Configuration du CDN](#configuration-du-cdn)
8. [Monitoring et logs](#monitoring-et-logs)
9. [Sécurité](#sécurité)
10. [Maintenance](#maintenance)
11. [Backup et récupération](#backup-et-récupération)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

CampusSphere est une application web full-stack composée de :
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + PostgreSQL
- **CDN**: Pour les assets statiques et fichiers uploadés
- **Cache**: Redis pour les sessions et données fréquemment accédées

### Architecture de déploiement recommandée
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │────│   Frontend      │────│   Backend API   │
│   (Nginx)       │    │   (Vercel)      │    │   (Railway)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                │                        │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   CDN           │    │   Database      │
                       │   (Cloudinary)  │    │   (Supabase)    │
                       └─────────────────┘    └─────────────────┘
                                                        │
                                                ┌─────────────────┐
                                                │   Cache         │
                                                │   (Redis)       │
                                                └─────────────────┘
```

---

## 🔧 Prérequis

### Outils de développement
```bash
# Node.js (version 18+)
node --version  # v18.17.0+

# npm (version 9+)
npm --version   # 9.6.7+

# Git
git --version   # 2.40.0+

# Docker (optionnel)
docker --version  # 24.0.0+
```

### Comptes de services requis
- **Vercel** (Frontend)
- **Railway** ou **Heroku** (Backend)
- **Supabase** ou **PlanetScale** (Database)
- **Cloudinary** (CDN)
- **Redis Cloud** (Cache)
- **Sentry** (Monitoring)

---

## ⚙️ Configuration de l'environnement

### Variables d'environnement Frontend
```env
# .env.production
VITE_API_URL=https://api.campus-sphere.com
VITE_APP_NAME=CampusSphere
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production

# CDN
VITE_CDN_URL=https://res.cloudinary.com/campus-sphere

# Analytics (optionnel)
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Variables d'environnement Backend
```env
# .env.production
NODE_ENV=production
PORT=3001

# Base de données
DATABASE_URL=postgresql://username:password@host:5432/campus_sphere
DATABASE_HOST=db.railway.app
DATABASE_PORT=5432
DATABASE_NAME=campus_sphere
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Upload
UPLOAD_MAX_SIZE=52428800  # 50MB
UPLOAD_ALLOWED_TYPES=pdf,doc,docx,ppt,pptx,zip,jpg,jpeg,png,gif
UPLOAD_PATH=./uploads
CDN_URL=https://res.cloudinary.com/campus-sphere

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@campus-sphere.com
SMTP_PASS=your-app-password

# Redis
REDIS_URL=redis://username:password@host:port

# CORS
CORS_ORIGIN=https://campus-sphere.com,https://www.campus-sphere.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
LOG_LEVEL=info

# WebSocket
WS_PORT=3002
```

---

## 🌐 Déploiement Frontend

### Option 1: Vercel (Recommandé)

#### 1. Préparation du projet
```bash
# Cloner le repository
git clone https://github.com/your-org/campus-sphere.git
cd campus-sphere

# Installer les dépendances
npm install

# Build de test
npm run build
```

#### 2. Configuration Vercel
```bash
# Installer Vercel CLI
npm i -g vercel

# Login
vercel login

# Déployer
vercel --prod
```

#### 3. Configuration Vercel Dashboard
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://api.campus-sphere.com",
    "VITE_APP_NAME": "CampusSphere",
    "VITE_APP_VERSION": "1.0.0"
  }
}
```

#### 4. Configuration du domaine
```bash
# Ajouter un domaine personnalisé
vercel domains add campus-sphere.com
vercel domains add www.campus-sphere.com
```

### Option 2: Netlify

#### 1. Configuration netlify.toml
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

#### 2. Variables d'environnement Netlify
```
VITE_API_URL=https://api.campus-sphere.com
VITE_APP_NAME=CampusSphere
VITE_APP_VERSION=1.0.0
```

### Option 3: Docker

#### 1. Dockerfile Frontend
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 2. nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        # Cache static assets
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

#### 3. Déploiement Docker
```bash
# Build de l'image
docker build -t campus-sphere-frontend .

# Run du container
docker run -p 80:80 campus-sphere-frontend
```

---

## 🔧 Déploiement Backend

### Option 1: Railway (Recommandé)

#### 1. Configuration Railway
```bash
# Installer Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialiser le projet
railway init

# Déployer
railway up
```

#### 2. Configuration railway.json
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 3. Variables d'environnement Railway
```bash
# Ajouter les variables d'environnement
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
railway variables set JWT_SECRET=your-secret-key
railway variables set REDIS_URL=${{Redis.REDIS_URL}}
```

### Option 2: Heroku

#### 1. Configuration Heroku
```bash
# Installer Heroku CLI
npm install -g heroku

# Login
heroku login

# Créer l'app
heroku create campus-sphere-api

# Ajouter les add-ons
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
```

#### 2. Procfile
```
web: npm start
worker: npm run worker
```

#### 3. Déploiement
```bash
# Déployer
git push heroku main

# Configurer les variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key
```

### Option 3: Docker

#### 1. Dockerfile Backend
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Installer les dépendances
COPY package*.json ./
RUN npm ci --only=production

# Copier le code source
COPY . .

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Changer les permissions
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exposer le port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Démarrer l'application
CMD ["npm", "start"]
```

#### 2. docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/campus_sphere
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=campus_sphere
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

---

## 🗄️ Configuration de la base de données

### Option 1: Supabase (Recommandé)

#### 1. Création du projet
```bash
# Installer Supabase CLI
npm install -g supabase

# Login
supabase login

# Initialiser le projet
supabase init

# Créer la base de données
supabase db reset
```

#### 2. Migration des données
```sql
-- Créer les tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  cover_photo_url VARCHAR(500),
  bio TEXT,
  university VARCHAR(100),
  faculty VARCHAR(100),
  study_year VARCHAR(20),
  student_id VARCHAR(50),
  campus VARCHAR(100),
  town VARCHAR(100),
  language VARCHAR(50),
  impact_score INTEGER DEFAULT 0,
  current_mood VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer les index
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_university ON users(university);
CREATE INDEX idx_users_faculty ON users(faculty);

-- Créer les triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 3. Configuration RLS (Row Level Security)
```sql
-- Activer RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);
```

### Option 2: PlanetScale

#### 1. Configuration PlanetScale
```bash
# Installer PlanetScale CLI
brew install planetscale/tap/pscale

# Login
pscale auth login

# Créer la base de données
pscale database create campus-sphere
```

#### 2. Schema migration
```sql
-- Créer les tables avec PlanetScale
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  cover_photo_url VARCHAR(500),
  bio TEXT,
  university VARCHAR(100),
  faculty VARCHAR(100),
  study_year VARCHAR(20),
  student_id VARCHAR(50),
  campus VARCHAR(100),
  town VARCHAR(100),
  language VARCHAR(50),
  impact_score INT DEFAULT 0,
  current_mood VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## ☁️ Configuration du CDN

### Option 1: Cloudinary (Recommandé)

#### 1. Configuration Cloudinary
```javascript
// cloudinary.config.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

module.exports = cloudinary;
```

#### 2. Upload de fichiers
```javascript
// upload.js
const cloudinary = require('./cloudinary.config');

const uploadFile = async (file, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'campus-sphere',
      resource_type: 'auto',
      ...options
    });
    
    return {
      id: result.public_id,
      url: result.secure_url,
      size: result.bytes,
      type: result.resource_type
    };
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
};
```

#### 3. Transformations d'images
```javascript
// Générer des URLs avec transformations
const getOptimizedImageUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    quality: 'auto',
    fetch_format: 'auto',
    width: options.width,
    height: options.height,
    crop: options.crop || 'fill',
    gravity: options.gravity || 'face'
  });
};
```

### Option 2: AWS S3 + CloudFront

#### 1. Configuration AWS
```javascript
// aws.config.js
const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const cloudFront = new AWS.CloudFront();

module.exports = { s3, cloudFront };
```

#### 2. Upload vers S3
```javascript
// s3-upload.js
const { s3 } = require('./aws.config');

const uploadToS3 = async (file, key) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  const result = await s3.upload(params).promise();
  return result.Location;
};
```

---

## 📊 Monitoring et logs

### Option 1: Sentry (Recommandé)

#### 1. Configuration Sentry Frontend
```javascript
// sentry.config.js
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV,
  integrations: [
    new BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Filtrer les erreurs sensibles
    if (event.exception) {
      const error = event.exception.values[0];
      if (error.type === 'ChunkLoadError') {
        return null; // Ignorer les erreurs de chunk
      }
    }
    return event;
  },
});
```

#### 2. Configuration Sentry Backend
```javascript
// sentry.config.js
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});
```

### Option 2: Winston (Logging)

#### 1. Configuration Winston
```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'campus-sphere-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

#### 2. Middleware de logging
```javascript
// logging.middleware.js
const logger = require('./logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
};

module.exports = { requestLogger };
```

---

## 🔒 Sécurité

### 1. Configuration HTTPS
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name campus-sphere.com www.campus-sphere.com;
    
    ssl_certificate /etc/letsencrypt/live/campus-sphere.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/campus-sphere.com/privkey.pem;
    
    # Configuration SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}

# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name campus-sphere.com www.campus-sphere.com;
    return 301 https://$server_name$request_uri;
}
```

### 2. Configuration CORS
```javascript
// cors.config.js
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://campus-sphere.com',
      'https://www.campus-sphere.com',
      'http://localhost:3000' // Development
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);
```

### 3. Rate Limiting
```javascript
// rate-limit.config.js
const rateLimit = require('express-rate-limit');

const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Limites spécifiques
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 tentatives
  'Trop de tentatives de connexion, réessayez plus tard'
);

const apiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requêtes
  'Trop de requêtes, réessayez plus tard'
);

module.exports = { authLimiter, apiLimiter };
```

### 4. Validation des données
```javascript
// validation.middleware.js
const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Données invalides',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      });
    }
    next();
  };
};

// Schémas de validation
const userSchema = Joi.object({
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  university: Joi.string().required(),
  faculty: Joi.string().required(),
  studyYear: Joi.string().required()
});

module.exports = { validate, userSchema };
```

---

## 🔧 Maintenance

### 1. Scripts de maintenance
```json
// package.json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "npm run build",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .js,.ts,.tsx",
    "lint:fix": "eslint . --ext .js,.ts,.tsx --fix",
    "db:migrate": "npx prisma migrate deploy",
    "db:seed": "npx prisma db seed",
    "db:reset": "npx prisma migrate reset",
    "backup:db": "pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql",
    "health:check": "curl -f http://localhost:3001/health || exit 1"
  }
}
```

### 2. Health checks
```javascript
// health.js
const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');

const router = express.Router();

// Configuration de la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Configuration Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

// Health check complet
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {}
  };

  try {
    // Vérifier la base de données
    const dbResult = await pool.query('SELECT 1');
    health.services.database = {
      status: 'ok',
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    health.services.database = {
      status: 'error',
      error: error.message
    };
    health.status = 'error';
  }

  try {
    // Vérifier Redis
    await redisClient.ping();
    health.services.redis = {
      status: 'ok'
    };
  } catch (error) {
    health.services.redis = {
      status: 'error',
      error: error.message
    };
    health.status = 'error';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
```

### 3. Monitoring des performances
```javascript
// performance.middleware.js
const performanceMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convertir en millisecondes
    
    // Logger les requêtes lentes
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        status: res.statusCode
      });
    }
    
    // Métriques pour monitoring
    if (process.env.NODE_ENV === 'production') {
      // Envoyer vers votre service de monitoring
      sendMetrics({
        endpoint: req.url,
        method: req.method,
        duration,
        status: res.statusCode
      });
    }
  });
  
  next();
};

module.exports = performanceMiddleware;
```

---

## 💾 Backup et récupération

### 1. Script de backup automatique
```bash
#!/bin/bash
# backup.sh

# Configuration
DB_NAME="campus_sphere"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/campus_sphere_$DATE.sql"

# Créer le dossier de backup
mkdir -p $BACKUP_DIR

# Backup de la base de données
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compression
gzip $BACKUP_FILE

# Upload vers S3 (optionnel)
aws s3 cp $BACKUP_FILE.gz s3://campus-sphere-backups/

# Nettoyage des anciens backups (garder 30 jours)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### 2. Script de récupération
```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore.sh <backup_file>"
    exit 1
fi

# Vérifier que le fichier existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Confirmation
read -p "Are you sure you want to restore from $BACKUP_FILE? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Restauration
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | psql $DATABASE_URL
else
    psql $DATABASE_URL < $BACKUP_FILE
fi

echo "Restore completed from: $BACKUP_FILE"
```

### 3. Configuration cron
```bash
# Crontab pour backup quotidien
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1

# Crontab pour nettoyage hebdomadaire
0 3 * * 0 /path/to/cleanup.sh >> /var/log/cleanup.log 2>&1
```

---

## 🐛 Troubleshooting

### 1. Problèmes courants

#### Erreur de connexion à la base de données
```bash
# Vérifier la connexion
psql $DATABASE_URL -c "SELECT 1;"

# Vérifier les logs
tail -f /var/log/postgresql/postgresql.log
```

#### Erreur de mémoire
```bash
# Vérifier l'utilisation mémoire
free -h
ps aux --sort=-%mem | head

# Augmenter la limite mémoire Node.js
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### Erreur de disque plein
```bash
# Vérifier l'espace disque
df -h

# Nettoyer les logs
find /var/log -name "*.log" -mtime +7 -delete

# Nettoyer les backups anciens
find /backups -name "*.sql.gz" -mtime +30 -delete
```

### 2. Logs de debugging
```javascript
// debug.js
const debug = require('debug');

const dbDebug = debug('campus-sphere:db');
const authDebug = debug('campus-sphere:auth');
const apiDebug = debug('campus-sphere:api');

// Utilisation
dbDebug('Database connection established');
authDebug('User authentication successful');
apiDebug('API request received: %s %s', req.method, req.url);
```

### 3. Monitoring en temps réel
```bash
# Surveiller les logs en temps réel
tail -f /var/log/campus-sphere/combined.log

# Surveiller les performances
htop
iotop
netstat -tulpn

# Surveiller la base de données
pg_stat_activity
pg_stat_database
```

---

## 📈 Optimisations

### 1. Optimisation de la base de données
```sql
-- Index pour améliorer les performances
CREATE INDEX CONCURRENTLY idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX CONCURRENTLY idx_posts_author_id ON posts(author_id);
CREATE INDEX CONCURRENTLY idx_posts_sphere_id ON posts(sphere_id);
CREATE INDEX CONCURRENTLY idx_resources_subject ON resources(subject);
CREATE INDEX CONCURRENTLY idx_resources_type ON resources(type);

-- Statistiques de la base de données
ANALYZE;

-- Nettoyage des données inutiles
VACUUM ANALYZE;
```

### 2. Optimisation du cache
```javascript
// cache.js
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

const cache = {
  async get(key) {
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    try {
      await client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async del(key) {
    try {
      await client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
};

module.exports = cache;
```

### 3. Optimisation des images
```javascript
// image-optimization.js
const sharp = require('sharp');

const optimizeImage = async (inputBuffer, options = {}) => {
  const {
    width = 800,
    height = 600,
    quality = 80,
    format = 'webp'
  } = options;

  return await sharp(inputBuffer)
    .resize(width, height, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
};
```

---

Ce guide de déploiement couvre tous les aspects nécessaires pour déployer et maintenir CampusSphere en production. Suivez les étapes dans l'ordre et adaptez les configurations selon vos besoins spécifiques.
