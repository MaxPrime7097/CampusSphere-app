# Configuration Supabase pour CampusSphere

Ce guide vous explique comment connecter votre backend Django à Supabase comme base de données PostgreSQL.

## 📋 Prérequis

1. Un compte Supabase (gratuit) : https://supabase.com
2. Python 3.12+ avec `psycopg2-binary` installé (déjà dans `requirements.txt`)

## 🚀 Étapes de configuration

### 1. Créer un projet Supabase

1. Allez sur https://app.supabase.com
2. Cliquez sur "New Project"
3. Remplissez les informations :
   - **Name** : CampusSphere (ou votre nom de projet)
   - **Database Password** : Choisissez un mot de passe fort (⚠️ **SAVEZ-LE**, vous en aurez besoin)
   - **Region** : Choisissez la région la plus proche de vos utilisateurs
4. Cliquez sur "Create new project"
5. Attendez que le projet soit créé (2-3 minutes)

### 2. Récupérer les informations de connexion

1. Dans votre projet Supabase, allez dans **Settings** (icône d'engrenage en bas à gauche)
2. Cliquez sur **Database** dans le menu de gauche
3. Faites défiler jusqu'à la section **Connection string**
4. **⚠️ RECOMMANDÉ : Utilisez "Connection pooling" (Session mode)** - C'est la solution la plus fiable, surtout sur Windows

**Option 1 : Utiliser DATABASE_URL (RECOMMANDÉ - Le plus fiable)**

Copiez l'URL complète depuis la section **Connection pooling** > **Session mode**. Elle ressemble à :
```
postgresql://postgres:[YOUR-PASSWORD]@aws-0-xx-xx.pooler.supabase.com:6543/postgres?sslmode=require
```

**Option 2 : Utiliser les paramètres individuels**

Si vous préférez utiliser des paramètres séparés :
- **Host** : `db.xxxxx.supabase.co` (dans l'URL de connexion directe) ou `aws-0-xx-xx.pooler.supabase.com` (pour connection pooling)
- **Database name** : `postgres` (par défaut)
- **Port** : `5432` (direct) ou `6543` (connection pooling)
- **User** : `postgres`
- **Password** : Le mot de passe que vous avez créé lors de la création du projet

### 3. Créer le fichier `.env`

Créez un fichier `.env` à la racine du dossier `backend/` avec le contenu suivant :

**Option 1 : Utiliser DATABASE_URL (RECOMMANDÉ - Le plus fiable)**

```env
# Django Configuration
SECRET_KEY=your-super-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Supabase PostgreSQL Database Configuration (Connection Pooling - RECOMMANDÉ)
# Copiez l'URL complète depuis Supabase > Settings > Database > Connection pooling > Session mode
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@aws-0-xx-xx.pooler.supabase.com:6543/postgres?sslmode=require
```

**Option 2 : Utiliser les paramètres individuels**

```env
# Django Configuration
SECRET_KEY=your-super-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Supabase PostgreSQL Database Configuration
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=votre-mot-de-passe-supabase
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_SSLMODE=require
```

**⚠️ Important :**
- **Recommandation :** Utilisez `DATABASE_URL` avec Connection Pooling (Option 1) - C'est la solution la plus fiable, surtout sur Windows
- Remplacez `[YOUR-PASSWORD]` ou `votre-mot-de-passe-supabase` par le mot de passe que vous avez créé
- Remplacez `aws-0-xx-xx.pooler.supabase.com` ou `db.xxxxx.supabase.co` par votre host Supabase
- Changez `SECRET_KEY` par une clé secrète forte (générez-en une avec `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)

### 4. Installer les dépendances

Assurez-vous que toutes les dépendances sont installées :

```bash
cd backend
pip install -r requirements.txt
```

**Note :** `dj-database-url` est maintenant inclus dans `requirements.txt` pour supporter `DATABASE_URL`.

### 5. Tester la connexion

Testez la connexion à Supabase :

```bash
python manage.py check --database default
```

Si tout fonctionne, vous devriez voir :
```
System check identified no issues (0 silenced).
```

### 6. Exécuter les migrations

Une fois la connexion établie, exécutez les migrations pour créer les tables dans Supabase :

```bash
python manage.py migrate
```

### 7. Créer un superutilisateur (optionnel)

```bash
python manage.py createsuperuser
```

## 🔒 Sécurité

### Variables d'environnement sensibles

**⚠️ NE COMMITEZ JAMAIS le fichier `.env` dans Git !**

Le fichier `.env` contient des informations sensibles :
- Mot de passe de la base de données
- Clé secrète Django
- Autres credentials

Assurez-vous que `.env` est dans votre `.gitignore` :

```gitignore
# Environment variables
.env
.env.local
.env.*.local
```

### Générer une SECRET_KEY sécurisée

Pour générer une nouvelle `SECRET_KEY` :

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## 🐛 Dépannage

### Erreur : "could not translate host name ... to address: Unknown server error"

**⚠️ Cette erreur signifie que le hostname Supabase ne peut pas être résolu par DNS.**

**Causes possibles :**
1. Le hostname est incorrect ou mal copié
2. Le projet Supabase n'existe pas ou a été supprimé
3. Le projet Supabase est en pause
4. Problème de DNS/réseau sur votre machine

**Solutions :**

1. **Vérifiez le hostname dans Supabase :**
   - Allez sur https://app.supabase.com
   - Sélectionnez votre projet
   - Allez dans **Settings** > **Database**
   - Faites défiler jusqu'à **Connection string**
   - Copiez le hostname depuis la section **URI** ou **Connection pooling**
   - Le format correct est : `db.xxxxx.supabase.co` (où xxxxx est votre project reference)
   - ⚠️ **Assurez-vous qu'il n'y a pas d'espaces ou de caractères incorrects**

2. **Vérifiez que votre projet Supabase est actif :**
   - Allez sur https://app.supabase.com
   - Vérifiez que votre projet n'est pas en pause
   - Si c'est le cas, réactivez-le (les projets gratuits peuvent être mis en pause après inactivité)

3. **Testez la résolution DNS :**
   ```bash
   # Sur Windows PowerShell
   nslookup db.xxxxx.supabase.co
   
   # Ou avec ping
   ping db.xxxxx.supabase.co
   ```
   Si ces commandes échouent, le problème vient de la résolution DNS.

4. **Vérifiez votre connexion Internet et pare-feu**

5. **Essayez de recréer le projet Supabase** si le problème persiste

### Erreur : "could not connect to server"

**Causes possibles :**
1. Le mot de passe est incorrect
2. L'host est incorrect
3. Le port est incorrect
4. Votre IP n'est pas autorisée (voir ci-dessous)

**Solution :** Vérifiez toutes les variables dans votre fichier `.env`

### Erreur : "password authentication failed"

**Cause :** Le mot de passe dans `.env` ne correspond pas au mot de passe Supabase.

**Solution :** 
1. Vérifiez le mot de passe dans Supabase (Settings > Database)
2. Si vous l'avez oublié, vous devrez le réinitialiser dans Supabase

### Erreur : "connection refused" ou timeout

**Cause :** Votre IP n'est peut-être pas autorisée à se connecter à Supabase.

**Solution :**
1. Dans Supabase, allez dans **Settings** > **Database**
2. Faites défiler jusqu'à **Connection pooling**
3. Vérifiez les restrictions IP
4. Pour le développement local, vous pouvez temporairement autoriser toutes les IP (⚠️ **pas recommandé pour la production**)

### Erreur : "SSL connection required"

**Cause :** Supabase exige des connexions SSL.

**Solution :** Assurez-vous que `DB_SSLMODE=require` est dans votre `.env`

## 📊 Vérifier la connexion dans Supabase

1. Allez dans votre projet Supabase
2. Cliquez sur **Table Editor** dans le menu de gauche
3. Vous devriez voir toutes les tables créées par Django après avoir exécuté `migrate`

## 🔄 Migration depuis SQLite

Si vous aviez déjà des données dans SQLite et que vous voulez les migrer :

1. **Exportez les données depuis SQLite :**
   ```bash
   python manage.py dumpdata > data.json
   ```

2. **Configurez Supabase** (suivez les étapes ci-dessus)

3. **Exécutez les migrations :**
   ```bash
   python manage.py migrate
   ```

4. **Importez les données :**
   ```bash
   python manage.py loaddata data.json
   ```

## 📚 Ressources supplémentaires

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Django PostgreSQL](https://docs.djangoproject.com/en/5.2/ref/databases/#postgresql-notes)
- [Documentation python-decouple](https://github.com/henriquebastos/python-decouple)

## ✅ Checklist de configuration

- [ ] Projet Supabase créé
- [ ] Informations de connexion récupérées
- [ ] Fichier `.env` créé avec les bonnes valeurs
- [ ] `SECRET_KEY` générée et ajoutée
- [ ] Connexion testée avec `python manage.py check`
- [ ] Migrations exécutées avec `python manage.py migrate`
- [ ] Superutilisateur créé (optionnel)
- [ ] Fichier `.env` ajouté au `.gitignore`

---

**Besoin d'aide ?** Consultez la documentation Supabase ou créez une issue sur le repository.

