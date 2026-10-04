# Sphera - Refonte Ergonomique & Architecture Artefacts (Inspiré de YouLearn)

## 1. Contexte & Vision

Le modèle initial de Sphera était conçu comme un flux linéaire rigide :
```
Upload document -> Crée une session -> Génère UN seul jeu d'outils figé -> Terminé
```

### Problème identifié
Pour réviser efficacement, un étudiant a besoin d'itérer :
* Générer un quiz, le passer, puis en générer un **deuxième** différent sur le même cours pour retester ses lacunes.
* Créer des séries de flashcards ciblées par chapitre.
* Avoir une fiche de cours structurée qui serve de colonne vertébrale pour lancer des révisions par bloc.
* Poser des questions dans le chat sur différents sujets sans tout mélanger dans un seul fil.

### Modèle cible (Aligné sur le standard YouLearn)
* **Pas de refonte complexe des sources :** On conserve le modèle d'upload direct existant (`1 document = 1 session d'étude`).
* **La vraie nouveauté : les ARTEFACTS multiples et cumulables :**
  À partir d'un même document, l'étudiant peut déclencher autant d'outils qu'il le souhaite. Chaque génération produit un **Artefact** indépendant qui vient s'ajouter dans sa bibliothèque **"Mes ensembles"** sur le panneau latéral droit.

---

## 2. Extraction du Document : Diagnostic & Nouveau Standard

### Le diagnostic du problème actuel
Dans `apps/backend/src/services/extraction.ts`, l'extraction était bridée en dur :
```typescript
export const MAX_CHARS = 40_000;
const clamp = (text: string): string => text.slice(0, MAX_CHARS).trim();
```
Tout document de plus de ~15 pages était **tronqué brutalement**. Les pages 16 à 80 étaient purement et simplement ignorées par l'IA, ce qui dégradait lourdement la pertinence des fiches, des quiz et du podcast.

### Comment les IA modernes (YouLearn, NotebookLM, Claude) traitent les documents

1. **Fin du bridage de contexte :**
   * Claude 3.5 Haiku/Sonnet dispose de **200 000 tokens** (~600 pages).
   * DeepSeek V3 dispose de **128 000 tokens** (~350 pages).
   * La limite de 40 000 caractères est levée : le système extrait désormais jusqu'à **400 000 à 500 000 caractères** (couvrant des cours entiers de plus de 100 pages).

2. **Extraction structurée avec repères de pages (`[Page X]`) :**
   * Au lieu d'amalgamer tout le texte en un seul bloc plat, l'extracteur préserve la pagination réelle du document :
     ```text
     --- [Page 1] ---
     Titre du cours...
     --- [Page 2] ---
     Chapitre 1 : Introduction...
     ```
   * Cela permet d'alimenter la pagination du visualiseur (`8 / 76` comme dans YouLearn) et permet à l'IA de citer précisément ses sources dans les explications.

3. **Préservation de la mise en page et des colonnes :**
   * Utilisation de `pdftotext -layout` ou d'un parser positionnel pour éviter que le texte de deux colonnes ne se retrouve entrelacé ligne par ligne.

4. **Traitement Multimodal natif (Document direct sur Bedrock) :**
   * Pour les PDF contenant des formules, tableaux ou schémas, passage possible du document binaire directement à l'API Claude sur Bedrock (`document` block supporté nativement jusqu'à 32 Mo), permettant au modèle de "voir" la mise en page réelle sans perte d'information.

---

## 3. Le Podcast Audio : Résolution du contenu

### Diagnostic du problème de contenu
Le podcast ne souffrait pas seulement d'éventuels soucis TTS, mais surtout de la qualité du script généré :
1. **Conséquence de la troncature :** En ne lisant que les 40 000 premiers caractères, le podcast ne parlait que de l'introduction du cours et ignorait les 80 % restants.
2. **Prompt trop superficiel :** Le dialogue actuel se cantonnait à un échange rapide (10-14 répliques de "small talk" de surface), sans entrer dans les détails techniques ou les subtilités du cours.

### Nouveau format "Deep Dive" didactique
Inspiré du format podcast de NotebookLM :
* **Deux rôles complémentaires et équilibrés :**
  * **Locuteur A (L'analyste pédagogue) :** Explique la logique des concepts avec des métaphores concrètes du quotidien et clarifie les points difficiles.
  * **Locuteur B (Le curieux méthodique) :** Pose les vraies questions qu'un étudiant se pose en révision, pointe les pièges classiques et fait synthétiser les étapes clés.
* **Structure en 3 temps :**
  1. *L'accroche & la vue d'ensemble :* Pourquoi ce sujet est important et à quoi il sert concrètement.
  2. *Le cœur du sujet :* Décorticage approfondi des grands principes du cours (avec exemples concrets tirés du document).
  3. *Le débriefing examens :* Les 3 points pièges à ne surtout pas confondre le jour du partiel.
* **Choix de la portée :** L'étudiant peut choisir de générer le podcast sur **l'ensemble du document** ou sur **un chapitre spécifique**.

---

## 4. Redesign de la Fiche de Révision (Par Blocs & Chapitres)

La fiche de cours devient le tableau de bord pédagogique du document.

### Structure par Blocs / Chapitres
Plutôt qu'un pavé de texte continu, la fiche décompose le cours :

```
+-------------------------------------------------------------------+
|  FICHE DE COURS : Systèmes Numériques & Échantillonnage           |
+-------------------------------------------------------------------+
| [Chapitre 1 : Numérisation du Signal]                             |
|  Résumé complet et explicatif des principes fondamentaux...      |
|  Points clés : Théorème de Nyquist-Shannon, repliement de spectre |
|  [🎯 Quiz sur ce chapitre]       [🗂️ Flashcards sur ce chapitre]   |
+-------------------------------------------------------------------+
| [Chapitre 2 : Quantification et Bruit]                            |
|  Résumé pédagogique sur la dynamique, rapport signal/bruit...     |
|  Points clés : Erreur de quantification, codage PCM               |
|  [🎯 Quiz sur ce chapitre]       [🗂️ Flashcards sur ce chapitre]   |
+-------------------------------------------------------------------+
|  > Définitions clés (8) [Déplier]                                 |
|  > Formules essentielles (3) [Déplier]                            |
|  > Pièges & Conseils pour les examens [Déplier]                   |
+-------------------------------------------------------------------+
```

### Principes fonctionnels clés
1. **Actions directes sur chaque bloc :**
   Les boutons `[Quiz sur ce chapitre]` et `[Flashcards sur ce chapitre]` permettent à l'étudiant de réviser un chapitre précis en un clic sans avoir à surligner manuellement du texte.
2. **Sections secondaires escamotables :**
   Les définitions, formules mathématiques et pièges sont rangés dans des volets dépliables pour ne pas encombrer la lecture principale.
3. **Règle d'unicité de la fiche :**
   * Il n'y a **qu'une seule fiche active par document**.
   * On n'empile pas Fiche #1, Fiche #2, Fiche #3.
   * Si l'étudiant souhaite une mise à jour, un bouton **"Régénérer la fiche"** écrase et met à jour la fiche existante.

---

## 5. Le Chat / Q&A multi-sessions (Fils de discussion contextuels)

Comme visible dans YouLearn (`Discuter dans: [Titre du fil] +`), le chat est enrichi :
* **Multi-threads de discussion :**
  L'étudiant peut ouvrir plusieurs discussions séparées sur le même cours (ex : *"Questions Chapitre 1"*, *"Préparation oral de rattrapage"*).
* **Q&A 100 % gratuit (0 quota consommé) :**
  Poser des questions à l'IA ne décompte aucun quota afin d'encourager la curiosité et l'apprentissage libre.
* **Historique persistant :**
  Chaque fil de discussion est conservé et peut être relu ou poursuivi à tout moment.

---

## 6. Modèle de Données (Stack PostgreSQL / Prisma)

CampusSphere utilisant **Prisma ORM** sur PostgreSQL (voir `apps/backend/prisma/schema.prisma`), voici la modélisation cible :

```prisma
// Extension du modèle StudySession existant (conserve la compatibilité)
model StudySession {
  id             Int             @id @default(autoincrement())
  ownerId        Int             @map("owner_id")
  resourceId     Int?            @map("resource_id")
  sphereFileId   Int?            @map("sphere_file_id")
  sourceFilename String          @default("") @map("source_filename")
  extractedText  String          @default("") @map("extracted_text") @db.Text
  pageCount      Int             @default(1) @map("page_count")

  // Fiche unique intégrée (mise à jour lors d'une régénération)
  ficheContent   Json?           @map("fiche_content")

  // Artefacts multiples cumulables créés sur ce cours
  artefacts      Artefact[]

  // Fils de discussion Q&A multiples
  chatThreads    ChatThread[]

  createdAt      DateTime        @default(now()) @map("created_at")
  updatedAt      DateTime        @updatedAt @map("updated_at")

  owner          User            @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  resource       Resource?       @relation(fields: [resourceId], references: [id], onDelete: SetNull)
  sphereFile     SphereFile?     @relation(fields: [sphereFileId], references: [id], onDelete: SetNull)

  @@index([ownerId, createdAt])
  @@map("study_sessions")
}

model Artefact {
  id             Int          @id @default(autoincrement())
  sessionId      Int          @map("session_id")
  ownerId        Int          @map("owner_id")

  // Type d'artefact : 'quiz', 'flashcards', 'mindmap', 'audio', 'note'
  type           String       @map("type")
  title          String       @default("") // Ex: "Quiz #2 - Chapitre 1"
  subtitle       String?      // Ex: "20 questions • Chapitre 1"
  content        Json         @default("{}")

  // Origine ciblée optionnelle
  targetChapter  String?      @map("target_chapter")
  fromSelection  Boolean      @default(false) @map("from_selection")
  selectionText  String?      @map("selection_text") @db.Text

  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")

  session        StudySession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  owner          User         @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  @@index([sessionId, createdAt])
  @@map("artefacts")
}

model ChatThread {
  id             Int           @id @default(autoincrement())
  sessionId      Int           @map("session_id")
  ownerId        Int           @map("owner_id")
  title          String        @default("Discussion générale")
  messages       ChatMessage[]

  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")

  session        StudySession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  owner          User          @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@map("sphera_chat_threads")
}

model ChatMessage {
  id        Int        @id @default(autoincrement())
  threadId  Int        @map("thread_id")
  role      String     // 'user' | 'assistant'
  content   String     @db.Text
  createdAt DateTime   @default(now()) @map("created_at")

  thread    ChatThread @relation(fields: [threadId], references: [id], onDelete: Cascade)

  @@index([threadId, createdAt])
  @@map("sphera_chat_messages")
}
```

---

## 7. Spécification de l'Interface (Layout YouLearn 3 Colonnes)

```
+------------------+------------------------------------+--------------------------------------+
|  VOLET GAUCHE    |       ZONE CENTRALE (COURS)        |       VOLET DROIT (OUTILS & ENSEMBLES)|
|                  |                                    |                                      |
|  [+ Nouveau doc] |  [Titre du Document]               |  GÉNÉRER                              |
|                  |  < 8 / 76 >  [Écouter] [Ajuster]   |  +--------------------------------+  |
|  RÉCENTS :       |                                    |  | [🎙️ Podcast]    | [📄 Fiche]   |  |
|  • Signal Num.   |  Visualiseur de lecture :          |  | [❓ Quiz]       | [🗂️ Flashcards]| |
|  • Algèbre L2    |  - Typographie soignée             |  | [🗺️ Mindmap]    | [📝 Note perso]| |
|  • Droit Civil   |  - Titres calibrés (h1/h2 épurés)  |  +--------------------------------+  |
|                  |  - Interligne de lecture aéré      |                                      |
|                  |  - Dark mode émeraude Sphera       |  MES ENSEMBLES (3)            [Filtre]|
|                  |                                    |  +--------------------------------+  |
|                  |  (Sélection de texte possible      |  | ❓ Quiz #1 - Général       ⋮ |  |
|                  |   pour génération rapide)          |  |    20 questions • Tout le cours|  |
|                  |                                    |  +--------------------------------+  |
|                  |                                    |  | 🗂️ Flashcards Chap. 2      ⋮ |  |
|                  |                                    |  |    15 cartes • Quantification  |  |
|                  |                                    |  +--------------------------------+  |
|                  |                                    |  | 🎙️ Podcast Deep Dive       ⋮ |  |
|                  |                                    |  |    Audio 4 min • Tout le cours |  |
|                  |                                    |  +--------------------------------+  |
|                  |                                    |                                      |
|                  |                                    |  DISCUTER DANS :                     |
|                  |                                    |  [• Chapitre 1: Échantillonnage v] [+]|
|                  |                                    |  [Pose une question sur ce cours... 🎙️]|
+------------------+------------------------------------+--------------------------------------+
```

### Charte des icônes & codes couleur (@phosphor-icons/react)
* 🎙️ **Podcast :** `<Waveform weight="duotone" />` — Violet (`#8B5CF6` / `text-purple-400`, fond `bg-purple-500/10`)
* 📄 **Fiche de cours :** `<FileText weight="duotone" />` — Cyan (`#06B6D4` / `text-cyan-400`, fond `bg-cyan-500/10`)
* ❓ **Quiz :** `<Exam weight="duotone" />` — Rouge carmin (`#F43F5E` / `text-rose-400`, fond `bg-rose-500/10`)
* 🗂️ **Cartes mémoire :** `<Cards weight="duotone" />` — Orange ambré (`#F97316` / `text-orange-400`, fond `bg-orange-500/10`)
* 🗺️ **Carte mentale :** `<GitFork weight="duotone" />` — Vert émeraude Sphera (`#10B981` / `text-emerald-400`, fond `bg-emerald-500/10`)
* 📝 **Notes perso :** `<Note weight="duotone" />` — Jaune doré (`#EAB308` / `text-yellow-400`, fond `bg-yellow-500/10`)
* 💬 **Chat Q&A :** `<ChatCircle weight="duotone" />` — Gris/Blanc neutre (`text-zinc-300 bg-zinc-800`)

### Typographie du lecteur central
* **Police :** Sans-serif moderne à haute lisibilité (`Plus Jakarta Sans` ou `Inter`).
* **Titres H1/H2 :** Tailles adoucies (ex: `text-xl font-semibold` pour H1 au lieu de `text-3xl`), sans gras excessif.
* **Corps de texte :** `text-sm leading-relaxed text-zinc-800 dark:text-zinc-200`, largeur de lecture optimisée (`max-w-3xl mx-auto`).

---

## 8. Quotas Élargis (10 Générations / Semaine avec Fractions 0.5)

1. **Volume Hebdomadaire :**
   * Quota fixé à **10 générations par semaine** (renouvelé chaque lundi matin).

2. **Barème de décompte fractionné :**
   * **1.0 génération (Plein tarif) :**
     * Outil complet généré sur tout le cours (Fiche initiale, Quiz global 20 questions, Flashcards complètes, Mindmap générale, Podcast audio).
   * **0.5 génération (Demi-tarif) :**
     * Outil ciblé sur un seul bloc / chapitre (ex: clic sur le bouton `[Quiz Chapitre 2]` de la fiche).
     * Génération depuis une sélection manuelle de texte.
     * Régénération d'une fiche existante.
   * **0 génération (100 % Gratuit) :**
     * **Questions dans le Chat Q&A** : Illimité.
     * **Prise de notes personnelles** : Création et édition illimitées.
     * **Consultation / Révision des artefacts créés** : Illimitée.

3. **Bouton Info `(i)` & Paramètres :**
   * Sur la barre de quota : présence d'une icône `<Info weight="duotone" />` ouvrant un popover explicatif avec le barème clair.
   * Dans `SpheraSettingsModal.tsx` : affichage du barème détaillé et de la date de reset.
   * Badge de **Streak (`🔥`)** affiché à côté du quota pour valoriser la régularité d'étude quotidienne de l'étudiant.

---

## 9. Plan d'Implémentation Étape par Étape

1. **Backend - Correction de l'extraction de documents :**
   * Supprimer le plafond artificiel `MAX_CHARS = 40_000` dans `apps/backend/src/services/extraction.ts`.
   * Introduire le découpage avec balises de pages (`--- [Page X] ---`).
2. **Backend - Modèle Prisma & Migrations :**
   * Ajouter les modèles `Artefact`, `ChatThread`, `ChatMessage` dans `schema.prisma`.
   * Générer et appliquer la migration Prisma sans casser les `study_sessions` existantes.
3. **Backend - Nouveaux Prompts IA :**
   * Mettre à jour `fichePrompt` pour produire la structure par chapitres avec points clés et blocs identifiés.
   * Enrichir `audioDialoguePrompt` pour générer le format "Deep Dive" didactique en 3 temps.
4. **Backend - Routes API :**
   * Endpoints pour lister, créer, renommer et supprimer les artefacts d'une session.
   * Endpoints pour gérer les threads de chat et messages associés.
5. **Frontend - Refonte de l'interface (apps/sphera) :**
   * Implémenter le layout 3 colonnes inspiré de YouLearn.
   * Intégrer la grille d'outils avec les nouvelles icônes thématiques.
   * Intégrer le composant "Mes ensembles" listant les artefacts créés.
   * Implémenter la nouvelle vue de Fiche avec résumés par blocs et boutons d'action de quiz/flashcards ciblés.
   * Adapter la barre de chat inférieure avec sélecteur de fil de discussion.
