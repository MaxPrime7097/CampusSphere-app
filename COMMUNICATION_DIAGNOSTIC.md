# 📡 Diagnostic de Communication Frontend-Backend

## ✅ Résumé Général

Votre frontend et backend **SONT CONFIGURÉS pour communiquer**, mais voici ce qui est important à vérifier:

---

## 🔍 Configuration Actuelle

### Frontend (React/TypeScript)
- **Base URL**: `http://127.0.0.1:8000` (défaut si `VITE_API_URL` non défini)
- **Location**: `frontend/src/services/api.ts`
- **Authentification**: JWT Tokens stockés dans localStorage
- **Headers CORS**: Configurés dans les requêtes

### Backend (Django/DRF)
- **Port**: 8000
- **CORS Origins**: 
  ```python
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "https://campussphere.app",
  ```
- **Authentification**: JWT avec tokens de 7 jours (access) et 30 jours (refresh)

---

## 🎯 Points Clés de Communication

### 1. **Endpoints Validés** ✓

#### Ressources (Endpoint utilisé dans `SavedItems.tsx`)
```
GET /api/resources/saved/  → Récupère les ressources enregistrées
```
**Implémentation Backend**: ✅ Existe dans `backend/resources/views.py`
```python
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_saved_resources(request):
    # Retourne les ressources sauvegardées par l'utilisateur
```

#### Tous les autres endpoints
- **Utilisateurs**: `/api/users/*` ✅
- **Spheres**: `/api/spheres/*` ✅
- **Posts**: `/api/posts/*` ✅
- **Tâches**: `/api/tasks/*` ✅
- **Messagerie**: `/api/conversations/*` ✅
- **Notifications**: `/api/notifications/*` ✅

---

## ⚠️ Points d'Attention

### 1. **Configuration de l'URL Base**
**Le frontend cherche `VITE_API_URL` dans les variables d'environnement:**

```typescript
// frontend/src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
```

**Vous DEVEZ avoir dans `frontend/.env`:**
```properties
VITE_API_URL=http://127.0.0.1:8000
```

### 2. **Ports à Vérifier**

**Frontend doit tourner sur**: `http://localhost:3000` ou `http://localhost:5173` (Vite par défaut)
**Backend doit tourner sur**: `http://127.0.0.1:8000`

### 3. **CORS Allowlist Manquant**
Si vous exécutez le frontend sur un port différent, vous devez mettre à jour `ALLOWED_HOSTS` dans `backend/campus_sphere/settings.py`:

**Actuellement défini**:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",        # ← Frontend standard
    "http://127.0.0.1:3000",        # ← Frontend localhost
    "http://localhost:8080",        # Alternative
    "http://127.0.0.1:8080",        # Alternative
    "https://campussphere.app",    # Production
]
```

---

## 🚀 Checklist Pour Tester la Communication

### Étape 1: Backend

```bash
# Aller dans le dossier backend
cd backend

# Créer et activer l'environnement virtuel
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env (voir ci-dessous)
# Puis exécuter les migrations
python manage.py migrate

# Démarrer le serveur
python manage.py runserver
```

### Étape 2: Frontend

```bash
# Aller dans le dossier frontend
cd frontend

# Installer les dépendances
npm install
# ou
pnpm install
# ou
bun install

# Vérifier que VITE_API_URL est correct dans .env
# VITE_API_URL=http://127.0.0.1:8000

# Démarrer le dev server
npm run dev
```

### Étape 3: Tester l'Endpoint

**Depuis le navigateur ou Postman:**

```bash
# Tester avec une requête authentifiée
curl -X GET "http://127.0.0.1:8000/api/resources/saved/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 📋 Configuration du .env Backend

**Créez `backend/.env`:**

```properties
# Database
DATABASE_URL=sqlite:///db.sqlite3
# OU pour PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/campus_sphere

# Debug
DEBUG=True
SECRET_KEY=your-super-secret-key-here

# CORS
ALLOWED_HOSTS=localhost,127.0.0.1,localhost:3000,127.0.0.1:3000

# JWT
JWT_SECRET=your-jwt-secret-key

# Email (optionnel pour dev)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

---

## 📋 Configuration du .env Frontend

**Créez `frontend/.env`:**

```properties
VITE_API_URL=http://127.0.0.1:8000
```

---

## 🐛 Problèmes Courants et Solutions

### ❌ Erreur: "CORS policy: No 'Access-Control-Allow-Origin'"

**Cause**: Le port du frontend n'est pas dans `CORS_ALLOWED_ORIGINS`

**Solution**:
1. Identifiez le port exact du frontend (ex: `5173` pour Vite)
2. Mettez à jour dans `backend/campus_sphere/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",  # ← Ajoutez votre port
    "http://127.0.0.1:3000",
]
```
3. Redémarrez le backend

### ❌ Erreur: "401 Unauthorized"

**Cause**: Token d'accès expiré ou absent

**Solution**:
1. Vérifiez que vous êtes authentifiés
2. Vérifiez que le token est dans localStorage
3. Vérifiez que le token est envoyé dans le header `Authorization: Bearer TOKEN`

### ❌ Erreur: "GET /api/resources/saved/ 404"

**Cause**: L'endpoint n'existe pas ou n'est pas enregistré

**Vérification**: 
- ✅ Endpoint existe: `backend/resources/urls.py` ligne avec `path('saved/', ...)`
- ✅ Vue existe: `backend/resources/views.py` contient `def user_saved_resources(request)`

### ❌ "Network Error" ou "Cannot reach server"

**Cause**: Backend n'est pas démarré ou port incorrect

**Solution**:
```bash
# Testez la connectivité
curl http://127.0.0.1:8000/api/health/

# Vous devriez voir: {"status": "ok"} ou similaire
```

---

## 🔄 Flux de Communication Exemple

### Exemple: Charger les ressources sauvegardées (comme dans `SavedItems.tsx`)

```
Frontend                          Backend
   |                                |
   |------ GET /api/resources/saved/ (+ JWT Token)
   |----------------------------------------->
   |                                |
   |                          1. Valider Token JWT
   |                          2. Vérifier Permission IsAuthenticated
   |                          3. Récupérer ResourceSave objects
   |                          4. Sérialiser en JSON
   |                                |
   |<------ Response 200 + JSON Array
   |<----------------------------------------
   |
   Map data & setState
   |
   Rendu UI
```

---

## ✨ Fichiers Importants

| Fichier | Rôle |
|---------|------|
| `frontend/src/services/api.ts` | Centralisateur des appels API |
| `frontend/.env` | Configuration variables Vite |
| `backend/campus_sphere/settings.py` | Configuration Django/CORS |
| `backend/campus_sphere/urls.py` | Routes principales |
| `backend/resources/urls.py` | Routes des ressources |
| `backend/resources/views.py` | Logique des ressources |

---

## 📞 Prochaines Étapes

1. **Vérifiez la structure du `.env`** du frontend et backend
2. **Démarrez le backend** et testez `/api/health/`
3. **Démarrez le frontend** et ouvrez la console (F12)
4. **Testez un endpoint** (ex: login) et vérifiez les requêtes dans Network tab
5. **Vérifiez les tokens** dans localStorage après authentification

---

**✅ La communication est architecturalement correcte. C'est une question de configuration et de démarrage des deux serveurs!**
