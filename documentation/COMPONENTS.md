# Guide des Composants Frontend

## Design System Partagé (`@cs/ui` — `packages/ui/`)

Le monorepo centralise les composants UI de base dans le package `@cs/ui`, partagé entre `apps/campus` et `apps/sphera` :
- **Composants atomiques** : `Button`, `Badge`, `Dialog`, `Tabs`, `SharedTabs`, `Progress`, `Skeleton`, `Alert`, `Select`, `SpheraIcon`.
- **Utilitaires** : `cn` (`clsx` + `tailwind-merge`).
- **Re-exports de compatibilité** : Dans `apps/campus/src/components/ui/`, ces composants sont ré-exportés directement depuis `@cs/ui` pour garantir une rétrocompatibilité à 100%.

---

## Composants UI Spécifiques CampusSphere (`apps/campus/src/components/ui/`)

### Combobox (`combobox.tsx`)
Combobox avec recherche en temps réel. Supporte la saisie libre via `allowCustomValue`.

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
  allowCustomValue?: boolean  // Saisie libre + bouton "Ajouter <valeur>"
}
```

Comportement avec `allowCustomValue={true}` :
- L'utilisateur tape une valeur non listée
- Un bouton "Ajouter `<valeur>`" apparaît dans la liste vide
- La touche Entrée confirme également l'ajout

### Combobox Groupé (`combobox-grouped.tsx`)
Options organisées en groupes avec en-têtes.

```typescript
interface ComboboxProps {
  options: { label: string; options: { value: string; label: string }[] }[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}
```

---

## Composants de formulaires (`src/components/forms/`)

### Combobox académiques

| Composant | Description | Données |
|-----------|-------------|---------|
| `UniversityCombobox` | Universités camerounaises | 8 universités publiques + privées |
| `FacultyCombobox` | Filières académiques | 100+ filières en 9 groupes thématiques (Santé, Tech, Ingénierie, Agronomie, Économie, Droit, Lettres, Éducation, Autres) |
| `StudyLevelCombobox` | Niveaux d'études | BTS 1/2, HND 1/2, Licence 1–4, Master 1/2, Doctorat 1–3 |
| `InstitutionCombobox` | Établissements pour les formations | 5 groupes : Universités publiques, Grandes écoles publiques, Instituts privés (CampusSphere 🚀 inclus), Lycées techniques, Lycées généraux |
| `CityCombobox` | Villes camerounaises | 50+ villes par région |

### Combobox professionnel

| Composant | Description | Données |
|-----------|-------------|---------|
| `DegreeCombobox` | Diplômes | Bac, BTS, HND, Licence, Bachelor, Master, MBA, Doctorat, etc. — `allowCustomValue` |
| `JobTitleCombobox` | Postes professionnels | IT, Marketing, Finance, RH, Santé, Ingénierie, Éducation, etc. — `allowCustomValue` |
| `CompanyCombobox` | Entreprises | CampusSphere 🚀 en premier, MTN, Orange, banques, secteur public, etc. — `allowCustomValue` |
| `ProfessionCombobox` | Professions générales | 80+ professions tous secteurs |

### Combobox de tags (ajout multiple)

Ces composants s'auto-réinitialisent après chaque sélection et appellent un callback.

```typescript
interface SkillsComboboxProps {
  onSkillAdd: (skill: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

interface InterestsComboboxProps {
  onInterestAdd: (interest: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}
```

Données `SkillsCombobox` : langages (JS, Python, Java…), frameworks (React, Django…), outils (Git, Docker…), design (Figma, Photoshop…), compétences transversales, langues.

Données `InterestsCombobox` : Technologie, Arts, Sports, Culture, Social, Voyage, Business, Loisirs, Mode, Santé.

**Utilisation dans les formulaires d'inscription** :
```tsx
<SkillsCombobox
  onSkillAdd={(skill) => {
    if (!formData.skills.includes(skill))
      setFormData(p => ({ ...p, skills: [...p.skills, skill] }));
  }}
  className="mt-2"
/>
<div className="flex flex-wrap gap-2 mt-2">
  {formData.skills.map((s, i) => (
    <Badge key={i} variant="secondary" className="cursor-pointer"
      onClick={() => setFormData(p => ({ ...p, skills: p.skills.filter((_, j) => j !== i) }))}>
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
Desktop : Sidebar fixe à gauche + contenu principal
Mobile  : MobileTopBar + contenu + Bottom Navigation (5 onglets)
```

### Navigation mobile — 5 onglets
Accueil (`/`) · Ressources (`/resources`) · Sphères (`/spheres`) · Messages (`/messages`) · Notifications (`/notifications`)

### Sphere3D
Animation 3D décorative utilisée sur les pages d'authentification (Register, CompleteProfile).

---

## Composants de modales (`src/components/modals/`)

### AddEducationModal
Ajout de formation précédente.

| Champ | Composant |
|-------|-----------|
| Diplôme | `DegreeCombobox` (allowCustomValue) |
| Établissement | `InstitutionCombobox` (groupé — universités, écoles, lycées) |
| Année | Input libre (ex: `2020-2023`) |

### AddExperienceModal
Ajout d'expérience professionnelle.

| Champ | Composant |
|-------|-----------|
| Poste | `JobTitleCombobox` (allowCustomValue) |
| Entreprise | `CompanyCombobox` (allowCustomValue, CampusSphere 🚀 en premier) |
| Durée | Input libre (ex: `6 mois`, `2022–2023`) |
| Description | Textarea |

### CreateSphereModal
Création de sphère avec paramètres complets : nom, description, catégorie, type, visibilité, approbation requise, couleur, icône, objectif, audience, durée, types de collaboration.

### UploadResourceModal / SphereUploadResourceModal
Upload de ressources avec métadonnées : titre, description, matière, type, visibilité, tags. Upload déclenche **+5 pts d'impact** pour l'auteur.

### CreateTaskModal
Création de tâche : titre, description, assignation à un membre de la sphère, priorité (haute/moyenne/basse), date limite, points d'impact.

### CreatePostModal
Création de post : contenu, visibilité, sphère cible, tags, fichiers joints, autorisation commentaires.

### CreateGroupConversationModal
Création de conversation de groupe : nom du groupe, sélection des participants.

---

## Pages principales (`src/pages/`)

### Register (`pages/public/Register.tsx`)
Inscription en 3 étapes + écran de vérification email. Redirige vers `/register?verified=true` après clic sur le lien email.

| Étape | Contenu |
|-------|---------|
| 1 | Prénom, nom, username, email, date de naissance, téléphone (+237), mot de passe |
| verify | Attente vérification — bouton renvoyer email (cooldown 60s) |
| 2 | UniversityCombobox, FacultyCombobox, StudyLevelCombobox, matricule, campus |
| 3 | AddEducationModal, AddExperienceModal, SkillsCombobox, InterestsCombobox, portfolio |

### CompleteProfile (`pages/public/CompleteProfile.tsx`)
Complétion de profil pour les utilisateurs OAuth. Même design que Register, sans champ mot de passe.

| Étape | Contenu |
|-------|---------|
| 1 | Username, date de naissance, téléphone (+237), ville, langue |
| 2 | UniversityCombobox, FacultyCombobox, StudyLevelCombobox, matricule, campus |
| 3 | AddEducationModal, AddExperienceModal, SkillsCombobox, InterestsCombobox, portfolio |

### Profile (`pages/Profile.tsx`)
Profil utilisateur avec 4 onglets : Posts · À propos · Connexions · Contributions.

**Fonctionnalités** :
- Photo de couverture et avatar modifiables (max 5MB / 2MB)
- Modal d'édition : champs texte + `SkillsCombobox` + `InterestsCombobox`
- Mood du moment : champ de saisie libre + 6 suggestions cliquables (le résultat est stocké tel quel)
- Score d'impact affiché (incrémenté via upload ressource et notation de posts)
- `FACULTY_LABELS` et `STUDY_YEAR_LABELS` normalisent les valeurs des combobox en labels lisibles

### Resources (`pages/Resources.tsx`)
Bibliothèque de ressources avec 3 onglets : Toutes · Suggestions · Récentes.

**Fonctionnalités** :
- Recherche par titre, description, tags
- Filtres par matière et type
- Actions par carte : Prévisualiser (Eye), Sauvegarder (Bookmark), Télécharger
- Pas d'affichage du score d'impact sur les cartes

### ResourceDetail (`pages/ResourceDetail.tsx`)
Détail complet d'une ressource.

**Fonctionnalités** :
- Aperçu PDF/image via `?mode=preview`
- Stats : téléchargements, vues, sauvegardes
- Actions : Sauvegarder, Modifier (si auteur), Supprimer (si auteur), Partager, Signaler
- Pas d'affichage du score d'impact

### Spheres (`pages/Spheres.tsx`)
Liste des sphères avec 3 onglets : Découvrir · Mes Sphères · Top.

**Gestion de membership** :
- `active` → bouton "Rejoint" (vert, désactivé)
- `pending` → bouton "En attente" (orange, désactivé)
- `none` → bouton "Rejoindre" (gradient)

### SphereDetail (`pages/SphereDetail.tsx`)
Détail d'une sphère avec 5 onglets : Feed · Tâches · Ressources · Membres · Chat.

---

## Services API (`src/services/api.ts`)

Toutes les fonctions d'appel API centralisées. Jamais appeler `fetch` directement.

**Auth Supabase** :
```typescript
supabaseSignUp(email, password, { first_name, last_name, username })
supabaseSignIn(email, password)
supabaseSignInWithGoogle()       // redirect → /auth/callback
supabaseSignInWithFacebook()     // redirect → /auth/callback
exchangeSupabaseToken(token)     // → stocke access + refresh dans localStorage
completeSupabaseProfile(data)    // → POST /api/users/auth/supabase/complete-profile/
```

**Gestion des tokens** :
- `localStorage.access` et `localStorage.refresh`
- Rafraîchissement automatique via `POST /api/auth/refresh/`
- Retry de la requête originale après rafraîchissement
- Déconnexion automatique si refresh expiré

**Normalisation** :
- `normalizeUser(user)` — snake_case ↔ camelCase, champs manquants → valeurs par défaut
- `normalizeSphere(sphere)` — idem
- `normalizePost(post)` — idem + normalisation des fichiers joints
- `normalizeResource(resource)` — idem + normalisation du type via `normalizeResourceType()`

---

## Hooks personnalisés (`src/hooks/`)

| Hook | Description |
|------|-------------|
| `useIsMobile()` | Détecte si l'écran est ≤ 768px |
| `useToast()` | Notifications toast (success, error, info) |
| `useUnreadCounts()` | Compteurs temps réel messages + notifications non lus |

---

## Internationalisation (`src/i18n/`)

Support français (fr) et anglais (en) via `i18next`.

- Config : `src/i18n/config.ts`
- Traductions : `src/i18n/locales/fr.json` et `en.json`
- Langue par défaut : `fr`
