# Guide de Déploiement Production

Le backend est **Node/Express**. Il se déploie via [`render.yaml`](../render.yaml) +
[`apps/backend/Dockerfile`](../apps/backend/Dockerfile) : ni Build Command ni Start Command à saisir dans
le dashboard, ils appartiennent au Dockerfile et à
[`docker-entrypoint.sh`](../apps/backend/docker-entrypoint.sh), qui applique les migrations avant de
démarrer.

Le nom du service, son URL, son plan, son health check et son port sont **inchangés** depuis
Django : aucune migration de service n'est nécessaire. L'historique Django est en [annexe](#annexe--ancien-déploiement-django).

## Architecture cible

```
Frontend (Vercel) ──── Backend (Render, N instances) ──── PostgreSQL (Supabase)
                              │         │
                        Supabase Auth   ├── Redis (fan-out WebSocket, rate limits, jobs)
                                        └── S3 (fichiers uploadés)
```

---

## 1. Prérequis

- Compte [Vercel](https://vercel.com) (frontend)
- Compte [Render](https://render.com) (backend)
- Projet [Supabase](https://supabase.com) (auth + base de données)
- **Une instance Redis** (Render Key Value, Upstash…) — voir §2.2
- Un **bucket S3** — le plan Render n'a pas de disque persistant
- Repository Git (GitHub recommandé)

---

## 2. Déploiement Backend (Render)

Le service est décrit par [`render.yaml`](../render.yaml). Rien à configurer manuellement hormis
les variables d'environnement, dont les **noms sont identiques à ceux de Django** : la
configuration existante du dashboard est reprise telle quelle.

### 2.1 Variables nouvelles ou dont le statut change

| Variable | Statut | Rôle |
|---|---|---|
| `DIRECT_URL` | **obligatoire** | Connexion non poolée (mode session), utilisée uniquement par `prisma migrate deploy`. Sans elle le conteneur s'arrête pendant l'entrypoint et le service ne démarre jamais. |
| `REDIS_URL` | **obligatoire** | Diffusion WebSocket entre instances, compteurs de rate limiting, élection des jobs. |
| `SINGLE_INSTANCE` | échappatoire | `true` autorise le démarrage sans `REDIS_URL`. Correct pour exactement une instance ; à retirer avant d'en ajouter une seconde. |
| `USE_S3` | **doit valoir `true`** | Le plan Render n'a pas de disque persistant : tout fichier écrit localement disparaît au redéploiement. |

Le serveur valide sa configuration au démarrage (`assertProductionConfig`) et **refuse de
démarrer** avec une `SECRET_KEY` de développement, `DEBUG=true`, `USE_S3=false`,
`DISABLE_RATE_LIMITS` posé, ou sans `REDIS_URL` ni `SINGLE_INSTANCE`. Une erreur de
configuration se voit donc au déploiement, pas en production.

### 2.2 Créer l'instance Redis

Dashboard Render → **New** → **Key Value**.

1. **Région : la même que le service web.** L'URL interne ne résout qu'à l'intérieur d'une région.
2. Copier l'**Internal Key Value URL** (`redis://red-…:6379`) — pas l'externe — dans `REDIS_URL`.

Le plan gratuit convient à cette charge : tout ce qui y est stocké est éphémère et se
reconstruit seul (compteurs de rate limiting et verrous de jobs portent un TTL, le pub/sub
n'est jamais persisté). À savoir : il est *in-memory only* — un redémarrage vide l'instance,
ce qui ne fait que réinitialiser des fenêtres de rate limiting — et limité à une instance
gratuite par workspace. Contrairement au Postgres gratuit de Render, il n'expire pas.

Alternative : Upstash. Son URL `rediss://` fonctionne sans configuration supplémentaire —
ioredis active TLS d'après le schéma.

### 2.3 Migrations

`docker-entrypoint.sh` exécute `prisma migrate deploy` avant de démarrer le serveur.
`migrate deploy` n'applique que des migrations déjà générées et ne réécrit jamais l'historique,
ce qui le rend sûr au démarrage d'un conteneur.

Avec plusieurs instances, toutes tentent la migration simultanément. C'est **sans danger** —
Prisma prend un verrou consultatif Postgres, les exécutions se sérialisent — mais chaque
instance attend le verrou avant de pouvoir écouter son port, ce qui peut dépasser la fenêtre de
health check sur une migration lente. Une fois scalé, préférer le pre-deploy command de Render :

```yaml
preDeployCommand: npx prisma migrate deploy
```

et poser `RUN_MIGRATIONS_ON_START=false` pour ne pas faire le travail deux fois.

### 2.4 Scaler horizontalement

Augmenter le nombre d'instances suffit : **aucune session collante (sticky session) n'est
nécessaire**, les WebSockets partagent l'écouteur HTTP et la diffusion passe par Redis. Vérifier
que `REDIS_URL` est renseignée et que `SINGLE_INSTANCE` ne l'est pas — sinon chaque instance
retombe sur un état local et les événements de chat ne traversent plus les instances.

### 2.5 URL du service

| Hostname | Statut |
|---|---|
| `https://api.campussphere.app` | **À utiliser.** CNAME Cloudflare vers le service Render. Survit à un renommage du service. |
| `https://campus-sphere-backend-dyfu.onrender.com` | Hostname Render direct. Fonctionne, mais change si le service est renommé. |
| `https://campus-sphere-backend.onrender.com` | **N'existe pas.** `campus-sphere-backend` est le nom du *service* ; Render y ajoute un suffixe pour former le hostname. |

---

## 3. Déploiement Frontend (Vercel)

Le monorepo héberge deux applications frontend déployées sur **deux projets Vercel distincts** :

### 3.1 Projet Vercel : CampusSphere (`campussphere.app`)

1. **Root Directory** : `apps/campus`
2. **Build Command** : `pnpm build`
3. **Output Directory** : `dist`
4. **Install Command** : `pnpm install`

**Variables d'environnement requises :**
```env
VITE_API_URL=https://api.campussphere.app
VITE_APP_NAME=CampusSphere
VITE_APP_ENV=production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SPHERA_STANDALONE_URL=https://sphera.campussphere.app
```

### 3.2 Projet Vercel : Sphera (`sphera.campussphere.app`)

1. **Root Directory** : `apps/sphera`
2. **Build Command** : `pnpm build`
3. **Output Directory** : `dist`
4. **Install Command** : `pnpm install`

**Variables d'environnement requises :**
```env
VITE_API_URL=https://api.campussphere.app
```

`VITE_API_URL` doit être défini sur **les trois environnements** (Production, Preview,
Development), puis le projet **redéployé** : Vite inline `import.meta.env` à la compilation,
un déploiement existant ne prendra pas la variable en compte.

### 3.3 Configuration de routing SPA

Les configurations de routing SPA et de redirection sont gérées directement dans chaque application (`apps/campus/vercel.json` et `apps/sphera/vercel.json`).

### 3.4 CORS

Origines autorisées par défaut, vérifiées contre un serveur en marche :

```
http://localhost:5173, http://localhost:8080,
https://campussphere.app, https://www.campussphere.app, https://sphera.campussphere.app
```

Laisser `CORS_ALLOWED_ORIGINS` **non renseignée** pour en bénéficier. La variable **remplace**
ces défauts au lieu de s'y ajouter : si elle est posée, elle doit lister *toutes* les origines,
sinon le navigateur bloquera les requêtes venant de celles qui manquent. À noter que
`http://localhost:4173` — port de `vite preview` pour Sphera standalone — n'est pas dans les
défauts.

---

## 4. Configuration Supabase

### 4.1 URL de redirection

Dans **Authentication → URL Configuration** :

```
Site URL: https://your-frontend.vercel.app

Redirect URLs:
  https://your-frontend.vercel.app/register
  https://your-frontend.vercel.app/auth/callback
```

### 4.2 Providers OAuth

Dans **Authentication → Providers** :
- **Google** : Activer + configurer Client ID/Secret depuis Google Cloud Console
- **Facebook** : Activer + configurer App ID/Secret depuis Meta Developers

### 4.3 Quotas email

Voir [SUPABASE_EMAIL_LIMITS.md](./SUPABASE_EMAIL_LIMITS.md).

---

## 5. Base de données

PostgreSQL Supabase. **Deux chaînes de connexion sont nécessaires**, prises dans
**Project Settings → Database → Connection string → Connection pooling** :

```env
# Pooler, mode transaction (port 6543) — l'application
DATABASE_URL=postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true

# Pooler, mode session (port 5432) — les migrations uniquement
DIRECT_URL=postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

Trois pièges :

- **`pgbouncer=true` est obligatoire** sur `DATABASE_URL`. Le pooler est en mode transaction ; sans
  ce drapeau les *prepared statements* de Prisma cassent.
- **Ne pas utiliser l'hôte direct `db.<ref>.supabase.co`** : il ne résout qu'en IPv6 et reste
  injoignable depuis tout réseau sans sortie IPv6, dont Render.
- **`connection_limit=1`** apparaît dans la documentation Supabase : c'est un conseil pour les
  fonctions serverless, où chaque invocation est un processus distinct. Ici le backend est un
  conteneur long-vivant servant des requêtes concurrentes, et une limite de 1 sérialise toutes
  les requêtes derrière une seule connexion. Laisser la valeur par défaut de Prisma.

---

## 6. Checklist post-déploiement

- [ ] `GET /api/health/` retourne `{"status": "healthy", ...}`
- [ ] Les logs de démarrage montrent `[entrypoint] applying database migrations` sans erreur
- [ ] Aucun message `assertProductionConfig` au démarrage
- [ ] Inscription email fonctionne (email de vérification reçu)
- [ ] Inscription Google/Facebook fonctionne
- [ ] Upload de fichiers fonctionne **et le fichier survit à un redéploiement** (vérifie `USE_S3`)
- [ ] Le chat temps réel fonctionne entre deux navigateurs
- [ ] CORS : aucune erreur dans la console du navigateur
- [ ] `VITE_API_URL` pointe sur le backend (onglet Réseau : les requêtes ne vont pas sur `127.0.0.1:8000`)
- [ ] Variables d'environnement toutes renseignées, `DIRECT_URL` comprise

---

## 7. Développement local

### Backend
```bash
cd backend
cp .env.example .env            # renseigner au minimum DATABASE_URL et DIRECT_URL
npm install
npx prisma generate
npx prisma migrate deploy       # jamais `migrate dev` — voir backend/README.md
npm run dev                     # http://127.0.0.1:3000
```

Redis est optionnel en local : chaque sous-système retombe sur une implémentation locale au
processus, correcte pour une instance unique.

### Frontend
```bash
cd frontend
npm install
# Créer .env avec VITE_API_URL=http://127.0.0.1:3000 et les clés Supabase
npm run dev
```

### Vérifications qualité
```bash
# Backend
cd backend
npm run typecheck
npm run build

npm run test:defects          # intégration : défauts + parcours. Démarre son propre serveur.

npm run dev:test              # terminal 1 — rate limits désactivés
npm run test:contract         # terminal 2 — contrat + tests unitaires

# Frontend
cd frontend
npm run build
npm run lint
```

Deux scripts couvrent plus que leur nom ne le laisse penser : `test:contract` exécute aussi les
tests unitaires (`vitest.config.ts` inclut `*.contract.test.ts` **et** `*.unit.test.ts`), et
`test:defects` exécute toute la suite d'intégration, parcours utilisateur compris.

Détail des suites et lecture des échecs : [backend/README.md](../backend/README.md).

---

## 8. Rollback

1. **Vercel** : Deployments → sélectionner un déploiement précédent → **Promote to Production**
2. **Render** : service → **Manual Deploy** → sélectionner un commit précédent
3. **Base de données** : restaurer depuis un backup Supabase

⚠️ Un rollback applicatif ne défait **pas** les migrations Prisma déjà appliquées. Revenir à un
commit antérieur au schéma courant suppose une migration descendante écrite à la main, ou une
restauration de backup.

---

## 9. Sécurité

- Ne jamais committer les fichiers `.env` (`backend/.gitignore` les exclut)
- `SECRET_KEY` doit être unique et aléatoire en production — le serveur refuse les valeurs de développement
- `DEBUG=false` obligatoire en production
- `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais être exposé côté frontend
- `DISABLE_RATE_LIMITS` est refusé en production
- Rate limiting actif par défaut : anonyme 60/h, génération invité 5/h, login 10/15 min par
  compte et 100/h par IP, inscription 30/h. Le double clé (IP, email) évite qu'un campus
  derrière un NAT unique se bloque lui-même.
- `/api/auth/supabase/debug/` est réservé aux admins — la version Django divulguait à tout
  appelant anonyme les secrets configurés et le JWKS

---

## Annexe — ancien déploiement Django

Conservé pour référence ; **ne s'applique plus**. L'implémentation est sous
`legacy/django-backend/`.

<details>
<summary>Configuration Render historique</summary>

- **Root Directory** : `backend`
- **Build Command** : `pip install -r requirements.txt`
- **Start Command** : `gunicorn campus_sphere.wsgi:application`
- Après déploiement : `python manage.py migrate && python manage.py collectstatic --noinput`

Les variables d'environnement portaient déjà les noms utilisés aujourd'hui, à l'exception de
`CSRF_TRUSTED_ORIGINS` (spécifique à Django, sans équivalent ici), `DIRECT_URL`, `REDIS_URL`
et `SINGLE_INSTANCE`.

</details>
