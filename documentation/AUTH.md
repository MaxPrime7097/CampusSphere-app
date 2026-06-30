# Authentification CampusSphere

CampusSphere utilise **Supabase Auth** comme fournisseur d'identité. Après vérification, un token Supabase est échangé contre un **JWT Django** pour accéder à l'API.

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
   └─ Django crée l'utilisateur (is_profile_complete=False)
   └─ setStep(2) → continue l'inscription sur la même page

4. Étape 2 : infos académiques
   └─ UniversityCombobox, FacultyCombobox, StudyLevelCombobox, matricule, campus

5. Étape 3 : expériences & compétences
   └─ AddEducationModal, AddExperienceModal, SkillsCombobox, InterestsCombobox, portfolio

6. handleFinalSubmit() → completeSupabaseProfile()
   └─ Django met is_profile_complete=True
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
   └─ Django crée l'utilisateur (is_profile_complete=False)
   └─ response.data.needs_profile_completion = true
   └─ navigate('/complete-profile')

4. CompleteProfile.tsx (3 étapes, sans mot de passe) :
   - Étape 1 : username, date de naissance, téléphone (+237), ville, langue
   - Étape 2 : université, filière, niveau, matricule, campus
   - Étape 3 : formations, expériences, compétences, intérêts, portfolio

5. handleSubmit() → completeSupabaseProfile()
   └─ Django met is_profile_complete=True
   └─ Redirection vers /
```

---

## Flux de connexion

```
Email/Mot de passe :
  supabaseSignIn(email, password)
  → supabase.auth.signInWithPassword()
  → exchangeSupabaseToken(access_token)
  → JWT Django stocké dans localStorage
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
      "accessToken": "<django_jwt>",
      "refreshToken": "<django_refresh>"
    },
    "needs_profile_completion": false,
    "is_new_user": false
  }
}
```

`needs_profile_completion` est `true` quand :
- L'utilisateur vient d'être créé via OAuth
- Le profil existant est incomplet (`is_profile_complete=False`)

---

## Endpoint de complétion de profil

### POST `/api/users/auth/supabase/complete-profile/`

Auth requise : **Oui** — Bearer token Django

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

Champs obligatoires : `username`, `university`, `faculty`, `study_year`, `student_id`

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

Les tokens Django sont stockés dans `localStorage` :
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

Valeur par défaut : `False`

Passe à `True` quand tous les champs obligatoires sont remplis via `completeSupabaseProfile()` :
- `username`, `university`, `faculty`, `study_year`, `student_id`

Tant que `is_profile_complete=False`, l'utilisateur est redirigé vers `/complete-profile` à chaque connexion.

---

## Limites d'envoi email Supabase

Si les emails de vérification sont bloqués (erreur 429) :

1. Aller dans **Authentication → Rate limits** dans le dashboard Supabase
2. Augmenter progressivement les quotas signup/resend
3. Le frontend gère déjà un cooldown de 60 secondes sur le bouton "Renvoyer l'email"
