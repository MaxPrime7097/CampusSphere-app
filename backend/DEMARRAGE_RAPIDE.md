# 🚀 Démarrage Rapide - Backend CampusSphere

## ⚡ Démarrage en 3 étapes

### 1. Ouvrir un terminal dans le dossier `backend`

### 2. Exécuter le script de démarrage

**PowerShell :**
```powershell
.\start_backend.ps1
```

**OU Batch (cmd) :**
```cmd
start_backend.bat
```

### 3. Attendre que le serveur démarre

Le serveur sera accessible sur : **http://127.0.0.1:8000/**

## ✅ Vérification

Une fois le serveur démarré, testez :

1. **Health Check** : http://127.0.0.1:8000/api/health/
2. **API Info** : http://127.0.0.1:8000/api/info/

## 📝 Notes Importantes

- **Base de données** : SQLite est utilisé par défaut (aucune configuration nécessaire)
- **Port** : Le backend tourne sur le port 8000
- **CORS** : Déjà configuré pour le frontend
- **Frontend** : Le frontend utilise automatiquement `http://127.0.0.1:8000` par défaut

## 🔧 Si vous avez des problèmes

### Erreur "Script execution is disabled"
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erreur "Module not found"
```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Erreur de migration
```powershell
python manage.py migrate
```

### Vérifier la configuration
```powershell
python manage.py check
```

## 🎉 C'est tout !

Votre backend est maintenant opérationnel et prêt à recevoir les requêtes du frontend.

