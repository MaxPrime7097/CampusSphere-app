# Guide des Composants Frontend

## Composants UI de base (`src/components/ui/`)

### Combobox (`combobox.tsx`)
Combobox avec recherche en temps réel.

```typescript
interface ComboboxProps {
  options: { value: string; label: string }[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  allowCustomValue?: boolean  // Permet la saisie libre + bouton "Ajouter"
}
```

Avec `allowCustomValue={true}` : l'utilisateur peut taper une valeur non listée et l'ajouter via Entrée ou le bouton "Ajouter".

### Combobox Groupé (`combobox-grouped.tsx`)
Même interface mais avec des groupes d'options.

```typescript
interface ComboboxProps {
  options: { label: string; options: { value: string; label: string }[] }[]
  // ... mêmes props que Combobox
}
```

---

## Composants de formulaires (`src/components/forms/`)

### Combobox académiques

| Composant | Description | Données |
|-----------|-------------|---------|
| `UniversityCombobox` | Universités camerounaises | 13 universités publiques + privées |
| `FacultyCombobox` | Filières académiques | 100+ filières en 9 groupes |
| `StudyLevelCombobox` | Niveaux d'études | BTS/HND, Licence, Master, Doctorat |
| `InstitutionCombobox` | Établissements (formations) | Groupes : Universités publiques, Grandes écoles, Instituts privés, Lycées techniques, Lycées généraux |
| `CityCombobox` | Villes camerounaises | 50+ villes par région |

### Combobox professionnel

| Composant | Description | Données |
|-----------|-------------|---------|
| `DegreeCombobox` | Diplômes | Bac, BTS, Licence, Master, Doctorat, etc. — `allowCustomValue` |
| `JobTitleCombobox` | Postes | IT, Marketing, Finance, Santé, etc. — `allowCustomValue` |
| `CompanyCombobox` | Entreprises | MTN, Orange, CampusSphere 🚀, banques, etc. — `allowCustomValue` |
| `ProfessionCombobox` | Professions | 80+ professions |

### Combobox de tags (ajout multiple)

Ces composants ont une interface différente : ils appellent un callback à chaque sélection et se réinitialisent automatiquement.

```typescript
// SkillsCombobox
interface SkillsComboboxProps {
  onSkillAdd: (skill: string) => void  // Appelé à chaque sélection
  placeholder?: string
  className?: string
  disabled?: boolean
}

// InterestsCombobox — même interface
interface InterestsComboboxProps {
  onInterestAdd: (interest: string) => void
  // ...
}
```

**Utilisation** :
```tsx
<SkillsCombobox
  onSkillAdd={(skill) => {
    if (!skills.includes(skill)) setSkills([...skills, skill]);
  }}
/>
<div className="flex flex-wrap gap-2 mt-2">
  {skills.map((s, i) => (
    <Badge key={i} variant="secondary" className="cursor-pointer"
      onClick={() => setSkills(skills.filter((_, j) => j !== i))}>
      {s} ×
    </Badge>
  ))}
</div>
```

---

## Composants de layout (`src/components/layout/`)

### AppLayout
Layout principal avec sidebar desktop et navigation mobile.

```
Desktop : Sidebar fixe (gauche) + contenu principal
Mobile  : TopBar + contenu + Bottom Navigation (5 onglets)
```

### Navigation mobile (5 onglets)
Accueil · Ressources · Sphères · Messages · Notifications

### Sphere3D
Animation 3D décorative utilisée sur les pages d'authentification (Register, CompleteProfile).

---

## Composants de modales (`src/components/modals/`)

### AddEducationModal
Ajout de formation avec combobox.

**Champs** :
- Diplôme → `DegreeCombobox` (allowCustomValue)
- Établissement → `InstitutionCombobox` (groupé)
- Année → Input libre

### AddExperienceModal
Ajout d'expérience professionnelle avec combobox.

**Champs** :
- Poste → `JobTitleCombobox` (allowCustomValue)
- Entreprise → `CompanyCombobox` (allowCustomValue, CampusSphere en premier 🚀)
- Durée → Input libre
- Description → Textarea

### CreateSphereModal
Création de sphère avec tous les paramètres (nom, description, catégorie, type, visibilité, couleur, icône, objectif, audience, durée, types de collaboration).

### UploadResourceModal / SphereUploadResourceModal
Upload de ressources avec métadonnées (titre, description, matière, type, visibilité, tags).

### CreateTaskModal
Création de tâche (titre, description, assignation, priorité, date limite, points d'impact).

### CreatePostModal / CreateGroupConversationModal
Création de posts et conversations de groupe.

---

## Pages principales (`src/pages/`)

### Register (`pages/public/Register.tsx`)
Inscription en 3 étapes + écran de vérification email.

| Étape | Contenu |
|-------|---------|
| 1 | Nom, prénom, username, email, date de naissance, téléphone, mot de passe |
| verify | Attente de vérification email (avec renvoi) |
| 2 | Université, filière, niveau, matricule, campus |
| 3 | Formations, expériences, compétences, intérêts, portfolio |

### CompleteProfile (`pages/public/CompleteProfile.tsx`)
Complétion de profil pour les utilisateurs OAuth (même style que Register, sans mot de passe).

| Étape | Contenu |
|-------|---------|
| 1 | Username, date de naissance, téléphone, ville, langue |
| 2 | Université, filière, niveau, matricule, campus |
| 3 | Formations, expériences, compétences, intérêts, portfolio |

### Profile (`pages/Profile.tsx`)
Profil utilisateur avec 4 onglets : Posts · À propos · Connexions · Contributions.

**Fonctionnalités** :
- Photo de couverture et avatar modifiables
- Modal d'édition du profil (avec `SkillsCombobox` et `InterestsCombobox`)
- Mood du moment éditable (champ libre + suggestions cliquables)
- Score d'impact
- Normalisation des labels filière/niveau via `FACULTY_LABELS` et `STUDY_YEAR_LABELS`

### SphereDetail (`pages/SphereDetail.tsx`)
Détail d'une sphère avec 5 onglets : Feed · Tâches · Ressources · Membres · Chat.

---

## Services API (`src/services/api.ts`)

Toutes les fonctions d'appel API sont centralisées dans ce fichier.

**Fonctions d'authentification Supabase** :
```typescript
supabaseSignUp(email, password, metadata)
supabaseSignIn(email, password)
supabaseSignInWithGoogle()
supabaseSignInWithFacebook()
exchangeSupabaseToken(supabaseAccessToken)  // → JWT Django
completeSupabaseProfile(data)
```

**Gestion des tokens** :
- Stockage dans `localStorage` (`access`, `refresh`)
- Rafraîchissement automatique à l'expiration
- Retry automatique après rafraîchissement

**Normalisation des données** :
- `normalizeUser(user)` — normalise les champs camelCase/snake_case
- `normalizeSphere(sphere)` — idem pour les sphères
- `normalizePost(post)` — idem pour les posts
- `normalizeResource(resource)` — idem pour les ressources

---

## Hooks personnalisés (`src/hooks/`)

| Hook | Description |
|------|-------------|
| `useIsMobile()` | Détecte si l'écran est mobile |
| `useToast()` | Système de notifications toast |
| `useUnreadCounts()` | Compteurs de messages/notifications non lus |

---

## Internationalisation (`src/i18n/`)

Support français (fr) et anglais (en) via `i18next`.

Configuration dans `src/i18n/config.ts`.
Traductions dans `src/i18n/locales/fr.json` et `en.json`.
