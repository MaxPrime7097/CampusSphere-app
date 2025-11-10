# Mise à jour du fichier .env

## Solution : Utiliser directement l'adresse IPv6

Le problème est que Windows ne résout pas correctement les hostnames Supabase via DNS, même avec le fichier hosts. La solution est d'utiliser directement l'adresse IPv6.

## Action requise

Ajoutez cette ligne dans votre fichier `backend/.env` :

```env
DB_HOST_IPV6=2a05:d018:135e:1614:1485:27bc:eefc:3fd8
```

Votre fichier `.env` devrait maintenant contenir :

```env
# Django Configuration
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Supabase PostgreSQL Database Configuration
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=xrIVSJt84S9uEvZg
DB_HOST=db.hhgjweyhvbwfzmltobti.supabase.co
DB_HOST_IPV6=2a05:d018:135e:1614:1485:27bc:eefc:3fd8
DB_PORT=5432
DB_SSLMODE=require
```

## Test

Après avoir ajouté `DB_HOST_IPV6`, testez :

```powershell
python manage.py check --database default
python manage.py migrate
```

## Comment ça fonctionne

Le code Django vérifie maintenant si `DB_HOST_IPV6` est défini. Si c'est le cas, il utilise directement l'adresse IPv6 au lieu du hostname, ce qui contourne complètement le problème de résolution DNS.

