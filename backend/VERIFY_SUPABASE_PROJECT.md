# ⚠️ Vérification URGENTE du projet Supabase

## Problème

Le hostname `db.clxcuiuixqausvouwnmj.supabase.co` ne peut **PAS** être résolu, même avec Google DNS. Cela signifie probablement que :

1. ❌ Le hostname est **incorrect**
2. ❌ Le projet Supabase **n'existe pas** ou a été **supprimé**
3. ❌ Le projet Supabase est **en pause**

## 🔍 Vérification IMMÉDIATE

### Étape 1 : Vérifier que le projet existe

1. Allez sur **https://app.supabase.com**
2. Connectez-vous à votre compte
3. **Vérifiez la liste de vos projets**
4. Cherchez un projet nommé "CampusSphere" ou similaire

### Étape 2 : Vérifier l'état du projet

Si le projet existe :
- ✅ **Actif** : Le projet fonctionne normalement
- ⏸️ **En pause** : Cliquez sur "Restore" ou "Resume" pour le réactiver
- ❌ **Supprimé** : Le projet n'existe plus

### Étape 3 : Récupérer le BON hostname

Si le projet existe et est actif :

1. Cliquez sur votre projet pour l'ouvrir
2. Allez dans **Settings** (icône d'engrenage en bas à gauche)
3. Cliquez sur **Database** dans le menu de gauche
4. Faites défiler jusqu'à **Connection string**
5. **Copiez le hostname EXACT** depuis une de ces sections :
   - **URI** : `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
   - **Connection pooling** : `db.xxxxx.supabase.co`
   - **Direct connection** : `db.xxxxx.supabase.co`

**⚠️ IMPORTANT :**
- Le hostname doit commencer par `db.`
- Il doit se terminer par `.supabase.co`
- Il ne doit **PAS** y avoir d'espaces
- Copiez **SEULEMENT** la partie hostname, pas l'URL complète

**Exemple de format correct :**
```
db.abcdefghijklmnop.supabase.co
```

**Exemple de format INCORRECT :**
```
clxcuiuixqausvouwnmj.supabase.co  ❌ (manque db.)
db.clxcuiuixqausvouwnmj           ❌ (manque .supabase.co)
```

### Étape 4 : Mettre à jour le fichier .env

Une fois que vous avez le **BON** hostname :

1. Ouvrez le fichier `backend/.env`
2. Trouvez la ligne `DB_HOST=`
3. Remplacez le hostname par celui que vous avez copié depuis Supabase
4. Sauvegardez le fichier

**Exemple :**
```env
DB_HOST=db.abcdefghijklmnop.supabase.co
```

### Étape 5 : Tester la connexion

Après avoir mis à jour le hostname :

```powershell
# Tester la résolution DNS
nslookup db.xxxxx.supabase.co

# Si ça fonctionne, tester la connexion Django
python manage.py check --database default

# Si tout fonctionne, exécuter les migrations
python manage.py migrate
```

## 🆕 Si le projet n'existe pas : Créer un nouveau projet

Si votre projet Supabase n'existe pas ou a été supprimé :

1. Allez sur **https://app.supabase.com**
2. Cliquez sur **"New Project"**
3. Remplissez les informations :
   - **Name** : CampusSphere
   - **Database Password** : Choisissez un mot de passe fort (⚠️ **SAVEZ-LE**)
   - **Region** : Choisissez la région la plus proche
4. Cliquez sur **"Create new project"**
5. Attendez que le projet soit créé (2-3 minutes)
6. Récupérez le nouveau hostname (voir Étape 3)
7. Mettez à jour votre fichier `.env` avec le nouveau hostname

## 🔧 Solution alternative : Utiliser Connection Pooling

Si le hostname direct ne fonctionne pas, essayez d'utiliser le **Connection Pooling** de Supabase :

1. Dans Supabase, allez dans **Settings** > **Database**
2. Faites défiler jusqu'à **Connection pooling**
3. Utilisez le hostname de **Connection pooling** (il peut être différent)
4. Le format est généralement : `db.xxxxx.supabase.co` ou `aws-0-xx-xx.pooler.supabase.com`

## 📝 Checklist

- [ ] J'ai vérifié que mon projet Supabase existe sur https://app.supabase.com
- [ ] Mon projet est **actif** (pas en pause)
- [ ] J'ai copié le **BON** hostname depuis Settings > Database > Connection string
- [ ] Le hostname commence par `db.` et se termine par `.supabase.co`
- [ ] J'ai mis à jour le fichier `backend/.env` avec le bon hostname
- [ ] J'ai testé la résolution DNS avec `nslookup`
- [ ] La connexion Django fonctionne avec `python manage.py check --database default`

---

**Si après toutes ces étapes le problème persiste, le hostname dans votre fichier `.env` est probablement incorrect. Vérifiez-le à nouveau dans Supabase.**

