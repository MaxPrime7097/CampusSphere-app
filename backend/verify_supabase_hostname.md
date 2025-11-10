# Vérification du hostname Supabase

## Problème actuel

Le hostname `db.clxcuiuixqausvouwnmj.supabase.co` ne peut pas être résolu par DNS.

## Solutions à essayer

### 1. Vérifier le hostname dans Supabase

**Étapes :**
1. Allez sur https://app.supabase.com
2. Connectez-vous à votre compte
3. Sélectionnez votre projet (ou créez-en un nouveau si nécessaire)
4. Allez dans **Settings** (icône d'engrenage en bas à gauche)
5. Cliquez sur **Database** dans le menu de gauche
6. Faites défiler jusqu'à la section **Connection string**
7. **Copiez le hostname exact** depuis une de ces sections :
   - **URI** : `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
   - **Connection pooling** : `db.xxxxx.supabase.co`
   - **Direct connection** : `db.xxxxx.supabase.co`

**⚠️ Important :**
- Le hostname doit commencer par `db.` et se terminer par `.supabase.co`
- Il ne doit pas y avoir d'espaces
- Vérifiez que vous copiez bien le hostname, pas l'URL complète

### 2. Vérifier que le projet est actif

Les projets Supabase gratuits peuvent être mis en pause après inactivité.

**Vérification :**
1. Allez sur https://app.supabase.com
2. Vérifiez l'état de votre projet sur le dashboard
3. Si le projet est en pause, cliquez sur "Restore" ou "Resume"

### 3. Tester avec un autre DNS

Si votre DNS local ne fonctionne pas, essayez avec Google DNS :

```powershell
# Tester avec Google DNS
nslookup db.xxxxx.supabase.co 8.8.8.8

# Ou avec Cloudflare DNS
nslookup db.xxxxx.supabase.co 1.1.1.1
```

### 4. Vérifier votre connexion Internet

Assurez-vous que vous avez une connexion Internet active et que vous pouvez accéder à d'autres sites.

### 5. Recréer le projet Supabase (si nécessaire)

Si le projet n'existe plus ou si vous ne pouvez pas le retrouver :

1. Allez sur https://app.supabase.com
2. Cliquez sur "New Project"
3. Remplissez les informations :
   - **Name** : CampusSphere
   - **Database Password** : Choisissez un mot de passe fort (⚠️ **SAVEZ-LE**)
   - **Region** : Choisissez la région la plus proche
4. Attendez que le projet soit créé (2-3 minutes)
5. Récupérez le nouveau hostname depuis Settings > Database

### 6. Mettre à jour le fichier .env

Une fois que vous avez le bon hostname, mettez à jour votre fichier `backend/.env` :

```env
DB_HOST=db.xxxxx.supabase.co
```

Remplacez `db.xxxxx.supabase.co` par le hostname correct que vous avez copié depuis Supabase.

## Test de connexion

Après avoir mis à jour le hostname, testez la connexion :

```bash
# Tester la résolution DNS
nslookup db.xxxxx.supabase.co

# Tester la connexion Django
python manage.py check --database default

# Si ça fonctionne, exécutez les migrations
python manage.py migrate
```

## Format correct du hostname

Le hostname Supabase a toujours ce format :
```
db.[project-reference].supabase.co
```

Où `[project-reference]` est une chaîne aléatoire générée par Supabase.

**Exemples valides :**
- `db.abcdefghijklmnop.supabase.co`
- `db.xyz1234567890abc.supabase.co`

**⚠️ Ce format est INCORRECT :**
- `clxcuiuixqausvouwnmj.supabase.co` (manque le préfixe `db.`)
- `db.clxcuiuixqausvouwnmj` (manque le suffixe `.supabase.co`)

