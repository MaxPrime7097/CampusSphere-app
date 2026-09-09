# Authentification CampusSphere

CampusSphere utilise **Supabase Auth** comme fournisseur d'identité. Après vérification, un token Supabase est échangé contre un **JWT signé par le backend** pour accéder à l'API.

Le backend vérifie la signature du token Supabase avant tout échange. La version Django acceptait,
en mode `DEBUG`, des tokens **non vérifiés** ; ce comportement n'a délibérément pas été reproduit.

---

## Flux d'inscription par email

```
1. Utilisateur remplit l'étape 1 (nom, prénom, username, email, téléphone,
   date de naissance, mot de passe)
   └─ supabaseSignUp() → emailRedirectTo: /register?verified=true

2. Supabase envoie un email de vérification → écran "verify" affiché

3. Utilisateur clique sur le lien → redirigé vers /register?verified=true
   └─ Register.tsx détecte le paramètre verified=true via useSearchParams
   └─ supabase.auth.getSession() → exchangeSupabaseToken(access_token)
   └─ Le backend crée l'utilisateur (is_profile_complete=false)
   └─ setStep(2) → continue l'inscription sur la même page

4. Étape 2 : infos académiques
   └─ UniversityCombobox, FacultyCombobox, StudyLevelCombobox, matricule, campus

5. Étape 3 : expériences & compétences
   └─ AddEducationModal, AddExperienceModal, SkillsCombobox, InterestsCombobox, portfolio

6. handleFinalSubmit() → completeSupabaseProfile()
   └─ is_profile_complete devient true (dérivé des champs renseignés)
   └─ Redirection vers /
```

---

## Flux d'inscription OAuth (Google / Facebook)

```
1. Utilisateur clique "Continuer avec Google/Facebook"
   └─ supabaseSignInWithGoogle() → redirectTo: /auth/callback

2. Supabase gère l'OAuth → redirige vers /auth/callback

3. AuthCallback.tsx :
   └─ supabase.auth.getSession()
   └─ exchangeSupabaseToken(access_token)
   └─ Le backend crée l'utilisateur (is_profile_complete=false)
   └─ response.data.needs_profile_completion = true
   └─ navigate('/complete-profile')

4. CompleteProfile.tsx (3 étapes, sans mot de passe) :
   - Étape 1 : username, date de naissance, téléphone (+237), ville, langue
   - Étape 2 : université, filière, niveau, matricule, campus
   - Étape 3 : formations, expériences, compétences, intérêts, portfolio

5. handleSubmit() → completeSupabaseProfile()
   └─ is_profile_complete devient true (dérivé des champs renseignés)
   └─ Redirection vers /
```

---

## Flux de connexion

```
Email/Mot de passe :
  supabaseSignIn(email, password)
  → supabase.auth.signInWithPassword()
  → exchangeSupabaseToken(access_token)
  → JWT applicatif stocké dans localStorage
  → Si needs_profile_completion → /complete-profile
  → Sinon → /

OAuth :
  supabaseSignInWithGoogle/Facebook()
  → /auth/callback
  → exchangeSupabaseToken(access_token)
  → Si needs_profile_completion=true → /complete-profile
  → Sinon → /
```

---

## Endpoint d'échange de token

### POST `/api/users/auth/supabase/exchange-token/`

Auth requise : **Non**

**Body** :
```json
{ "access_token": "<supabase_access_token>" }
```

**Response** :
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "<access_jwt>",
      "refreshToken": "<refresh_jwt>"
    },
    "needs_profile_completion": false,
    "is_new_user": false
  }
}
```

`needs_profile_completion` est `true` quand :
- L'utilisateur vient d'être créé via OAuth
- Le profil existant est incomplet (`is_profile_complete=false`)

---

## Endpoint de complétion de profil

### POST `/api/users/auth/supabase/complete-profile/`

Auth requise : **Oui** — Bearer token applicatif

**Body** :
```json
{
  "username": "john_doe",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+237600000000",
  "date_of_birth": "2000-01-15",
  "university": "universite_yaounde_1",
  "faculty": "developpement_web",
  "study_year": "l3",
  "student_id": "21A001",
  "campus": "Campus Principal",
  "town": "Yaoundé",
  "language": "fr",
  "bio": "Étudiant passionné...",
  "skills": ["React", "Python"],
  "interests": ["Programmation", "IA"],
  "previous_education": [
    { "degree": "licence", "school": "universite_yaounde_1", "year": "2021-2024" }
  ],
  "experiences": [
    { "title": "developpeur_web", "company": "campussphere", "duration": "3 mois", "description": "..." }
  ],
  "portfolio_links": [
    { "name": "GitHub", "url": "https://github.com/johndoe" }
  ]
}
```

Champs qui déterminent la complétude : **`university`, `faculty`, `study_year`**.

⚠️ `username` et `student_id` ne sont **pas** pris en compte, contrairement à ce que suppose
`AuthCallback.tsx` côté frontend — voir [FRONTEND_CHANGES.md](./FRONTEND_CHANGES.md) `FE-09`.
Les autres champs du body sont acceptés et enregistrés, mais n'influent pas sur
`is_profile_complete`.

**Response** :
```json
{
  "success": true,
  "data": { ... },
  "message": "Profil complété avec succès"
}
```

---

## Stockage des tokens

Les tokens applicatifs sont stockés dans `localStorage` :
- `access` → JWT d'accès (court terme)
- `refresh` → Token de rafraîchissement (long terme)

Le service `api.ts` gère automatiquement :
- La détection de l'expiration du token
- Le rafraîchissement via `POST /api/auth/refresh/`
- Le retry automatique de la requête originale après rafraîchissement
- La déconnexion si le refresh token est expiré

---

## Configuration Supabase Dashboard

Dans **Authentication → URL Configuration** :

```
Site URL: http://localhost:5173 (dev) / https://votre-domaine.com (prod)

Redirect URLs (à whitelister) :
  http://localhost:5173/register
  http://localhost:5173/auth/callback
  http://127.0.0.1:5173/register
  http://127.0.0.1:5173/auth/callback
  https://votre-domaine.vercel.app/register
  https://votre-domaine.vercel.app/auth/callback
  https://votre-domaine.com/register
  https://votre-domaine.com/auth/callback
```

Notes :
- Le paramètre `?verified=true` est ajouté côté frontend — l'URL `/register` suffit dans Supabase.
- Le `redirectTo` est toujours `window.location.origin` → whitelister toutes les origines utilisées.
- Pour l'inscription OAuth, pas de mot de passe → l'utilisateur ne connaît que ses credentials Google/Facebook.

---

## Champ `is_profile_complete`

**Dérivé, jamais stocké.** Il est recalculé à chaque sérialisation d'utilisateur à partir de
trois champs — `university`, `faculty`, `study_year` — tous non vides :

```ts
// backend/src/serializers/user.ts
export function isProfileComplete(user): boolean
```

Tant qu'il vaut `false`, l'utilisateur est redirigé vers `/complete-profile` à chaque connexion.

> **Correctif de migration.** Django stockait ce drapeau en colonne et le calculait contre une
> liste de champs requis **vide** : `all([])` valant `True`, chaque connexion forçait
> `is_profile_complete=True` et personne n'était jamais renvoyé vers la complétion de profil.
> Le calcul dérivé supprime la classe entière de bugs de désynchronisation — modifier
> `university` remet mécaniquement le profil en incomplet, sans écriture ni migration.

---

## Limites d'envoi email Supabase

Si les emails de vérification sont bloqués (erreur 429) :

1. Aller dans **Authentication → Rate limits** dans le dashboard Supabase
2. Augmenter progressivement les quotas signup/resend
3. Le frontend gère déjà un cooldown de 60 secondes sur le bouton "Renvoyer l'email"
