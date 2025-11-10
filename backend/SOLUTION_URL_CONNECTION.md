# Solution : Utiliser l'URL de connexion complète

## Problème

L'IPv6 n'est pas accessible depuis votre machine Windows, ce qui cause l'erreur "Network is unreachable".

## Solution : Utiliser DATABASE_URL

La meilleure solution est d'utiliser l'URL de connexion complète depuis Supabase avec `dj-database-url`.

### Étape 1 : Installer dj-database-url

```powershell
pip install dj-database-url==2.1.0
```

Ou si vous utilisez requirements.txt :

```powershell
pip install -r requirements.txt
```

### Étape 2 : Récupérer l'URL de connexion depuis Supabase

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **Settings** > **Database**
4. Faites défiler jusqu'à **Connection string**
5. **Copiez l'URL complète** depuis la section **URI** ou **Connection pooling**

L'URL ressemble à :
```
postgresql://postgres:[YOUR-PASSWORD]@db.hhgjweyhvbwfzmltobti.supabase.co:5432/postgres?sslmode=require
```

**⚠️ Important :** Remplacez `[YOUR-PASSWORD]` par votre mot de passe Supabase.

### Étape 3 : Ajouter DATABASE_URL dans votre fichier .env

Ajoutez cette ligne dans votre fichier `backend/.env` :

```env
DATABASE_URL=postgresql://postgres:xrIVSJt84S9uEvZg@db.hhgjweyhvbwfzmltobti.supabase.co:5432/postgres?sslmode=require
```

**Remplacez :**
- `xrIVSJt84S9uEvZg` par votre mot de passe Supabase
- `db.hhgjweyhvbwfzmltobti.supabase.co` par votre hostname Supabase

### Étape 4 : Retirer DB_HOST_IPV6

Si vous avez ajouté `DB_HOST_IPV6` dans votre `.env`, vous pouvez le retirer maintenant.

Votre fichier `.env` devrait contenir :

```env
# Django Configuration
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Supabase PostgreSQL Database Configuration
DATABASE_URL=postgresql://postgres:xrIVSJt84S9uEvZg@db.hhgjweyhvbwfzmltobti.supabase.co:5432/postgres?sslmode=require
```

### Étape 5 : Tester la connexion

```powershell
python manage.py check --database default
python manage.py migrate
```

## Pourquoi cette solution fonctionne

`dj-database-url` gère mieux les connexions PostgreSQL et peut mieux gérer les problèmes de DNS et de résolution d'adresses. Il utilise l'URL complète qui contient toutes les informations nécessaires.

## Alternative : Utiliser Connection Pooling

Si l'URL directe ne fonctionne pas, essayez d'utiliser l'URL de **Connection Pooling** depuis Supabase :

1. Dans Supabase, allez dans **Settings** > **Database**
2. Faites défiler jusqu'à **Connection pooling**
3. Copiez l'URL depuis cette section
4. Utilisez-la dans `DATABASE_URL`

L'URL de Connection Pooling peut être différente et parfois plus fiable.

