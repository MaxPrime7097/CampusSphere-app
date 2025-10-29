# 📚 CampusSphere - Documentation Complète

## 🎯 Vue d'ensemble

CampusSphere est une plateforme collaborative destinée aux étudiants camerounais pour partager des ressources, collaborer dans des sphères thématiques, et créer des connexions académiques et professionnelles.

### 🏗️ Architecture Technique

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Shadcn/UI + Tailwind CSS
- **Routing**: React Router DOM v6
- **State Management**: React Hooks (useState, useEffect, useContext)
- **Form Validation**: Zod
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Package Manager**: npm

---

## 📁 Structure du Projet

```
src/
├── components/           # Composants réutilisables
│   ├── ui/              # Composants UI de base (Shadcn/UI)
│   ├── forms/           # Composants de formulaires
│   ├── layout/          # Composants de mise en page
│   ├── modals/          # Modales et dialogues
│   ├── feed/            # Composants du feed
│   ├── chat/            # Composants de chat
│   └── upload/          # Composants d'upload
├── pages/               # Pages principales
├── hooks/               # Hooks personnalisés
├── lib/                 # Utilitaires et configurations
├── styles/              # Styles CSS
└── types/               # Types TypeScript
```

---

## 🧩 Composants Principaux

### 1. **Composants UI de Base** (`src/components/ui/`)

#### `combobox.tsx`
**Description**: Composant Combobox réutilisable avec recherche intégrée.

**Props**:
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
}
```

**Utilisation**:
```tsx
<Combobox
  options={universities}
  value={selectedUniversity}
  onValueChange={setSelectedUniversity}
  placeholder="Sélectionner une université"
  searchPlaceholder="Rechercher..."
/>
```

**Fonctionnalités**:
- Recherche en temps réel
- Sélection visuelle avec check mark
- Support clavier (flèches, Enter, Escape)
- Accessibilité ARIA complète

### 2. **Composants de Formulaires** (`src/components/forms/`)

#### `UniversityCombobox.tsx`
**Description**: Sélecteur d'universités camerounaises.

**Données**:
- 13 universités principales du Cameroun
- Option "Autre université" pour les cas non listés
- Valeurs normalisées (douala, yaounde1, etc.)

#### `FacultyCombobox.tsx`
**Description**: Sélecteur de filières académiques.

**Données**:
- 29 filières couvrant tous les domaines
- Sciences, Lettres, Arts, Sport, Agronomie
- Valeurs normalisées pour l'API

#### `StudyLevelCombobox.tsx`
**Description**: Sélecteur de niveaux d'études.

**Données**:
- BTS1/2, HND1/2, Licence1/2/3, Bachelor1/2/3/4
- Master1/2, Doctorat1/2/3, PhD1/2/3
- Système éducatif camerounais complet

#### `CityCombobox.tsx`
**Description**: Sélecteur de villes camerounaises.

**Données**:
- 50+ villes couvrant toutes les régions
- Douala, Yaoundé, Bafoussam, Bamenda, etc.
- Option "Autre ville" disponible

#### `ProfessionCombobox.tsx`
**Description**: Sélecteur de professions.

**Données**:
- 80+ professions couvrant tous les secteurs
- IT, Santé, Droit, Éducation, Ingénierie, Arts
- Valeurs normalisées pour l'API

### 3. **Composants de Layout** (`src/components/layout/`)

#### `AppLayout.tsx`
**Description**: Layout principal de l'application.

**Structure**:
```tsx
<div className="min-h-screen bg-background">
  <Sidebar />           {/* Navigation latérale desktop */}
  <div className="flex-1">
    <TopBar />          {/* Barre supérieure */}
    <main className="p-6">
      {children}        {/* Contenu des pages */}
    </main>
  </div>
  <MobileNavigation />  {/* Navigation mobile */}
</div>
```

**Responsive**:
- Desktop: Sidebar + TopBar
- Mobile: TopBar + Bottom Navigation

#### `MobileNavigation.tsx`
**Description**: Navigation mobile avec 5 onglets principaux.

**Onglets**:
1. **Accueil** (`/`) - Feed principal
2. **Ressources** (`/resources`) - Bibliothèque de ressources
3. **Sphères** (`/spheres`) - Sphères collaboratives
4. **Messages** (`/messages`) - Messagerie
5. **Notifications** (`/notifications`) - Notifications

#### `MobileTopBar.tsx`
**Description**: Barre supérieure mobile avec ProfileBubble.

**Fonctionnalités**:
- Logo CampusSphere
- ProfileBubble (avatar + menu déroulant)
- Navigation contextuelle

#### `ProfileBubble.tsx`
**Description**: Bulle de profil avec menu déroulant.

**Menu**:
- Profil utilisateur
- Notifications
- Paramètres
- Déconnexion

### 4. **Composants de Modales** (`src/components/modals/`)

#### `CreateSpherePostModal.tsx`
**Description**: Modal de création de posts dans les sphères.

**Champs**:
- **Contenu**: Textarea (500 caractères max)
- **Catégorie**: Général, Académique, Événement, Marketplace, Aide, Annonce
- **Visibilité**: Sphère uniquement, Public, Amis uniquement
- **Matière**: Sélection parmi les filières
- **Type**: Cours, TD/TP, Examen, Projet, Ressource, Autre
- **Audience**: 10 options ciblées
- **Localisation**: Champ optionnel
- **Tags**: Système de tags (max 5)
- **Médias**: Upload photos/vidéos/documents (max 50MB)
- **Emojis**: Picker avec 16 emojis populaires
- **Mentions**: @username avec utilisateurs mock
- **Commentaires**: Toggle pour autoriser/désactiver
- **Brouillons**: Sauvegarde/chargement avec localStorage

**Validation**:
```typescript
// Champs obligatoires
- content (non vide, max 500 caractères)
- subject (matière sélectionnée)
- type (type de contenu sélectionné)
- audience (audience cible sélectionnée)
```

**Fonctionnalités avancées**:
- Sauvegarde de brouillons dans localStorage
- Upload de fichiers multiples
- Insertion d'emojis et mentions
- Programmation de posts (interface prête)

#### `UploadResourceModal.tsx`
**Description**: Modal d'upload de ressources.

**Champs**:
- **Fichier**: Upload avec drag & drop (PDF, DOC, PPT, ZIP, max 50MB)
- **Titre**: Nom de la ressource
- **Description**: Description détaillée
- **Matière**: Sélection parmi les filières
- **Type**: Notes, Résumés, Exercices, Projets, Présentations
- **Visibilité**: Public, Université uniquement, Amis uniquement
- **Audience**: Niveaux d'études ciblés
- **Tags**: Système de tags

#### `CreateTaskModal.tsx`
**Description**: Modal de création de tâches dans les sphères.

**Champs**:
- **Titre**: Nom de la tâche
- **Description**: Description détaillée
- **Assignation**: Membre de la sphère ou "Non assigné"
- **Priorité**: Haute, Moyenne, Basse
- **Date limite**: Sélection de date
- **Impact Points**: Points d'impact (5 par défaut)

#### `AddEducationModal.tsx`
**Description**: Modal d'ajout de formation.

**Champs**:
- **Diplôme**: Nom du diplôme
- **Établissement**: Nom de l'école/université
- **Année**: Année d'obtention
- **Description**: Description optionnelle

#### `AddExperienceModal.tsx`
**Description**: Modal d'ajout d'expérience professionnelle.

**Champs**:
- **Poste**: Titre du poste
- **Entreprise**: Nom de l'entreprise
- **Durée**: Période d'emploi
- **Description**: Description des responsabilités

### 5. **Composants de Feed** (`src/components/feed/`)

#### `CreatePost.tsx`
**Description**: Composant de création de posts sur le feed principal.

**Interface**:
- Avatar utilisateur
- Zone de texte avec placeholder
- Icônes d'actions (Photo, Vidéo, Document, Emoji)
- Bouton d'action avec gradient

#### `CreateSpherePost.tsx`
**Description**: Composant de création de posts dans les sphères.

**Différences avec CreatePost**:
- Message contextuel avec nom de la sphère
- Même interface mais adaptée au contexte sphère

#### `PostCard.tsx`
**Description**: Carte d'affichage des posts.

**Éléments**:
- Avatar et informations auteur
- Contenu du post
- Médias attachés
- Actions (like, commentaire, partage)
- Score d'impact avec icône Zap
- Timestamp et localisation

### 6. **Composants de Chat** (`src/components/chat/`)

#### `MiniChat.tsx`
**Description**: Chat intégré dans les sphères.

**Fonctionnalités**:
- Messages en temps réel (mock)
- Input avec bouton d'envoi
- Scroll automatique vers le bas
- Interface compacte et responsive

---

## 📄 Pages Principales

### 1. **Page d'Accueil** (`src/pages/Home.tsx`)

**Structure**:
```tsx
<div className="space-y-6">
  <CreatePost />                    {/* Création de posts */}
  <PopularSpheres />               {/* Sphères populaires */}
  <RecentActivity />               {/* Activité récente */}
  <UpcomingEvents />               {/* Événements à venir */}
</div>
```

**Fonctionnalités**:
- Création de posts avec modal
- Affichage des sphères populaires
- Activité récente des utilisateurs
- Événements à venir
- Feed de posts avec pagination

### 2. **Page de Ressources** (`src/pages/Resources.tsx`)

**Structure**:
```tsx
<div className="space-y-6">
  <SearchAndFilters />             {/* Recherche et filtres */}
  <ResourceGrid />                 {/* Grille de ressources */}
  <Pagination />                   {/* Pagination */}
</div>
```

**Fonctionnalités**:
- Recherche par titre, matière, type
- Filtres par matière, type, niveau
- Grille responsive de ressources
- Actions: Prévisualiser, Enregistrer, Télécharger
- Score d'impact avec icône Zap
- Navigation vers détails au clic

**Actions sur les cartes**:
- **Prévisualiser**: Toast "Fonctionnalité à venir"
- **Enregistrer**: Ajout aux favoris
- **Télécharger**: Téléchargement direct
- **Clic sur carte**: Navigation vers détails

### 3. **Page de Détail de Ressource** (`src/pages/ResourceDetail.tsx`)

**Structure**:
```tsx
<div className="max-w-4xl mx-auto space-y-6">
  <ResourceHeader />               {/* En-tête avec infos */}
  <ResourceContent />              {/* Contenu et médias */}
  <ResourceActions />              {/* Actions (télécharger, etc.) */}
  <AuthorInfo />                   {/* Informations auteur */}
  <ImpactScore />                  {/* Score d'impact interactif */}
</div>
```

**Fonctionnalités**:
- Affichage complet de la ressource
- Informations détaillées de l'auteur
- Score d'impact interactif (remplace les likes)
- Actions de téléchargement et partage
- Navigation de retour

### 4. **Page des Sphères** (`src/pages/Spheres.tsx`)

**Structure**:
```tsx
<div className="space-y-6">
  <Tabs>
    <TabsList>
      <TabsTrigger value="discover">Découvrir</TabsTrigger>
      <TabsTrigger value="my-spheres">Mes sphères</TabsTrigger>
    </TabsList>
    
    <TabsContent value="discover">
      <SearchAndFilters />         {/* Recherche et filtres */}
      <SphereGrid />               {/* Grille de sphères */}
    </TabsContent>
    
    <TabsContent value="my-spheres">
      <MySpheresList />            {/* Liste des sphères rejointes */}
    </TabsContent>
  </Tabs>
</div>
```

**Fonctionnalités**:
- Découverte de nouvelles sphères
- Gestion des sphères rejointes
- Filtres par catégorie, type, statut
- Recherche par nom et description
- Actions: Rejoindre, Accéder, Annuler demande

**Types de sphères**:
- **Publiques**: Rejoindre directement
- **Privées avec approbation**: Demande en attente
- **Privées**: Invitation requise

### 5. **Page de Détail de Sphère** (`src/pages/SphereDetail.tsx`)

**Structure**:
```tsx
<div className="space-y-6">
  <SphereHeader />                 {/* En-tête avec infos */}
  <SphereActions />                {/* Actions (rejoindre, etc.) */}
  <Tabs>
    <TabsList>
      <TabsTrigger value="feed">Feed</TabsTrigger>
      <TabsTrigger value="tasks">Tâches</TabsTrigger>
      <TabsTrigger value="resources">Ressources</TabsTrigger>
      <TabsTrigger value="members">Membres</TabsTrigger>
      <TabsTrigger value="chat">Chat</TabsTrigger>
    </TabsList>
    
    <TabsContent value="feed">
      <CreateSpherePost />         {/* Création de posts */}
      <PostsList />                {/* Liste des posts */}
    </TabsContent>
    
    <TabsContent value="tasks">
      <CreateTask />               {/* Création de tâches */}
      <TasksList />                {/* Liste des tâches */}
    </TabsContent>
    
    <TabsContent value="resources">
      <UploadResource />           {/* Upload de ressources */}
      <ResourcesList />            {/* Liste des ressources */}
    </TabsContent>
    
    <TabsContent value="members">
      <MembersList />              {/* Liste des membres */}
      <AddMember />                {/* Ajout de membres */}
    </TabsContent>
    
    <TabsContent value="chat">
      <MiniChat />                 {/* Chat intégré */}
    </TabsContent>
  </Tabs>
</div>
```

**Fonctionnalités**:
- Informations complètes de la sphère
- Gestion des membres et permissions
- Système de tâches avec attribution
- Upload et partage de ressources
- Chat intégré pour la collaboration
- Gestion des demandes d'adhésion

**Système de tâches**:
- Création avec assignation
- Progression et completion
- Points d'impact (5 pts par tâche)
- Interface de gestion complète

### 6. **Page de Messages** (`src/pages/Messages.tsx`)

**Structure**:
```tsx
<div className="flex h-[calc(100vh-4rem)]">
  <ConversationsList />            {/* Liste des conversations */}
  <ChatInterface />                {/* Interface de chat */}
</div>
```

**Fonctionnalités**:
- Liste des conversations
- Chat en temps réel (mock)
- Création de conversations de groupe
- Gestion des contacts
- Notifications de messages

### 7. **Page de Profil** (`src/pages/Profile.tsx`)

**Structure**:
```tsx
<div className="space-y-6">
  <ProfileHeader />                {/* En-tête avec photo de couverture */}
  <Tabs>
    <TabsList>
      <TabsTrigger value="about">À propos</TabsTrigger>
      <TabsTrigger value="connections">Connexions</TabsTrigger>
      <TabsTrigger value="contributions">Contributions</TabsTrigger>
    </TabsList>
    
    <TabsContent value="about">
      <PersonalInfo />             {/* Informations personnelles */}
      <AcademicInfo />             {/* Informations académiques */}
      <Education />                {/* Formations */}
      <Experience />               {/* Expériences */}
    </TabsContent>
    
    <TabsContent value="connections">
      <ConnectionsList />          {/* Liste des connexions */}
    </TabsContent>
    
    <TabsContent value="contributions">
      <ContributionsList />        {/* Liste des contributions */}
    </TabsContent>
  </Tabs>
</div>
```

**Fonctionnalités**:
- Photo de couverture et avatar modifiables
- Informations personnelles et académiques
- Gestion des formations et expériences
- Score d'impact et mood du moment
- Connexions et contributions
- Modales d'édition pour tous les champs

### 8. **Page d'Inscription** (`src/pages/Register.tsx`)

**Structure**:
```tsx
<div className="space-y-6">
  <ProgressBar />                  {/* Barre de progression */}
  <Steps>
    <Step1>PersonalInfo</Step1>    {/* Informations personnelles */}
    <Step2>AcademicInfo</Step2>    {/* Informations académiques */}
    <Step3>ExperienceSkills</Step3> {/* Expériences et compétences */}
  </Steps>
</div>
```

**Étapes**:
1. **Informations personnelles**: Nom, email, mot de passe, avatar, bio
2. **Informations académiques**: Université, filière, niveau, matricule
3. **Expériences et compétences**: Formations, expériences, compétences, CV

**Composants utilisés**:
- `UniversityCombobox`: Sélection d'université
- `FacultyCombobox`: Sélection de filière
- `StudyLevelCombobox`: Sélection de niveau
- `CityCombobox`: Sélection de ville
- `AddEducationModal`: Ajout de formations
- `AddExperienceModal`: Ajout d'expériences

### 9. **Page de Notifications** (`src/pages/Notifications.tsx`)

**Structure**:
```tsx
<div className="space-y-4">
  <NotificationsList />            {/* Liste des notifications */}
  <EmptyState />                   {/* État vide */}
</div>
```

**Fonctionnalités**:
- Liste des notifications
- Filtres par type
- Actions sur les notifications
- État vide avec illustration

---

## 🎨 Système de Design

### **Couleurs** (Tailwind CSS)

```css
/* Couleurs principales */
--primary: 142 69% 58%           /* Vert CampusSphere */
--primary-foreground: 0 0% 98%   /* Blanc */

/* Couleurs secondaires */
--secondary: 210 40% 98%         /* Gris clair */
--secondary-foreground: 222.2 84% 4.9%

/* Couleurs d'accent */
--accent: 210 40% 98%
--accent-foreground: 222.2 84% 4.9%

/* Couleurs de fond */
--background: 0 0% 100%          /* Blanc */
--foreground: 222.2 84% 4.9%     /* Noir */

/* Couleurs de bordure */
--border: 214.3 31.8% 91.4%      /* Gris clair */
--input: 214.3 31.8% 91.4%

/* Couleurs de focus */
--ring: 142 69% 58%              /* Vert CampusSphere */
```

### **Gradients**

```css
/* Gradient principal CampusSphere */
.campus-gradient {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

/* Effet de glow */
.campus-glow {
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
}

/* Gradient de fond */
.bg-gradient-campus {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%);
}
```

### **Typographie**

```css
/* Tailles de police */
.text-xs     /* 12px */
.text-sm     /* 14px */
.text-base   /* 16px */
.text-lg     /* 18px */
.text-xl     /* 20px */
.text-2xl    /* 24px */
.text-3xl    /* 30px */

/* Poids de police */
.font-normal   /* 400 */
.font-medium   /* 500 */
.font-semibold /* 600 */
.font-bold     /* 700 */
```

### **Espacement**

```css
/* Espacement standard */
.space-y-1    /* 4px */
.space-y-2    /* 8px */
.space-y-3    /* 12px */
.space-y-4    /* 16px */
.space-y-6    /* 24px */
.space-y-8    /* 32px */

/* Padding */
.p-2    /* 8px */
.p-4    /* 16px */
.p-6    /* 24px */
.p-8    /* 32px */

/* Margin */
.m-2    /* 8px */
.m-4    /* 16px */
.m-6    /* 24px */
.m-8    /* 32px */
```

---

## 🔧 Configuration et Installation

### **Prérequis**

```bash
# Node.js (version 18+)
node --version

# npm (version 9+)
npm --version
```

### **Installation**

```bash
# Cloner le projet
git clone <repository-url>
cd campus-sphere

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Build de production
npm run build

# Preview du build
npm run preview
```

### **Scripts disponibles**

```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
}
```

### **Structure des dépendances**

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.1",
    "lucide-react": "^0.263.1",
    "zod": "^3.20.2",
    "@radix-ui/react-*": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^1.2.1",
    "tailwind-merge": "^1.10.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.28",
    "@types/react-dom": "^18.0.11",
    "@typescript-eslint/eslint-plugin": "^5.57.1",
    "@typescript-eslint/parser": "^5.57.1",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.38.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.3.4",
    "postcss": "^8.4.21",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.0.2",
    "vite": "^4.3.2"
  }
}
```

---

## 📱 Responsive Design

### **Breakpoints**

```css
/* Mobile First */
sm: 640px    /* Tablettes */
md: 768px    /* Petits écrans */
lg: 1024px   /* Écrans moyens */
xl: 1280px   /* Grands écrans */
2xl: 1536px  /* Très grands écrans */
```

### **Navigation Responsive**

**Desktop**:
- Sidebar fixe avec navigation complète
- TopBar avec ProfileBubble
- Contenu principal avec padding

**Mobile**:
- TopBar avec logo et ProfileBubble
- Bottom Navigation avec 5 onglets
- Contenu plein écran

### **Composants Responsive**

```tsx
// Exemple de responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card className="w-full">
    <CardContent className="p-4">
      <h3 className="text-lg font-semibold mb-2">Titre</h3>
      <p className="text-sm text-muted-foreground">
        Contenu adaptatif
      </p>
    </CardContent>
  </Card>
</div>
```

---

## 🔐 Gestion d'État

### **État Local (useState)**

```tsx
// Exemple d'état local
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({
  name: '',
  email: '',
  university: ''
});
```

### **État Persistant (localStorage)**

```tsx
// Sauvegarde dans localStorage
const saveToLocalStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Récupération depuis localStorage
const loadFromLocalStorage = (key: string) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

// Exemples d'utilisation
localStorage.setItem('userProfile', JSON.stringify(profile));
localStorage.setItem('spherePostDraft', JSON.stringify(draft));
localStorage.setItem('impactScore', '150');
localStorage.setItem('currentMood', 'motivated');
```

### **État Global (Context)**

```tsx
// Contexte utilisateur
const UserContext = createContext({
  user: null,
  setUser: () => {},
  isAuthenticated: false
});

// Provider
const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  return (
    <UserContext.Provider value={{ user, setUser, isAuthenticated }}>
      {children}
    </UserContext.Provider>
  );
};
```

---

## 📊 Données Mock

### **Structure des Utilisateurs**

```typescript
interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatar?: string;
  coverPhoto?: string;
  bio: string;
  university: string;
  faculty: string;
  studyYear: string;
  studentId: string;
  campus: string;
  town: string;
  language: string;
  impactScore: number;
  currentMood: string;
  joinedSpheres: string[];
  pendingRequests: string[];
  connections: string[];
  skills: string[];
  interests: string[];
  previousEducation: Education[];
  experiences: Experience[];
  portfolioLinks: PortfolioLink[];
}
```

### **Structure des Sphères**

```typescript
interface Sphere {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  color: string;
  icon: string;
  isPrivate: boolean;
  requireApproval: boolean;
  memberCount: number;
  impactScore: number;
  createdAt: string;
  updatedAt: string;
  members: Member[];
  posts: Post[];
  tasks: Task[];
  resources: Resource[];
}
```

### **Structure des Posts**

```typescript
interface Post {
  id: string;
  content: string;
  author: User;
  sphereId?: string;
  category: string;
  visibility: string;
  subject?: string;
  type?: string;
  audience?: string;
  location?: string;
  tags: string[];
  files: File[];
  allowComments: boolean;
  likes: number;
  comments: Comment[];
  impactScore: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### **Structure des Ressources**

```typescript
interface Resource {
  id: string;
  title: string;
  description: string;
  file: File;
  author: User;
  subject: string;
  type: string;
  visibility: string;
  audience: string;
  tags: string[];
  impactScore: number;
  stats: {
    downloads: number;
    views: number;
    saves: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

### **Structure des Tâches**

```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  assignedToId?: string;
  assignedTo?: User;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  isCompleted: boolean;
  impactPoints: number;
  sphereId: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🎯 Fonctionnalités Clés

### **1. Système d'Impact Score**

**Description**: Système de points basé sur les contributions et interactions.

**Calcul**:
- Création de post: +10 pts
- Création de ressource: +15 pts
- Completion de tâche: +5 pts
- Commentaire utile: +2 pts
- Téléchargement de ressource: +1 pt

**Affichage**:
```tsx
<div className="flex items-center gap-1">
  <Zap className="h-4 w-4 text-yellow-500" />
  <span className="font-semibold">{impactScore}</span>
</div>
```

### **2. Système de Sphères**

**Types de sphères**:
- **Publiques**: Accessibles à tous
- **Privées avec approbation**: Demande d'adhésion requise
- **Privées**: Invitation uniquement

**Fonctionnalités**:
- Création de sphères avec paramètres avancés
- Gestion des membres et permissions
- Système de tâches collaboratives
- Chat intégré
- Partage de ressources

### **3. Système de Messagerie**

**Fonctionnalités**:
- Conversations privées
- Conversations de groupe
- Chat intégré dans les sphères
- Notifications en temps réel

### **4. Système de Ressources**

**Types supportés**:
- PDF, DOC, DOCX, PPT, PPTX, ZIP
- Taille maximale: 50MB
- Métadonnées complètes
- Système de tags
- Recherche et filtres

### **5. Système de Profils**

**Fonctionnalités**:
- Photo de couverture et avatar
- Informations académiques complètes
- Gestion des formations et expériences
- Score d'impact et mood
- Connexions et contributions

---

## 🔄 Flux de Données

### **1. Authentification**

```mermaid
graph TD
    A[Page Login] --> B[Validation Formulaire]
    B --> C[Appel API Auth]
    C --> D{Succès?}
    D -->|Oui| E[Stockage Token]
    D -->|Non| F[Affichage Erreur]
    E --> G[Redirection Home]
```

### **2. Création de Post**

```mermaid
graph TD
    A[CreatePostModal] --> B[Validation Formulaire]
    B --> C[Upload Fichiers]
    C --> D[Appel API Create Post]
    D --> E{Succès?}
    E -->|Oui| F[Toast Succès]
    E -->|Non| G[Toast Erreur]
    F --> H[Fermeture Modal]
    H --> I[Refresh Feed]
```

### **3. Gestion des Sphères**

```mermaid
graph TD
    A[SphereDetail] --> B{Type Sphère?}
    B -->|Publique| C[Rejoindre Directement]
    B -->|Privée| D[Demande Adhésion]
    C --> E[Update LocalStorage]
    D --> F[Update Pending Requests]
    E --> G[Refresh UI]
    F --> G
```

---

## 🧪 Tests et Validation

### **Validation des Formulaires (Zod)**

```typescript
// Schéma de validation pour l'inscription
const registerSchema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe trop court"),
  confirmPassword: z.string(),
  university: z.string().min(1, "Université requise"),
  faculty: z.string().min(1, "Filière requise"),
  studyYear: z.string().min(1, "Niveau requis")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"]
});
```

### **Validation des Posts**

```typescript
const postSchema = z.object({
  content: z.string().min(1, "Contenu requis").max(500, "Trop long"),
  subject: z.string().min(1, "Matière requise"),
  type: z.string().min(1, "Type requis"),
  audience: z.string().min(1, "Audience requise")
});
```

---

## 🚀 Optimisations

### **1. Performance**

```tsx
// Lazy loading des composants
const LazyComponent = lazy(() => import('./LazyComponent'));

// Memoization des composants coûteux
const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* Rendu coûteux */}</div>;
});

// useMemo pour les calculs coûteux
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

### **2. Images**

```tsx
// Composant OptimizedImage
const OptimizedImage = ({ src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <div className="relative">
      {!isLoaded && <Skeleton className="w-full h-full" />}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        {...props}
      />
    </div>
  );
};
```

### **3. Bundle Size**

```typescript
// Import dynamique des modales
const CreatePostModal = lazy(() => import('./CreatePostModal'));
const UploadResourceModal = lazy(() => import('./UploadResourceModal'));

// Tree shaking des icônes
import { Zap, Heart, Download } from 'lucide-react';
```

---

## 🔧 Configuration Backend

### **Endpoints API Requis**

```typescript
// Authentification
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/me

// Utilisateurs
GET    /api/users/:id
PUT    /api/users/:id
POST   /api/users/:id/avatar
POST   /api/users/:id/cover
GET    /api/users/:id/connections
POST   /api/users/:id/connections
DELETE /api/users/:id/connections/:connectionId

// Sphères
GET    /api/spheres
POST   /api/spheres
GET    /api/spheres/:id
PUT    /api/spheres/:id
DELETE /api/spheres/:id
POST   /api/spheres/:id/join
POST   /api/spheres/:id/leave
GET    /api/spheres/:id/members
POST   /api/spheres/:id/members
DELETE /api/spheres/:id/members/:memberId

// Posts
GET    /api/posts
POST   /api/posts
GET    /api/posts/:id
PUT    /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/like
POST   /api/posts/:id/comment
GET    /api/posts/:id/comments

// Ressources
GET    /api/resources
POST   /api/resources
GET    /api/resources/:id
PUT    /api/resources/:id
DELETE /api/resources/:id
POST   /api/resources/:id/download
POST   /api/resources/:id/save

// Tâches
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
POST   /api/tasks/:id/complete

// Messages
GET    /api/conversations
POST   /api/conversations
GET    /api/conversations/:id/messages
POST   /api/conversations/:id/messages

// Notifications
GET    /api/notifications
PUT    /api/notifications/:id/read
DELETE /api/notifications/:id
```

### **Structure de Base de Données**

```sql
-- Utilisateurs
CREATE TABLE users (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  cover_photo_url VARCHAR(500),
  bio TEXT,
  university VARCHAR(100),
  faculty VARCHAR(100),
  study_year VARCHAR(20),
  student_id VARCHAR(50),
  campus VARCHAR(100),
  town VARCHAR(100),
  language VARCHAR(50),
  impact_score INTEGER DEFAULT 0,
  current_mood VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sphères
CREATE TABLE spheres (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  type VARCHAR(50),
  color VARCHAR(20),
  icon VARCHAR(50),
  is_private BOOLEAN DEFAULT FALSE,
  require_approval BOOLEAN DEFAULT FALSE,
  member_count INTEGER DEFAULT 0,
  impact_score INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Membres de sphères
CREATE TABLE sphere_members (
  id UUID PRIMARY KEY,
  sphere_id UUID REFERENCES spheres(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sphere_id, user_id)
);

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id),
  sphere_id UUID REFERENCES spheres(id),
  category VARCHAR(50),
  visibility VARCHAR(20),
  subject VARCHAR(100),
  type VARCHAR(50),
  audience VARCHAR(100),
  location VARCHAR(100),
  tags TEXT[],
  allow_comments BOOLEAN DEFAULT TRUE,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  impact_score INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ressources
CREATE TABLE resources (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  file_url VARCHAR(500) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  author_id UUID REFERENCES users(id),
  subject VARCHAR(100),
  type VARCHAR(50),
  visibility VARCHAR(20),
  audience VARCHAR(100),
  tags TEXT[],
  impact_score INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tâches
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  assigned_to_id UUID REFERENCES users(id),
  priority VARCHAR(20),
  due_date TIMESTAMP,
  is_completed BOOLEAN DEFAULT FALSE,
  impact_points INTEGER DEFAULT 5,
  sphere_id UUID REFERENCES spheres(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Variables d'Environnement**

```env
# Base de données
DATABASE_URL=postgresql://username:password@localhost:5432/campus_sphere
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=campus_sphere
DATABASE_USER=username
DATABASE_PASSWORD=password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Upload
UPLOAD_MAX_SIZE=52428800  # 50MB
UPLOAD_ALLOWED_TYPES=pdf,doc,docx,ppt,pptx,zip,jpg,jpeg,png,gif

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis (pour les sessions et cache)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:3000,https://campus-sphere.com
```

---

## 🚀 Déploiement

### **Build de Production**

```bash
# Build optimisé
npm run build

# Vérification du build
npm run preview
```

### **Variables d'Environnement Production**

```env
NODE_ENV=production
VITE_API_URL=https://api.campus-sphere.com
VITE_APP_NAME=CampusSphere
VITE_APP_VERSION=1.0.0
```

### **Déploiement Vercel**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

---

## 📝 Notes pour le Développeur Backend

### **1. Points d'Attention**

- **Authentification**: JWT avec refresh tokens
- **Upload de fichiers**: Validation stricte des types et tailles
- **Permissions**: Système de rôles pour les sphères
- **Notifications**: WebSockets pour le temps réel
- **Recherche**: Indexation des posts et ressources
- **Cache**: Redis pour les données fréquemment accédées

### **2. Sécurité**

- Validation côté serveur de tous les inputs
- Rate limiting sur les endpoints sensibles
- CORS configuré correctement
- Sanitization des contenus utilisateur
- Chiffrement des mots de passe (bcrypt)

### **3. Performance**

- Pagination sur toutes les listes
- Lazy loading des images
- Compression des fichiers uploadés
- CDN pour les assets statiques
- Monitoring des performances

### **4. Monitoring**

- Logs structurés (Winston)
- Métriques de performance
- Alertes sur les erreurs
- Dashboard de monitoring
- Backup automatique de la base

---

## 🎯 Roadmap

### **Phase 1 - MVP (Actuelle)**
- ✅ Authentification et profils
- ✅ Sphères collaboratives
- ✅ Posts et ressources
- ✅ Messagerie basique
- ✅ Système d'impact score

### **Phase 2 - Améliorations**
- 🔄 Notifications push
- 🔄 Recherche avancée
- 🔄 Système de recommandations
- 🔄 Analytics utilisateur
- 🔄 Mobile app (React Native)

### **Phase 3 - Fonctionnalités Avancées**
- 📅 Calendrier d'événements
- 📅 Système de badges
- 📅 Marketplace étudiant
- 📅 Intégration universités
- 📅 API publique

---

## 📞 Support et Contact

Pour toute question technique ou clarification sur l'implémentation, n'hésitez pas à consulter cette documentation ou à poser des questions spécifiques sur les composants et fonctionnalités.

**Bonne continuation avec le développement de CampusSphere ! 🚀**
