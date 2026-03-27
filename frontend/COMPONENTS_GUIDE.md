# 🧩 Guide des Composants CampusSphere

## 📋 Table des Matières

1. [Composants UI de Base](#composants-ui-de-base)
2. [Composants de Formulaires](#composants-de-formulaires)
3. [Composants de Layout](#composants-de-layout)
4. [Composants de Modales](#composants-de-modales)
5. [Composants de Feed](#composants-de-feed)
6. [Composants de Chat](#composants-de-chat)
7. [Composants d'Upload](#composants-dupload)
8. [Exemples d'Utilisation](#exemples-dutilisation)

---

## 🎨 Composants UI de Base

### `Combobox` (`src/components/ui/combobox.tsx`)

**Description**: Composant Combobox réutilisable avec recherche intégrée, basé sur Radix UI.

**Props**:
```typescript
interface ComboboxProps {
  options: { value: string; label: string }[]  // Options disponibles
  value?: string                               // Valeur sélectionnée
  onValueChange?: (value: string) => void     // Callback de changement
  placeholder?: string                         // Placeholder par défaut
  searchPlaceholder?: string                   // Placeholder de recherche
  emptyMessage?: string                        // Message si aucun résultat
  className?: string                           // Classes CSS additionnelles
  disabled?: boolean                           // État désactivé
}
```

**Utilisation**:
```tsx
import { Combobox } from "@/components/ui/combobox";

const options = [
  { value: "option1", label: "Option 1" },
  { value: "option2", label: "Option 2" }
];

<Combobox
  options={options}
  value={selectedValue}
  onValueChange={setSelectedValue}
  placeholder="Sélectionner une option"
  searchPlaceholder="Rechercher..."
  emptyMessage="Aucun résultat trouvé"
/>
```

**Fonctionnalités**:
- ✅ Recherche en temps réel
- ✅ Sélection visuelle avec check mark
- ✅ Navigation clavier (flèches, Enter, Escape)
- ✅ Accessibilité ARIA complète
- ✅ Support des états désactivés
- ✅ Personnalisation des messages

---

## 📝 Composants de Formulaires

### `UniversityCombobox` (`src/components/forms/UniversityCombobox.tsx`)

**Description**: Sélecteur d'universités camerounaises avec recherche.

**Données incluses**:
```typescript
const universities = [
  { value: "douala", label: "Université de Douala" },
  { value: "yaounde1", label: "Université de Yaoundé I" },
  { value: "yaounde2", label: "Université de Yaoundé II" },
  { value: "dschang", label: "Université de Dschang" },
  { value: "ngaoundere", label: "Université de Ngaoundéré" },
  { value: "buea", label: "Université de Buea" },
  { value: "bamenda", label: "Université de Bamenda" },
  { value: "maroua", label: "Université de Maroua" },
  { value: "bertoua", label: "Université de Bertoua" },
  { value: "garoua", label: "Université de Garoua" },
  { value: "ebolowa", label: "Université d'Ebolowa" },
  { value: "nkolbisson", label: "Université de Nkolbisson" },
  { value: "other", label: "Autre université" }
];
```

**Utilisation**:
```tsx
import { UniversityCombobox } from "@/components/forms/UniversityCombobox";

<UniversityCombobox
  value={formData.university}
  onValueChange={(value) => setFormData({...formData, university: value})}
  placeholder="Sélectionner votre université"
  className="mt-2"
/>
```

### `FacultyCombobox` (`src/components/forms/FacultyCombobox.tsx`)

**Description**: Sélecteur de filières académiques.

**Catégories incluses**:
- **Sciences**: Informatique, Mathématiques, Physique, Chimie, Biologie
- **Santé**: Médecine, Pharmacie, Vétérinaire
- **Ingénierie**: Génie Civil, Mécanique, Électrique, Chimique
- **Lettres**: Lettres et Sciences Humaines, Langues, Philosophie
- **Économie**: Économie, Droit, Communication
- **Arts**: Arts, Musique, Sport
- **Agriculture**: Agronomie, Foresterie

**Utilisation**:
```tsx
import { FacultyCombobox } from "@/components/forms/FacultyCombobox";

<FacultyCombobox
  value={formData.faculty}
  onValueChange={(value) => setFormData({...formData, faculty: value})}
  placeholder="Sélectionner votre filière"
/>
```

### `StudyLevelCombobox` (`src/components/forms/StudyLevelCombobox.tsx`)

**Description**: Sélecteur de niveaux d'études du système éducatif camerounais.

**Niveaux inclus**:
```typescript
const studyLevels = [
  // BTS/HND
  { value: "bts1", label: "BTS 1" },
  { value: "bts2", label: "BTS 2" },
  { value: "hnd1", label: "HND 1" },
  { value: "hnd2", label: "HND 2" },
  
  // Licence/Bachelor
  { value: "l1", label: "Licence 1" },
  { value: "l2", label: "Licence 2" },
  { value: "l3", label: "Licence 3" },
  { value: "bachelor1", label: "Bachelor 1" },
  { value: "bachelor2", label: "Bachelor 2" },
  { value: "bachelor3", label: "Bachelor 3" },
  { value: "bachelor4", label: "Bachelor 4" },
  
  // Master
  { value: "m1", label: "Master 1" },
  { value: "m2", label: "Master 2" },
  
  // Doctorat/PhD
  { value: "d1", label: "Doctorat 1" },
  { value: "d2", label: "Doctorat 2" },
  { value: "d3", label: "Doctorat 3" },
  { value: "phd1", label: "PhD 1" },
  { value: "phd2", label: "PhD 2" },
  { value: "phd3", label: "PhD 3" }
];
```

### `CityCombobox` (`src/components/forms/CityCombobox.tsx`)

**Description**: Sélecteur de villes camerounaises par région.

**Régions couvertes**:
- **Littoral**: Douala, Edéa, Kribi
- **Centre**: Yaoundé, Nkonbisson
- **Ouest**: Bafoussam, Dschang, Foumban, Bafang
- **Nord-Ouest**: Bamenda, Wum, Kumbo, Nkambé
- **Sud-Ouest**: Buea, Limbe, Kumba
- **Est**: Bertoua, Abong-Mbang, Yokadouma
- **Nord**: Garoua, Maroua
- **Adamaoua**: Ngaoundéré, Meiganga, Tibati

### `ProfessionCombobox` (`src/components/forms/ProfessionCombobox.tsx`)

**Description**: Sélecteur de professions couvrant tous les secteurs.

**Secteurs inclus**:
- **IT**: Développeur, Ingénieur Logiciel, DevOps, Data Scientist
- **Santé**: Médecin, Infirmier, Pharmacien, Dentiste
- **Droit**: Avocat, Notaire, Juge
- **Éducation**: Enseignant, Chercheur
- **Ingénierie**: Civil, Mécanique, Électrique, Chimique
- **Arts**: Artiste, Musicien, Acteur, Photographe
- **Services**: Commercial, Marketing, Communication
- **Artisanat**: Mécanicien, Électricien, Plombier

---

## 🏗️ Composants de Layout

### `AppLayout` (`src/components/layout/AppLayout.tsx`)

**Description**: Layout principal de l'application avec navigation responsive.

**Structure**:
```tsx
<div className="min-h-screen bg-background">
  {/* Sidebar Desktop */}
  <Sidebar className="hidden md:flex" />
  
  {/* Contenu Principal */}
  <div className="flex-1">
    {/* TopBar */}
    <TopBar />
    
    {/* Contenu des Pages */}
    <main className="p-6">
      {children}
    </main>
  </div>
  
  {/* Navigation Mobile */}
  <MobileNavigation className="md:hidden" />
</div>
```

**Responsive**:
- **Desktop**: Sidebar fixe + TopBar
- **Mobile**: TopBar + Bottom Navigation

### `MobileNavigation` (`src/components/layout/MobileNavigation.tsx`)

**Description**: Navigation mobile avec 5 onglets principaux.

**Onglets**:
```typescript
const navigationItems = [
  { name: "Accueil", href: "/", icon: Home },
  { name: "Ressources", href: "/resources", icon: FileText },
  { name: "Sphères", href: "/spheres", icon: Users },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Notifications", href: "/notifications", icon: Bell }
];
```

**Fonctionnalités**:
- ✅ Navigation active avec indicateur
- ✅ Icônes Lucide React
- ✅ Responsive design
- ✅ Accessibilité clavier

### `MobileTopBar` (`src/components/layout/MobileTopBar.tsx`)

**Description**: Barre supérieure mobile avec ProfileBubble.

**Éléments**:
- Logo CampusSphere
- ProfileBubble (avatar + menu)
- Navigation contextuelle

### `ProfileBubble` (`src/components/layout/ProfileBubble.tsx`)

**Description**: Bulle de profil avec menu déroulant.

**Menu**:
```tsx
<DropdownMenuContent>
  <DropdownMenuItem onClick={() => navigate('/profile')}>
    <User className="mr-2 h-4 w-4" />
    Profil
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => navigate('/notifications')}>
    <Bell className="mr-2 h-4 w-4" />
    Notifications
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => navigate('/settings')}>
    <Settings className="mr-2 h-4 w-4" />
    Paramètres
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem onClick={handleLogout}>
    <LogOut className="mr-2 h-4 w-4" />
    Déconnexion
  </DropdownMenuItem>
</DropdownMenuContent>
```

---

## 🪟 Composants de Modales

### `CreateSpherePostModal` (`src/components/modals/CreateSpherePostModal.tsx`)

**Description**: Modal de création de posts dans les sphères avec fonctionnalités avancées.

**Props**:
```typescript
interface CreateSpherePostModalProps {
  children: React.ReactNode;           // Trigger du modal
  onPostCreated?: (postData: PostData) => void;  // Callback de création
  sphereId?: string;                   // ID de la sphère
  sphereName?: string;                 // Nom de la sphère
}
```

**Champs du formulaire**:
```typescript
interface PostData {
  content: string;                     // Contenu du post (max 500 chars)
  location: string;                    // Localisation optionnelle
  tags: string[];                      // Tags (max 5)
  category: string;                    // Catégorie
  visibility: string;                  // Visibilité
  allowComments: boolean;              // Autoriser commentaires
  files: File[];                       // Fichiers joints
  subject: string;                     // Matière
  type: string;                        // Type de contenu
  audience: string;                    // Audience cible
  sphereId?: string;                   // ID sphère
  sphereName?: string;                 // Nom sphère
  timestamp: string;                   // Timestamp
}
```

**Fonctionnalités avancées**:
- ✅ **Brouillons**: Sauvegarde/chargement avec localStorage
- ✅ **Upload**: Fichiers multiples (max 50MB)
- ✅ **Emojis**: Picker avec 16 emojis populaires
- ✅ **Mentions**: @username avec utilisateurs mock
- ✅ **Validation**: Champs obligatoires et limites
- ✅ **Programmation**: Interface pour publication différée

**Utilisation**:
```tsx
import { CreateSpherePostModal } from "@/components/modals/CreateSpherePostModal";

<CreateSpherePostModal
  onPostCreated={handleNewPost}
  sphereId={sphere.id}
  sphereName={sphere.name}
>
  <Button>Créer un post</Button>
</CreateSpherePostModal>
```

### `UploadResourceModal` (`src/components/modals/UploadResourceModal.tsx`)

**Description**: Modal d'upload de ressources avec métadonnées complètes.

**Champs**:
- **Fichier**: Upload avec drag & drop
- **Titre**: Nom de la ressource
- **Description**: Description détaillée
- **Matière**: Sélection parmi les filières
- **Type**: Notes, Résumés, Exercices, Projets, Présentations
- **Visibilité**: Public, Université, Amis
- **Audience**: Niveaux d'études ciblés
- **Tags**: Système de tags

**Types de fichiers supportés**:
```typescript
const allowedTypes = [
  'application/pdf',           // PDF
  'application/msword',        // DOC
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/vnd.ms-powerpoint', // PPT
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
  'application/zip'            // ZIP
];
```

### `CreateTaskModal` (`src/components/modals/CreateTaskModal.tsx`)

**Description**: Modal de création de tâches dans les sphères.

**Champs**:
- **Titre**: Nom de la tâche
- **Description**: Description détaillée
- **Assignation**: Membre de la sphère ou "Non assigné"
- **Priorité**: Haute, Moyenne, Basse
- **Date limite**: Sélection de date
- **Impact Points**: Points d'impact (5 par défaut)

**Validation**:
```typescript
const taskSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string().min(1, "Description requise"),
  assignedToId: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]),
  dueDate: z.string().min(1, "Date limite requise"),
  impactPoints: z.number().min(1).max(100)
});
```

### `AddEducationModal` (`src/components/modals/AddEducationModal.tsx`)

**Description**: Modal d'ajout de formation.

**Champs**:
- **Diplôme**: Nom du diplôme
- **Établissement**: Nom de l'école/université
- **Année**: Année d'obtention
- **Description**: Description optionnelle

### `AddExperienceModal` (`src/components/modals/AddExperienceModal.tsx`)

**Description**: Modal d'ajout d'expérience professionnelle.

**Champs**:
- **Poste**: Titre du poste
- **Entreprise**: Nom de l'entreprise
- **Durée**: Période d'emploi
- **Description**: Description des responsabilités

---

## 📰 Composants de Feed

### `CreatePost` (`src/components/feed/CreatePost.tsx`)

**Description**: Composant de création de posts sur le feed principal.

**Interface**:
```tsx
<Card className="campus-card cursor-pointer hover:campus-glow">
  <CardContent className="p-4">
    <div className="flex gap-3 items-center">
      <Avatar>
        <AvatarImage src="/placeholder-avatar.jpg" />
        <AvatarFallback>ME</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <span className="text-sm font-medium text-muted-foreground">
          Que voulez-vous partager ?
        </span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span className="text-sm">Photo</span>
          </div>
          {/* Autres actions */}
        </div>
      </div>
      <div className="w-8 h-8 campus-gradient rounded-full flex items-center justify-center">
        <Plus className="h-4 w-4 text-white" />
      </div>
    </div>
  </CardContent>
</Card>
```

### `CreateSpherePost` (`src/components/feed/CreateSpherePost.tsx`)

**Description**: Composant de création de posts dans les sphères.

**Différences avec CreatePost**:
- Message contextuel avec nom de la sphère
- Même interface mais adaptée au contexte sphère
- Utilise `CreateSpherePostModal` au lieu de `CreatePostModal`

### `PostCard` (`src/components/feed/PostCard.tsx`)

**Description**: Carte d'affichage des posts.

**Éléments**:
```tsx
<div className="campus-card">
  {/* En-tête avec avatar et infos auteur */}
  <div className="flex items-center gap-3 p-4">
    <Avatar>
      <AvatarImage src={post.author.avatar} />
      <AvatarFallback>{post.author.firstName[0]}</AvatarFallback>
    </Avatar>
    <div>
      <h4 className="font-semibold">{post.author.firstName} {post.author.lastName}</h4>
      <p className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</p>
    </div>
  </div>
  
  {/* Contenu du post */}
  <div className="px-4 pb-4">
    <p className="text-sm">{post.content}</p>
    
    {/* Médias attachés */}
    {post.files && post.files.length > 0 && (
      <div className="mt-3">
        {/* Affichage des médias */}
      </div>
    )}
    
    {/* Actions */}
    <div className="flex items-center gap-4 mt-3">
      <Button variant="ghost" size="sm">
        <Heart className="h-4 w-4 mr-1" />
        {post.likes}
      </Button>
      <Button variant="ghost" size="sm">
        <MessageSquare className="h-4 w-4 mr-1" />
        {post.comments}
      </Button>
      <div className="flex items-center gap-1 ml-auto">
        <Zap className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-medium">{post.impactScore}</span>
      </div>
    </div>
  </div>
</div>
```

---

## 💬 Composants de Chat

### `MiniChat` (`src/components/chat/MiniChat.tsx`)

**Description**: Chat intégré dans les sphères.

**Fonctionnalités**:
```tsx
<div className="border rounded-lg">
  {/* Messages */}
  <div className="h-64 overflow-y-auto p-4 space-y-3">
    {messages.map((message) => (
      <div key={message.id} className="flex gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={message.author.avatar} />
          <AvatarFallback>{message.author.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-muted rounded-lg p-2">
            <p className="text-sm">{message.content}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatTime(message.createdAt)}
            </p>
          </div>
        </div>
      </div>
    ))}
  </div>
  
  {/* Input */}
  <div className="border-t p-3">
    <div className="flex gap-2">
      <Input
        placeholder="Tapez votre message..."
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
      />
      <Button onClick={handleSend} size="sm">
        <Send className="h-4 w-4" />
      </Button>
    </div>
  </div>
</div>
```

**Fonctionnalités**:
- ✅ Messages en temps réel (mock)
- ✅ Input avec bouton d'envoi
- ✅ Scroll automatique vers le bas
- ✅ Interface compacte et responsive
- ✅ Avatars des utilisateurs

---

## 📤 Composants d'Upload

### `FileUpload` (`src/components/upload/FileUpload.tsx`)

**Description**: Composant d'upload de fichiers avec drag & drop.

**Fonctionnalités**:
```tsx
<div
  className="border-2 border-dashed border-border rounded-lg p-6 text-center"
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
>
  {files.length > 0 ? (
    <div className="space-y-2">
      {files.map((file, index) => (
        <div key={index} className="flex items-center justify-between p-2 border rounded">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm">{file.name}</span>
            <span className="text-xs text-muted-foreground">
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => removeFile(index)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  ) : (
    <div>
      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
      <div className="mt-2">
        <Button variant="outline" onClick={() => inputRef.current?.click()}>
          Choisir des fichiers
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          PDF, DOC, PPT, ZIP jusqu'à 50MB
        </p>
      </div>
    </div>
  )}
</div>
```

**Validation**:
- Types de fichiers autorisés
- Taille maximale (50MB)
- Nombre maximum de fichiers
- Feedback visuel

---

## 💡 Exemples d'Utilisation

### Intégration d'un Combobox dans un formulaire

```tsx
import { useState } from 'react';
import { UniversityCombobox } from '@/components/forms/UniversityCombobox';
import { FacultyCombobox } from '@/components/forms/FacultyCombobox';
import { StudyLevelCombobox } from '@/components/forms/StudyLevelCombobox';

function AcademicForm() {
  const [formData, setFormData] = useState({
    university: '',
    faculty: '',
    studyYear: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Université *</Label>
        <UniversityCombobox
          value={formData.university}
          onValueChange={(value) => handleInputChange('university', value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label>Filière *</Label>
        <FacultyCombobox
          value={formData.faculty}
          onValueChange={(value) => handleInputChange('faculty', value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label>Niveau d'études *</Label>
        <StudyLevelCombobox
          value={formData.studyYear}
          onValueChange={(value) => handleInputChange('studyYear', value)}
          className="mt-2"
        />
      </div>
    </div>
  );
}
```

### Création d'une modale personnalisée

```tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function CustomModal({ children, onSave }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleSubmit = () => {
    onSave(formData);
    setIsOpen(false);
    setFormData({ name: '', description: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un élément</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              Créer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Utilisation du système de brouillons

```tsx
import { useState, useEffect } from 'react';

function PostEditor() {
  const [content, setContent] = useState('');
  const [isDraft, setIsDraft] = useState(false);

  // Charger le brouillon au montage
  useEffect(() => {
    const draft = localStorage.getItem('postDraft');
    if (draft) {
      setContent(JSON.parse(draft).content);
    }
  }, []);

  // Sauvegarder automatiquement
  useEffect(() => {
    if (content) {
      const draft = { content, timestamp: Date.now() };
      localStorage.setItem('postDraft', JSON.stringify(draft));
      setIsDraft(true);
    }
  }, [content]);

  const clearDraft = () => {
    localStorage.removeItem('postDraft');
    setContent('');
    setIsDraft(false);
  };

  return (
    <div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Écrivez votre post..."
      />
      
      {isDraft && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">
            Brouillon sauvegardé
          </span>
          <Button size="sm" variant="ghost" onClick={clearDraft}>
            Effacer
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Bonnes Pratiques

### 1. **Réutilisabilité**
- Utilisez les composants Combobox pour tous les sélecteurs
- Créez des composants modulaires et configurables
- Évitez la duplication de code

### 2. **Accessibilité**
- Utilisez les attributs ARIA appropriés
- Supportez la navigation clavier
- Fournissez des labels descriptifs

### 3. **Performance**
- Utilisez `useMemo` pour les calculs coûteux
- Implémentez le lazy loading pour les composants lourds
- Optimisez les re-renders avec `useCallback`

### 4. **Validation**
- Validez les données côté client et serveur
- Fournissez des messages d'erreur clairs
- Utilisez Zod pour la validation des schémas

### 5. **État**
- Utilisez localStorage pour la persistance
- Gérez l'état local avec useState
- Implémentez la synchronisation avec le serveur

---

Cette documentation couvre tous les composants principaux de CampusSphere. Chaque composant est conçu pour être réutilisable, accessible et performant. N'hésitez pas à consulter le code source pour des détails d'implémentation spécifiques.
