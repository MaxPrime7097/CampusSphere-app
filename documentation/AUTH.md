# Authentification CampusSphere

CampusSphere utilise **Supabase Auth** comme fournisseur d'identité. Après vérification, un token Supabase est échangé contre un **JWT Django** pour accéder à l'API.

## Flux d'inscription par email

```
1. Utilisateur remplit l'étape 1 (nom, email, mot de passe, date de naissance)
   └─ supabaseSignUp() → emailRedirectTo: /register?verified=true

2. Supabase envoie un email de vérification

3. Utilisateur clique sur le lien → redirigé vers /register?verified=true
   └─ Register.tsx détecte verified=true
   └─ supabase.auth.getSession() → exchangeSupabaseToken(access_token)
   └─ Django crée/récupère l'utilisateur (is_profile_complete=False)
   └─ setStep(2) → continue l'inscription

4. Étape 2 : infos académiques (université, filière, niveau, matricule)

5. Étape 3 : compétences, expériences, formations, portfolio

6. handleFinalSubmit() → completeSupabaseProfile()
   └─ Django met is_profile_complete=True
   └─ Redirection vers /
```

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

4. CompleteProfile.tsx (3 étapes) :
   - Étape 1 : username, date de naissance, téléphone, ville
   - Étape 2 : université, filière, niveau, matricule
   - Étape 3 : compétences, expériences, formations, portfolio

5. handleSubmit() → completeSupabaseProfile()
   └─ Django met is_profile_complete=True
   └─ Redirection vers /
```

## Flux de connexion

```
Email/Mot de passe :
  supabaseSignIn(email, password)
  → supabase.auth.signInWithPassword()
  → AuthCallback ou Login page
  → exchangeSupabaseToken()
  → JWT Django stocké dans localStorage

OAuth :
  supabaseSignInWithGoogle/Facebook()
  → /auth/callback
  → exchangeSupabaseToken()
  → Si profil complet → /
  → Si profil incomplet → /complete-profile
```

## Endpoint d'échange de token

### POST /api/users/auth/supabase/exchange-token/

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

## Endpoint de complétion de profil

### POST /api/users/auth/supabase/complete-profile/

**Authentification** : Bearer token Django requis

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
    { "degree": "bac", "school": "Lycée Bilingue", "year": "2021" }
  ],
  "experiences": [
    { "title": "Stagiaire", "company": "CampusSphere 🚀", "duration": "3 mois", "description": "..." }
  ],
  "portfolio_links": [
    { "name": "GitHub", "url": "https://github.com/johndoe" }
  ]
}
```

## Stockage des tokens

Les tokens Django sont stockés dans `localStorage` :
- `access` → JWT d'accès (court terme)
- `refresh` → Token de rafraîchissement (long terme)

Le service `api.ts` gère automatiquement le rafraîchissement du token d'accès expiré.

## Configuration Supabase Dashboard

Dans **Authentication → URL Configuration** :

```
Site URL: http://localhost:5173 (dev) / https://votre-domaine.com (prod)

Redirect URLs:
  http://localhost:5173/register
  http://localhost:5173/auth/callback
  https://votre-domaine.com/register
  https://votre-domaine.com/auth/callback
```

## Champ is_profile_complete

Le champ `is_profile_complete` sur le modèle `User` est `False` par défaut.

Il passe à `True` uniquement quand tous les champs obligatoires sont remplis :
- `username`, `university`, `faculty`, `study_year`, `student_id`

Cela garantit qu'aucun utilisateur ne peut accéder à l'application sans avoir terminé son inscription.
