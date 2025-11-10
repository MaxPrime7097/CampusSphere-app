# Vérification de l'inscription - Guide de diagnostic

## Problème

L'inscription ne fonctionne pas et la base de données ne s'écrit pas.

## Étapes de vérification

### 1. Vérifier que les migrations sont exécutées

```powershell
# Vérifier l'état des migrations
python manage.py showmigrations

# Si des migrations ne sont pas appliquées, exécutez :
python manage.py migrate
```

### 2. Exécuter le script de vérification

```powershell
python check_database_setup.py
```

Ce script vérifie :
- ✅ Le fichier .env existe
- ✅ DATABASE_URL est défini
- ✅ La connexion à Supabase fonctionne
- ✅ Les migrations sont appliquées
- ✅ La table users_user existe
- ✅ Le modèle User fonctionne
- ✅ Le serializer d'inscription fonctionne

### 3. Vérifier manuellement la connexion

```powershell
# Tester la connexion
python manage.py check --database default

# Vérifier les tables dans Supabase
# Allez sur https://app.supabase.com > Table Editor
# Vous devriez voir les tables Django créées
```

### 4. Vérifier l'endpoint d'inscription

L'endpoint d'inscription est : `POST /api/users/auth/register/`

**Format de la requête :**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "confirm_password": "password123",
  "university": "douala",
  "faculty": "informatique",
  "study_year": "l3",
  "student_id": "2021001234"
}
```

### 5. Vérifier les logs Django

Lorsque vous essayez de vous inscrire, vérifiez :
- Les logs dans la console où Django tourne
- Les erreurs dans la réponse de l'API
- Les logs dans `logs/campus_sphere.log`

### 6. Vérifier dans Supabase

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **Table Editor**
4. Vérifiez que la table `users_user` existe
5. Vérifiez si des utilisateurs ont été créés

## Problèmes courants

### Problème 1 : Les migrations ne sont pas appliquées

**Solution :**
```powershell
python manage.py migrate
```

### Problème 2 : La connexion à la base de données échoue

**Vérifiez :**
- DATABASE_URL est correct dans `.env`
- Le mot de passe est correct
- Le hostname est correct
- La connexion Internet fonctionne

### Problème 3 : Les tables n'existent pas

**Solution :**
```powershell
# Supprimer toutes les migrations (ATTENTION : perte de données)
python manage.py migrate --fake users zero
python manage.py migrate --fake-initial

# Ou recréer les migrations
python manage.py makemigrations
python manage.py migrate
```

### Problème 4 : Erreur de validation du serializer

**Vérifiez :**
- Tous les champs requis sont fournis
- Les mots de passe correspondent
- L'email n'est pas déjà utilisé
- Le username n'est pas déjà utilisé

### Problème 5 : Erreur de permissions

**Vérifiez :**
- Les permissions de la base de données Supabase
- Les restrictions IP dans Supabase
- Les permissions de l'utilisateur PostgreSQL

## Test rapide

Pour tester rapidement l'inscription via curl ou Postman :

```bash
curl -X POST http://localhost:8000/api/users/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpassword123",
    "confirm_password": "testpassword123",
    "university": "Test University",
    "faculty": "Test Faculty",
    "study_year": "L3"
  }'
```

## Si le problème persiste

1. Exécutez le script de vérification : `python check_database_setup.py`
2. Vérifiez les logs Django
3. Vérifiez les erreurs dans la console du navigateur
4. Vérifiez la réponse de l'API (status code, message d'erreur)
5. Vérifiez dans Supabase Table Editor si les données sont écrites

