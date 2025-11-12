# 🚀 Guide de Démarrage du Backend CampusSphere

## Prérequis

- Python 3.12+ installé
- Virtual environment déjà créé (dans `backend/venv/`)

## 🎯 Démarrage Rapide (Windows)

### Méthode 1 : Script automatique (Recommandé)

**Option A - PowerShell :**
```powershell
cd backend
.\start_backend.ps1
```

**Option B - Batch :**
```cmd
cd backend
start_backend.bat
```

### Méthode 2 : Démarrage manuel

#### 1. Activer l'environnement virtuel

```powershell
# Dans le dossier backend
cd backend
.\venv\Scripts\Activate.ps1
```

Si vous avez une erreur d'exécution de scripts, exécutez d'abord :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 2. Vérifier les dépendances

```powershell
pip install -r requirements.txt
```

#### 3. Configuration de la base de données

**Le backend utilise SQLite par défaut** (fichier `db.sqlite3`) - **Aucune configuration nécessaire !**

Si vous voulez utiliser PostgreSQL/Supabase, créez un fichier `.env` dans le dossier `backend/` :

```env
# Pour SQLite (défaut - développement) - PAS BESOIN DE .env
DEBUG=True
SECRET_KEY=votre-secret-key-ici

# Pour PostgreSQL/Supabase (optionnel)
DATABASE_URL=postgresql://user:password@host:port/database
# OU
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=votre-mot-de-passe
DB_HOST=votre-hôte
DB_PORT=5432
```

#### 4. Appliquer les migrations

```powershell
python manage.py migrate
```

#### 5. Créer un superutilisateur (optionnel)

```powershell
python manage.py createsuperuser
```

#### 6. Démarrer le serveur de développement

```powershell
python manage.py runserver
```

Le serveur sera accessible sur : **http://127.0.0.1:8000/**

## 📝 Vérification

### Tester l'API

1. **Health Check** : http://127.0.0.1:8000/api/health/
2. **API Info** : http://127.0.0.1:8000/api/info/

### Endpoints principaux

- **Inscription** : `POST http://127.0.0.1:8000/api/users/auth/register/`
- **Connexion** : `POST http://127.0.0.1:8000/api/users/auth/login/`
- **Profil utilisateur** : `GET http://127.0.0.1:8000/api/users/auth/me/` (nécessite authentification)

## 🔧 Configuration Frontend

Dans votre fichier `.env` du frontend, assurez-vous d'avoir :

```env
VITE_API_URL=http://127.0.0.1:8000
```

## ⚠️ Notes Importantes

1. **Base de données** : SQLite est utilisé par défaut (parfait pour le développement)
2. **CORS** : Déjà configuré pour accepter les requêtes du frontend
3. **Authentification** : JWT avec tokens d'accès et de rafraîchissement
4. **Port** : Le backend tourne sur le port 8000 par défaut

## 🐛 Dépannage

### Erreur "Module not found"
```powershell
pip install -r requirements.txt
```

### Erreur de migration
```powershell
python manage.py migrate
```

### Erreur de port déjà utilisé
```powershell
python manage.py runserver 8001
```

### Vérifier la configuration
```powershell
python manage.py check
```

## 📚 Documentation API

Une fois le serveur démarré, vous pouvez accéder à :
- **Admin Django** : http://127.0.0.1:8000/admin/ (après création d'un superutilisateur)
- **API Root** : http://127.0.0.1:8000/api/

## 🎉 C'est prêt !

Votre backend est maintenant opérationnel et prêt à recevoir les requêtes du frontend.

