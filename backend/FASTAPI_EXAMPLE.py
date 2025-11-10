"""
Exemple de migration Django → FastAPI
Ce fichier montre comment migrer un modèle et ses endpoints de Django vers FastAPI
"""

# ============================================================================
# DJANGO (CODE ACTUEL)
# ============================================================================

"""
# models.py (Django)
from django.db import models
from django.contrib.auth.models import AbstractBaseUser

class User(AbstractBaseUser):
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    university = models.CharField(max_length=100, blank=True)
    faculty = models.CharField(max_length=100, blank=True)
    impact_score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
"""

"""
# serializers.py (Django REST Framework)
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'university', 'faculty', 'impact_score']
"""

"""
# views.py (Django REST Framework)
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
"""


# ============================================================================
# FASTAPI (CODE MIGRÉ)
# ============================================================================

# ----------------------------------------------------------------------------
# 1. MODÈLE SQLAlchemy (models/user.py)
# ----------------------------------------------------------------------------
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    university = Column(String(100), nullable=True)
    faculty = Column(String(100), nullable=True)
    impact_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


# ----------------------------------------------------------------------------
# 2. SCHÉMAS Pydantic (schemas/user.py)
# ----------------------------------------------------------------------------
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    university: Optional[str] = None
    faculty: Optional[str] = None

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class UserResponse(UserBase):
    id: int
    impact_score: int
    created_at: datetime
    
    class Config:
        from_attributes = True  # Permet la conversion depuis SQLAlchemy


# ----------------------------------------------------------------------------
# 3. ROUTER FastAPI (routers/users.py)
# ----------------------------------------------------------------------------
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.user import UserCreate, UserResponse
from app.services.user import create_user, get_user_by_id, get_all_users

router = APIRouter(prefix="/api/users", tags=["users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Créer un nouvel utilisateur"""
    try:
        user = create_user(db, user_data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=list[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Liste tous les utilisateurs (authentifié)"""
    users = get_all_users(db, skip=skip, limit=limit)
    return users

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer un utilisateur par ID"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


# ----------------------------------------------------------------------------
# 4. SERVICE (services/user.py) - Logique métier
# ----------------------------------------------------------------------------
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.utils.security import get_password_hash

def create_user(db: Session, user_data: UserCreate) -> User:
    """Créer un nouvel utilisateur"""
    # Vérifier si l'utilisateur existe déjà
    if db.query(User).filter(User.email == user_data.email).first():
        raise ValueError("Email already registered")
    if db.query(User).filter(User.username == user_data.username).first():
        raise ValueError("Username already taken")
    
    # Créer l'utilisateur
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        university=user_data.university,
        faculty=user_data.faculty,
        password_hash=get_password_hash(user_data.password)
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Récupérer un utilisateur par ID"""
    return db.query(User).filter(User.id == user_id).first()

def get_all_users(db: Session, skip: int = 0, limit: int = 20):
    """Récupérer tous les utilisateurs avec pagination"""
    return db.query(User).offset(skip).limit(limit).all()


# ----------------------------------------------------------------------------
# 5. AUTHENTIFICATION (routers/auth.py)
# ----------------------------------------------------------------------------
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
from app.utils.security import verify_password, create_access_token, get_password_hash
from app.config import ACCESS_TOKEN_EXPIRE_DAYS

router = APIRouter(prefix="/api/users/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/auth/login")

@router.post("/register")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Inscription d'un nouvel utilisateur"""
    from app.services.user import create_user
    try:
        user = create_user(db, user_data)
        return {"message": "User created successfully", "user_id": user.id}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Connexion et génération de tokens JWT"""
    from app.models.user import User
    
    # Trouver l'utilisateur (par username ou email)
    user = db.query(User).filter(
        (User.username == form_data.username) | 
        (User.email == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Créer les tokens
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }


# ----------------------------------------------------------------------------
# 6. MAIN.PY - Point d'entrée
# ----------------------------------------------------------------------------
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, spheres, posts, resources, tasks

app = FastAPI(
    title="CampusSphere API",
    description="API REST pour la plateforme CampusSphere",
    version="1.0.0",
    docs_url="/docs",  # Documentation Swagger automatique
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "https://campus-sphere.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(spheres.router)
app.include_router(posts.router)
app.include_router(resources.router)
app.include_router(tasks.router)

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "campus-sphere-api"}


# ----------------------------------------------------------------------------
# 7. UTILITAIRES (utils/security.py)
# ----------------------------------------------------------------------------
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.config import SECRET_KEY, ALGORITHM

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Hasher un mot de passe"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifier un mot de passe"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Créer un token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ----------------------------------------------------------------------------
# AVANTAGES DE FASTAPI DANS CET EXEMPLE
# ----------------------------------------------------------------------------

"""
1. Documentation automatique: /docs génère Swagger UI automatiquement
2. Validation automatique: Pydantic valide les données automatiquement
3. Type hints natifs: Meilleure autocomplétion et détection d'erreurs
4. Performance: Async natif pour les opérations I/O
5. Code plus simple: Moins de boilerplate que Django REST Framework
"""

