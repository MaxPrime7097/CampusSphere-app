# Plan de Migration Django → FastAPI

## Phase 1: Configuration de base (2-3 jours)

### 1.1 Installation des dépendances
```bash
pip install fastapi uvicorn sqlalchemy alembic python-jose[cryptography] passlib[bcrypt] python-multipart
```

### 1.2 Structure du projet
```
backend_fastapi/
├── app/
│   ├── __init__.py
│   ├── main.py              # Point d'entrée FastAPI
│   ├── config.py           # Configuration
│   ├── database.py         # Connexion SQLAlchemy
│   ├── dependencies.py     # Dépendances communes (auth, etc.)
│   │
│   ├── models/             # Modèles SQLAlchemy
│   │   ├── user.py
│   │   ├── sphere.py
│   │   ├── post.py
│   │   └── ...
│   │
│   ├── schemas/            # Pydantic models
│   │   ├── user.py
│   │   ├── sphere.py
│   │   └── ...
│   │
│   ├── routers/            # Routes FastAPI
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── spheres.py
│   │   └── ...
│   │
│   ├── services/           # Logique métier
│   │   ├── auth.py
│   │   ├── user.py
│   │   └── ...
│   │
│   └── utils/              # Utilitaires
│       ├── security.py     # JWT, hash passwords
│       └── permissions.py
```

## Phase 2: Migration des modèles (1-2 semaines)

### 2.1 Conversion Django ORM → SQLAlchemy

**Exemple: User Model**

```python
# Django (actuel)
class User(AbstractBaseUser):
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    # ...

# FastAPI + SQLAlchemy
from sqlalchemy import Column, String, Integer, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String, unique=True, index=True)
    first_name = Column(String(100))
    # ...
```

### 2.2 Migration de la base de données
- Utiliser Alembic pour les migrations
- Créer les schémas à partir des modèles SQLAlchemy
- Migrer les données existantes (si nécessaire)

## Phase 3: Migration des endpoints (2-3 semaines)

### 3.1 Authentification

```python
# FastAPI Router
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(prefix="/api/users/auth", tags=["auth"])

@router.post("/register")
async def register(user_data: UserCreate):
    # Logique d'inscription
    pass

@router.post("/login")
async def login(credentials: LoginRequest):
    # Créer JWT tokens
    pass
```

### 3.2 Pydantic Schemas pour validation

```python
from pydantic import BaseModel, EmailStr, validator

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v
```

## Phase 4: Fonctionnalités avancées (1-2 semaines)

### 4.1 Upload de fichiers
```python
from fastapi import File, UploadFile

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Gestion upload
    pass
```

### 4.2 WebSockets (natif dans FastAPI)
```python
from fastapi import WebSocket

@app.websocket("/ws/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    # Gestion messages temps réel
    pass
```

## Phase 5: Tests et déploiement (1 semaine)

### 5.1 Tests
- Tests unitaires avec pytest
- Tests d'intégration des endpoints
- Tests de performance

### 5.2 Déploiement
- Configuration Docker
- Variables d'environnement
- CI/CD

## Estimation totale: 5-8 semaines (full-time)

## Outils recommandés

### ORM
- **SQLAlchemy** (mature, utilisé par beaucoup)
- **Tortoise ORM** (style Django, async)

### Authentification
- **python-jose** pour JWT
- **passlib** pour hash passwords

### Migrations
- **Alembic** (pour SQLAlchemy)
- **Aerich** (pour Tortoise ORM)

### Validation
- **Pydantic v2** (intégré à FastAPI)

## Exemple de code complet

### main.py
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, spheres, posts

app = FastAPI(
    title="CampusSphere API",
    description="API for CampusSphere platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(spheres.router)
app.include_router(posts.router)
```

## Checklist de migration

- [ ] Configuration FastAPI de base
- [ ] Migration des modèles Django → SQLAlchemy
- [ ] Création des schemas Pydantic
- [ ] Migration authentification JWT
- [ ] Migration endpoints Users
- [ ] Migration endpoints Spheres
- [ ] Migration endpoints Posts
- [ ] Migration endpoints Resources
- [ ] Migration endpoints Tasks
- [ ] Migration endpoints Messaging
- [ ] Migration endpoints Notifications
- [ ] Migration upload fichiers
- [ ] Migration permissions et rôles
- [ ] Tests complets
- [ ] Documentation API
- [ ] Déploiement

