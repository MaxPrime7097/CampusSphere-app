# 🧠 AI Context & Project Status

Ce fichier sert de mémoire pour les agents IA (comme Antigravity ou autres) afin de conserver l'historique des modifications, l'architecture du projet et les décisions techniques. À lire impérativement au début d'une nouvelle conversation.

## 📌 Vue d'ensemble du Projet
L'écosystème est composé de deux parties principales qui interagissent :
1. **CampusSphere** : Le réseau social académique principal (frontend React/Vite, backend Node/Express).
2. **Sphera App** : L'assistante IA éducative. Elle existe à la fois sous forme d'outil intégré dans CampusSphere (routes `/sphera/*`) et sous forme d'application Standalone (dossier `frontend/sphera-app/` qui tourne souvent sur le port 5174).
   * Note : La connexion entre les deux se fait via le `localStorage` et un passage de tokens SSO (`SSOBridge` / `SSOPopup`).

## ✅ Derniers Avancements & Corrections (Août 2026)

### 1. UI / UX & Responsive
- **Scroll horizontal cassé** : Résolu. L'étirement infini de la page causé par `overflow-x-auto` dans les flexbox a été corrigé en utilisant `min-w-0` sur le conteneur parent (`AppLayout.tsx`) et `inline-grid min-w-full` sur les `TabsList`.
- **Mobile "Edge-to-Edge" (Pleine largeur)** : 
  - Les pages `StudySessionDetail`, `AnnaleDetail`, et le composant `QAChat` occupent désormais 100% de la largeur sur mobile (suppression des marges `.container` au profit de paddings adaptatifs `px-0 sm:px-4`).
  - Même traitement pour le `Dashboard.tsx` de l'application standalone Sphera.
- **Harmonisation des Cartes** : `StudySessionCard` et `AnnaleCard` dans CampusSphere ont été harmonisées pour reprendre le design épuré des cartes de `sphera-app` (logo en haut à gauche, icône de suppression au survol, badges en bas), tout en respectant le mode clair/sombre de CampusSphere (`bg-card`, `border-border`).
- **Refonte des Landing Pages croisées** : 
  - La section dédiée à Sphera sur la Landing Page de CampusSphere a été entièrement redésignée pour calquer l'élégance de la section CampusSphere sur la Landing Page de Sphera.
  - Le design est doux : fonds neutres, glow vert subtil (`opacity-5`), badges neutres et bouton principal neutre (`bg-foreground text-background`) qui devient coloré uniquement au survol.
- **Menu Mobile (MenuDropdown / Burger)** :
  - Suppression des composants `<Card>` qui enfermaient inutilement chaque élément de navigation (Actions, Utilitaires, Admin). Les éléments s'affichent maintenant en pleine largeur pour optimiser l'espace, suivant le design system de la sidebar.
  - Remplacement de l'icône générique `Sparkles` par le logo officiel `SpheraIcon` dans la configuration de navigation (`navigationConfig.ts`).
- **Cartes Ressources & Upload** :
  - Sur `ResourceCard`, le clic sur la carte entière ouvre désormais l'aperçu directement (suppression de l'icône œil). Le bouton Télécharger est passé en gris (`secondary`) pour ne pas surcharger visuellement, avec un survol orange (`hover:bg-primary`).
  - La modale d'upload de ressource (`UploadResourceModal`) gère désormais rigoureusement les noms de fichiers extrêmement longs sans élargir la modale.
- **SpheraHome & Cartes Sphera** :
  - Harmonisation des cartes (`StudySessionCard` et `AnnaleCard`) avec le design natif de l'app Sphera : ajout de l'effet de soulèvement au survol (`hover:-translate-y-1`) et respect du code couleur original des outils (bleu pour Fiches, violet pour Quiz, vert pour Flashcards, orange pour Annales).
  - L'ancien logo avec filtre CSS (`sphera-logo.png`) sur la page d'accueil Sphera a été remplacé par le nouveau composant `SpheraIcon`.
- **Boutons d'Authentification (`Login.tsx`, `Register.tsx`)** : 
  - Le bouton "Continuer avec Facebook" a été masqué (via CSS `hidden`) pour conserver la logique sous-jacente sans polluer l'UI.
  - L'icône Google a été remplacée par sa version officielle multicolore (`FcGoogle` au lieu de `FaGoogle`).

### 2. Logique & Bugs
- **Version d'essai Invité (Sphera)** : Le flux de génération sans compte (Guest) sur la page `/app` (`AppPage.tsx`) envoyait un tableau `tools` au lieu d'une chaîne `tool` dans le routeur, ce qui faisait planter `GuestResult.tsx`. C'est désormais corrigé.
- **Création de Conversation (Backend)** : Le backend Zod exige que les IDs soient des entiers. L'erreur 400 Bad Request lors de la création d'une conversation a été corrigée en forçant un `parseInt(userId)` dans `api.ts`.
- **Réponses aux commentaires (Backend)** : Même problème pour `createComment` (erreur 400), `parentId` est désormais parsé avec `parseInt()` avant d'être envoyé.
- **Messagerie - Duplication & Modification** : 
  - La messagerie envoyait parfois le même message en double/triple à cause d'appuis répétés (absence de vérification `isSending` résolue).
  - Ajout de la mention `(modifié)` sur les messages édités.
- **Modale d'Upload (Troncature)** : Les titres de fichiers très longs (notamment dans `UploadResourceModal.tsx`) déformaient la modale. Ajout des classes `min-w-0 flex-1` et `truncate` pour garantir que le texte soit coupé proprement avec des points de suspension (`...`).
- **Erreurs 401 dans la console** : Les erreurs 401 au chargement initial sont normales et attendues. Elles déclenchent le mécanisme de rafraîchissement (refresh token) encapsulé dans `apiFetch`.

## 🛠️ Règles Techniques & Bonnes Pratiques
1. **Design System** : Toujours utiliser les variables Tailwind globales (`bg-card`, `text-foreground`, `border-border`, `bg-muted`) pour garantir le bon fonctionnement des thèmes clair et sombre sur CampusSphere.
2. **Couleurs de la marque** :
   - Sphera : Vert (`#22c55e` ou `sphera-green` dans l'app standalone)
   - CampusSphere : Orange (`#ff9800` ou `cs-orange`)
3. **Composants d'UI** : Les composants d'interface (Shadcn UI) se trouvent dans `@/components/ui/`.
4. **Standalone vs Intégration** : Faire très attention au contexte lors des modifications sur Sphera. S'assurer de savoir si l'on modifie l'interface intégrée (`frontend/src/sphera/`) ou l'interface standalone (`frontend/sphera-app/`).

## 🚀 Prochaines Étapes
- *(À remplir en fonction des prochaines requêtes)*

## Recent Updates (Phase 1 Refactoring - Spheres)
- Removed emojis from UI titles.
- Converted Spheres.tsx to a Netflix-style dashboard layout without Tabs.
- Corrected categorization logic in Spheres.tsx to map over sphere_types instead of categories.
- Streamlined SphereCard.tsx (neutral banner, no gradient on avatar).
- **Strict Rule Enforced**: ABSOLUTELY NO EMOJIS in conversational responses or UI strings unless explicitly requested.


## Recent Updates (Phase 2 & 3 Refactoring - Resources & Connections)
- Applied the tab-less dashboard architecture to Resources.tsx. Now uses NetflixCarousel for folders, suggestions, and categories, degrading to a grid on search.
- Applied the tab-less dashboard architecture to Connections.tsx. Now displays pending requests, active connections, and suggestions as neat horizontal rows. Search degrades gracefully to a grid.
- Maintained strict no-emojis policy in responses and UI additions.

## 🚀 Refonte Complète Q&A IA, Sélection Interactive & AWS Bedrock (Septembre 2026)

### 1. Refonte UX / UI du Chat Q&A (`AiMessageItem.tsx`)
- **Affichage moderne pleine largeur** : Suppression des bulles d'encadrement et des avatars pour les réponses de l'IA (style ChatGPT / Claude / Gemini). Le texte s'affiche en typographie aérée avec rendu Markdown complet (`MarkdownRenderer`).
- **Bulle utilisateur interactive** : Le message de l'utilisateur reste groupé à droite avec possibilité de modification en direct via une icône crayon (`Pencil`), relançant la génération pour cette question.
- **Barre d'outils sous chaque réponse** :
  - Bouton **Copier** avec confirmation visuelle immédiate (*"Copié"*).
  - Boutons de vote utile / amélioration (**Pouce haut** et **Pouce bas**).
  - Bouton **Régénérer** (`RotateCcw`) pour recalculer une réponse avec annulation propre (`AbortController`).
- **Contrôle du streaming / chargement** : Le bouton Envoyer se transforme dynamiquement en bouton **Stop** (`Square`) pendant la génération de la réponse.

### 2. Création interactive depuis la sélection de texte (`TextSelectionToolbar.tsx`)
- **Barre contextuelle flottante** : L'étudiant peut surligner n'importe quel extrait dans le lecteur de cours ou dans le workspace.
- **Génération directe d'items** : Sélectionner « Créer un Quiz » ou « Créer des Flashcards » appelle l'endpoint backend `POST /api/sphera/sessions/:id/create-from-selection/`.
- **Ajout cumulatif** : Les nouveaux éléments générés sont directement fusionnés dans le contenu de la session existante (`session.content.quiz` ou `session.content.flashcards`) et ouvrent immédiatement l'onglet correspondant avec feedback toast.

### 3. Suggestions de questions dynamiques (`QuestionSuggestions.tsx`)
- **Consommation des questions** : Les suggestions posées par l'étudiant (ou déjà présentes dans l'historique de chat) sont immédiatement retirées de la liste.
- **Masquage automatique** : Dès que toutes les suggestions disponibles ont été explorées, la barre se masque complètement.
- **Mobile Friendly** : Disparition de la scrollbar sur mobile (`no-scrollbar`) tout en garantissant un défilement tactile fluide.

### 4. Personnalité, Directives & Détection de Langue (`prompts.ts`, `userContext.ts`)
- **Harmonisation des prompts système en anglais** : Instructions système unifiées en anglais pour une adhérence et une qualité d'extraction optimales des LLMs.
- **Détection stricte de la langue source** : L'IA détecte la langue du document ou de la question (`<source_text>`, `<student_question>`) et formule impérativement ses réponses dans la même langue (évite le biais du français par défaut sur les cours en anglais).
- **Suppression des salutations répétitives** : L'IA ne répète plus *"Salut [Prénom]"* ou ne récite plus les informations de filière/niveau à chaque réponse dans une discussion suivie.
- **Ton tuteur bienveillant** : Préservation d'un ton chaleureux, encourageant et complice (évite la froideur des modèles corporate).

### 5. Résolution des Builds TypeScript & Docker
- **Accolade fermante dans `ai/index.ts`** : Résolution de l'erreur `error TS1005: '}' expected` sur `generateSuggestions`.
- **Portée des variables dans `sphera.routes.ts`** : Correction du scoping de `newItems` et de l'accesseur au titre de ressource (`session.resource?.title ?? session.sourceFilename`).
- **Validation** : `npx tsc --project tsconfig.build.json` et les 12 tests unitaires backend (`sphera.unit.test.ts`) s'exécutent avec succès (code 0).

### 6. Architecture AWS Bedrock & Claude Haiku 4.5 (`providers.ts`, `env.ts`)
- **Claude Haiku 4.5 officiel** : L'ID officiel AWS Bedrock est `anthropic.claude-haiku-4-5-20251001-v1:0`.
- **Inference Profile ID obligatoire** : Sur Bedrock, l'invocation *on-demand* requiert impérativement un préfixe régional d'inférence cross-région (`us.anthropic.claude-haiku-4-5-20251001-v1:0` ou `eu.anthropic.claude-haiku-4-5-20251001-v1:0`).
- **Résolveur automatique `resolveBedrockClaudeModelId`** : Préfixe automatiquement `us.` ou `eu.` si l'utilisateur l'omet dans sa variable `BEDROCK_CLAUDE_MODEL_ID`.
- **Chaîne de secours résiliente** : En cas de quota journalier Bedrock DeepSeek atteint (*"Too many tokens per day"*), bascule automatique transparente sur `gemini-2.5-flash` puis `groq`.

### 7. Commandes Chat Intelligentes (`CommandMenu.tsx`, `CreateSession.tsx`, `SessionDetail.tsx`)
- **Menu contextuel `@`** : Apparition dynamique d'une modale/popup lors de la saisie d'un `@` dans le champ Q&A avec navigation clavier (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
- **Commandes Outils (`@fiche`, `@quiz`, `@flashcards`)** :
  - Si tapées seules ou cliquées : basculent directement sur l'onglet correspondant ou déclenchent la génération de l'outil sans envoyer de prompt brut au LLM.
  - Élimination du bug du `@` orphelin résiduel à la sélection.
- **Commandes Actions pédagogiques (`@explique`, `@resume`, `@plan`, `@formules`, `@pieges`)** :
  - Interception intelligente avec enrichissement : la question de l'utilisateur est transformée en prompt tuteur structuré (`queryForAi`) tout en conservant l'intitulé court saisi pour l'affichage dans la bulle (`displayQuestion`).

### 8. Lecteur de Cours & Sélection de Texte Interactive (`CourseTextReader.tsx`, `TextSelectionToolbar.tsx`)
- **Lecteur de document dédié** : Rendu clair et lisible du texte extrait du cours ou de l'annale.
- **Détection cross-device** : Prise en charge de la sélection souris (`onMouseUp`) et mobile tactile (`onTouchEnd`) avec calcul géométrique précis des coordonnées de la toolbar flottante.
- **Actions directes sur la sélection** :
  - « Expliquer » : envoie une demande d'explication pédagogique ciblée dans le chat Q&A.
  - « Résumer » : produit une synthèse claire du passage sélectionné dans le chat Q&A.
  - « Créer un Quiz » : génère 1 à 5 QCMs ciblés sur le passage et les injecte dans le quiz de la session (`POST /create-from-selection/`).
  - « Créer des Flashcards » : génère 1 à 5 cartes de révision sur le passage et les injecte dans le paquet.
- **Ajout cumulatif** : Les nouveaux items générés sont fusionnés dans le contenu existant sans écraser les items précédents.

### 9. Extraction de Documents & Audit OCR
- **Utilisation directe du Q&A** : L'étudiant peut désormais poser directement une question dans le Q&A dès l'upload du document : la session est créée à la volée avec le texte extrait, sans forcer la génération préalable d'une fiche ou d'un quiz.
- **Spécification OCR & Robustesse** :
  - Audit des dépendances binaires (`pdftotext`, `tesseract`) et intégration recommandée de `pdf-parse` (rempart 100% JS pour les PDFs vectoriels directs).
  - Rehaussement du plafond d'extraction à 40 000 caractères (contre 12 000 historiquement) pour exploiter les larges fenêtres de contexte de Bedrock.
  - Déblocage des images de cours manuscrits ou photos de tableau (`.png`, `.jpg`, `.webp`).

### 10. Formatting, Rendu Markdown & Sobriété UI
- **Rendu Markdown enrichi (`MarkdownRenderer.tsx`)** : Prise en charge fluide des titres, listes à puces, mise en valeur des concepts clés en gras, blocs de code propres et formules mathématiques.
- **Refonte sobre du header Annales (`AnnaleDetail.tsx`)** :
  - Suppression des blocs encombrants et des boutons surchargés.
  - Design aligné sur le style épuré et sobre de la fiche de résumé, avec un bouton de téléchargement discret.

### 11. Sphera Live (Quiz Multijoueur en Direct)
- **Bouton de retour contextuel** : Présence d'un bouton de retour en haut à gauche sur les écrans « Créer un quiz » et « Rejoindre un quiz » pour regagner facilement l'accueil Sphera Live.
- **Sécurité en cours de partie** : Masquage automatique strict de ce bouton pendant le déroulement effectif du quiz pour empêcher toute sortie accidentelle de l'arène de jeu.

### 12. Recherche Unifiée & Modale de Recherche (`SearchModal`)
- **Remplacement de l'input direct** : Remplacement de l'ancien champ de recherche par un bouton sobre et compact.
- **Modale centralisée** : Ouverture d'une modale fédérant en un seul endroit toutes les révisions, discussions et annales confondues, avec recherche en temps réel et navigation instantanée.

### 13. Export PDF & Fiche de Révision Téléchargeable (`printPdfGenerator.ts`, `ResultViews.tsx`)
- **Élimination intégrale des emojis** :
  - Suppression de tous les emojis (`💡`, `★`, `📖`, `⚡`, `⚠️`, `🎯`) dans le template HTML d'impression PDF et dans l'interface de visualisation.
  - Remplacement par des icônes vectorielles SVG inline ultra-nettes (`ICONS.*`) garantissant un rendu haute définition sans pixellisation ni incohérence d'affichage selon le système d'exploitation.
- **Harmonisation stricte des couleurs de l'application** :
  - Alignement des cartes, bordures et titres sur le design system de l'application :
    - **Résumé** : Bleu (`#2563eb` / `#3b82f6`, fond `#eff6ff`, bordure `#bfdbfe`, accent `#3b82f6`)
    - **Points clés** : Vert Sphera (`#16a34a` / `#22c55e`, fond `#f0fdf4`, badge `#dcfce7`/`#15803d`, accent `#22c55e`)
    - **Définitions & Lexique** : Violet (`#9333ea` / `#a855f7`, fond `#faf5ff`, bordure `#e9d5ff`, accent `#a855f7`)
    - **Formules & Concepts Clés** : Rose / Fuchsia (`#db2777` / `#ec4899`, fond `#fdf2f8`, bordure `#fbcfe8`, accent `#ec4899`)
    - **Pièges & À retenir** : Ambre / Jaune (`#d97706` / `#f59e0b`, fond `#fffbeb`, bordure `#fde68a`, accent `#f59e0b`)
- **Hyperliens cliquables `sphera.campussphere.app`** :
  - Dans l'en-tête de la fiche de révision à l'écran (`ResultViews.tsx`), l'adresse `sphera.campussphere.app` est devenue un lien `<a>` cliquable ouvrant dans un nouvel onglet avec `target="_blank"` et `rel="noopener noreferrer"`.
  - Dans les documents imprimés / PDF (`printPdfGenerator.ts`), l'en-tête ainsi que le pied de page (`.doc-footer`) intègrent des balises `<a>` préservées sous forme de liens hypertexte actifs par les pilotes d'export PDF vectoriels du navigateur.

### 14. Spécifications Sphera V3 : Cartes Mentales (Mind Maps) & Résumé Audio Podcast (Septembre 2026)
- **Modèle de données & Prisma** :
  - Mise à jour de l'enum `StudyToolType` avec `MINDMAP` et `AUDIO`.
  - Régénération du client Prisma via `prisma generate`.
- **Backend & Routage IA** :
  - `prompts.ts` : Ajout de `mindmapPrompt` (JSON arborescent avec `noeud_central`, `branches` colorées et `sous_branches`) et `audioDialoguePrompt` (script de podcast à 2 voix entre un tuteur A et un étudiant B).
  - `ttsProvider.ts` & `audioGeneration.ts` : Architecture de provider TTS interchangeable avec bascule dynamique via la variable `TTS_PROVIDER` (`polly` par défaut ou `azure`).
    - **Amazon Polly** : Activé par défaut via `@aws-sdk/client-polly` en utilisant les identifiants AWS existants (Bedrock/S3) sans nouvelle configuration de compte. Synthèse segmentée par tour de parole (voix neuronales `Mathieu` / `Lea` en français, `Matthew` / `Joanna` en anglais) avec concaténation MP3 fluide.
    - **Azure Speech** : Code conservé intact (`microsoft-cognitiveservices-speech-sdk`, SSML natif multi-voix `Henri` / `Denise`), prêt à être réactivé sans retouche de code dès déblocage du compte Microsoft.
  - `sphera.routes.ts` : Endpoints dédiés `POST /generate/mindmap` et `POST /generate/audio`, prise en charge transparente dans `POST /generate/from-resource/`, `POST /generate/from-upload/`, et synthèse automatique lors du `PATCH /sessions/:id/add-tool/`.
- **Frontend & Composants UI** :
  - **Cartes Mentales (`MindMapView.tsx`)** : Intégration de `reactflow` pour une navigation 2D interactive (pan libre, zoom pincement/molette adapté au mobile, recentrage de vue `fitView`), disposition radiale géométrique et nœuds stylisés selon les thèmes.
  - **Lecteur Audio Podcast (`AudioPlayerView.tsx`)** : Lecteur audio avec timeline / scrubber dynamique, contrôle play/pause, bouton de téléchargement MP3, et accordéon dépliable de la transcription synchronisée avec badges de locuteurs distincts (Étudiant A / Étudiant B).
  - **Intégration navigation & sessions (`StudySessionDetail.tsx`, `StudyToolsModal.tsx`)** : Ajout des onglets et sélecteurs pour les 5 outils d'étude (Fiche, Quiz, Flashcards, Carte mentale, Résumé audio) avec gestion du chargement et de la génération incrémentale.
  - **Harmonisation App Standalone (`sphera-app`)** : Mise à jour des types, de `ToolSelector.tsx`, de `Dashboard.tsx` et du client API `spheraApi.ts`.
  - **Politique Zéro Emoji** : Remplacement systématique par des icônes SVG Lucide (`GitFork`, `AudioLines`, `LocateFixed`, `Play`, `Pause`, `Download`).

### 15. Sphera Live : Hardening Infrastructure, Refonte Auth & Expérience Jeu (Septembre 2026)

#### 1. Différenciation de Marque & Design Auth (`sphera-app`)
- **Étanchéité Visuelle Sphera vs Sphera Live** : Suppression des confusions sur les maquettes et landing pages entre la suite d'étude asynchrone (Sphera) et le mode multijoueur en temps réel (Sphera Live).
- **Refonte des Pages Authentification (`Login.tsx`, `Register.tsx`)** :
  - Inspiration subtile du style moderne de CampusSphere sans en faire une reproduction exacte.
  - Suppression du bouton « Retour à l'accueil » inutile pour recentrer le focus utilisateur.
  - Réhaussement de l'ensemble logo et texte « Sphera » pour aérer l'espace au-dessus du titre.
  - Remplacement du badge « Écosystème CampusSphere » par le badge officiel « Powered by CampusSphere » (calqué sur le hero).
  - Révision des cartes de réassurance latérale avec un contenu orienté sur les bénéfices concrets pour les étudiants.

#### 2. Mécanique de Jeu & Réparation des Règles Quiz Live
- **Distribution Aléatoire IA (Fisher-Yates)** :
  - Résolution du biais de génération où la bonne réponse était quasi systématiquement la lettre A ou B.
  - Implémentation du shuffle Fisher-Yates dans `backend/src/routes/quizLive.routes.ts` (`mapAiQuizQuestions`).
  - Nettoyage regex systématique des préfixes dans le texte des options (`A.`, `B)`, `1-`, etc.) et mise à jour des directives de prompts dans `prompts.ts`.
- **Bouton d'Arrêt d'Urgence du Quiz (`stop_quiz`)** :
  - Ajout d'un bouton d'arrêt pour l'hôte sous les contrôles de volume dans `QuizLiveHost.tsx` avec confirmation modale.
  - Gestion du message WS `stop_quiz` dans `quizLiveSocket.ts` et `useQuizSocket.ts`.
  - Annulation des timers en cours, réinitialisation des scores à 0, passage du statut à `WAITING` et redirection synchronisée de tous les participants vers le salon d'attente sans déconnexion (`quiz_stopped`).
- **Attribution Intégrale des Points (100% des points)** :
  - Suppression de la formule de dégressivité temporelle complexe qui produisait des scores fractionnés (ex: 756 pts).
  - Règle simplifiée et transparente : 100% des points définis sur la question (ex: 1000 pts) sont attribués dès lors que la réponse est juste.
- **Personnalisation Libre du Temps & des Points** :
  - Support de temps et points personnalisés (inputs numériques directs en complément des presets) dans `QuizSetupForm.tsx` et `QuizQuestionsDrawer.tsx`.
- **Modification en Masse dans le Salon d'Attente (`QuizQuestionsDrawer.tsx`)** :
  - Ajout d'une barre de modification globale permettant à l'hôte d'ajuster le temps et/ou le score sur toutes les questions en un seul clic.
  - Endpoint `PATCH /api/quiz-live/:roomCode/questions/` pour sauvegarder les modifications avant le lancement.
- **Bouton Mute Participants (`QuizLiveJoin.tsx`)** :
  - Ajout du bouton mute/démute audio pour les joueurs leur permettant de désactiver le son indépendamment de l'hôte.

#### 3. Résolution du Bug de la Barre de Progression (`TimerBar.tsx`)
- **Diagnostic** : La barre ne diminuait pas de façon fluide et se vidait brutalement en fin de décompte en raison de re-renders React fréquents et de conflits avec la transition CSS `transition-all duration-1000`.
- **Solution 60 FPS** :
  - Réécriture complète de `TimerBar.tsx` avec boucle `requestAnimationFrame` et mise à jour directe du style DOM (`barRef.current.style.width`).
  - Découplage CSS : seule la couleur de la barre (`transition-colors duration-500`) utilise une transition, la largeur suit le décompte continu à la milliseconde.
  - Synchronisation audio du son `tick` sur les 3 dernières secondes.
  - Clé React dynamique (`key={currentQuestion.questionIndex}`) dans `QuizLiveHost.tsx` et `QuizLiveJoin.tsx` pour forcer la réinitialisation de la barre à chaque nouvelle question.

#### 4. Audit d'Infrastructure & Hardening Production
- **Heartbeat Keep-Alive WebSocket (`websocket.ts`)** :
  - Correction de la faille où seul `wss` (chat/notifications) était pingé par le heartbeat serveur (30s), tandis que `quizLiveWss` ne l'était pas.
  - Intégration de `quizLiveWss.clients` dans la boucle de ping/pong et suivi de l'état `ws.isAlive` pour éliminer toute coupure arbitraire par les reverse proxies (Render, Cloudflare, AWS ALB, Nginx).
- **Validation Instantanée des Réponses en RAM (< 2 ms)** :
  - Mise en cache mémoire de la session, de ses questions et de son statut dans `roomStates` (`quizLiveSocket.ts`).
  - Dans `submit_answer`, vérification immédiate en mémoire : élimination des requêtes `findUnique` bloquantes et renvoi de `answer_result` en moins de 2 ms au joueur.
  - Écriture asynchrone non-bloquante des scores dans PostgreSQL via Prisma en arrière-plan.
- **Restauration de Session en Plein Jeu (Reconnection Recovery)** :
  - Prise en charge de la reconnexion à chaud : si un joueur ou l'hôte rafraîchit sa page pendant `QUESTION_ACTIVE` ou `QUESTION_RESULTS`, le serveur lui renvoie immédiatement la question en cours avec le temps restant exact calculé à la volée.
- **Indexation SQL du Classement** :
  - Modèle `QuizLiveParticipant` doté de `@@index([sessionId, score])`, garantissant un calcul du classement (leaderboard) en moins de 1 ms.
- **Validation de Build** :
  - Backend : `npx tsc --noEmit --project tsconfig.build.json` (Code 0).
  - Frontend Sphera-App : `npm run build` (Code 0, bundle optimisé et pré-rendu SEO validé).

### 16. Espace Paramètres Sphera & Système de Préférences (Septembre 2026)

#### 1. Modèle de Données & Migration PostgreSQL (`schema.prisma`, `migration.sql`)
- **Modèle `SpheraPreferences`** :
  - `userId` (`@unique`, cascade sur suppression utilisateur).
  - Préférences de génération : `defaultLanguage` (`auto`, `fr`, `en`), `detailLevel` (`court`, `standard`, `detaille`), `tone` (`decontracte`, `formel`).
  - Paramètres par outil : `quizQuestionCount` (null = auto, ou 5 à 30), `quizTimeLimit` (10s à 30s), `flashcardCount` (null = auto, ou 5 à 30).
  - Apparence : `theme` (`system`, `sombre`, `clair`).
- **Migration SQL** : Script prêt `backend/prisma/migrations/20260921120000_add_sphera_preferences/migration.sql` pour déploiement en production via `npx prisma migrate deploy` ou exécution directe dans PostgreSQL / Supabase.

#### 2. Endpoints Backend (`sphera.routes.ts`)
- `GET /api/sphera/preferences` & `PATCH /api/sphera/preferences` : Récupération et mise à jour dynamique avec validation Zod et invalidation de cache en mémoire.
- `GET /api/sphera/profile` : Proxy en lecture seule vers les données profil CampusSphere de l'utilisateur (`firstName`, `lastName`, `avatar`, `university`, `faculty`, `studyYear`, `edit_url`), respectant le principe de source unique de vérité.
- `GET /api/sphera/stats` : Calcul en temps réel de l'activité étudiante :
  - `current_streak` : Nombre de jours consécutifs de révision en cours.
  - `longest_streak` : Record personnel de régularité.
  - `total_sessions` : Nombre total de sessions étudiées.
  - `favorite_tool` : Outil le plus généré.
  - `activity_grid` : Agrégation quotidienne sur les 90 derniers jours pour la grille de contribution.

#### 3. Injection Intelligente & Non-Intrusive dans l'IA (`userContext.ts`, `ai/index.ts`)
- **Par défaut** : Comportement 100% intact si l'utilisateur conserve les options automatiques (`auto`, `standard`, `decontracte`, nombre auto).
- **Si personnalisé** : Préfixage d'instructions précises via `buildStyleInstructions` (`[STUDENT PREFERENCES: ...]`) et injection du nombre exact d'items pour le Quiz et les Flashcards via `[USER QUANTITY OVERRIDE: ...]`.

#### 4. UI / UX Standalone (`sphera-app`)
- **Menu Utilisateur Épuré en Bas de Sidebar (`SidebarLayout.tsx`)** :
  - Affichage de la photo de profil réelle (`user.avatar`) avec repli propre sur les initiales.
  - Clic ouvrant un dialogue moderne avec accès direct à :
    1. Paramètres Sphera
    2. CampusSphere (lien externe)
    3. Aide & Support (`/contact`)
    4. Déconnexion (bouton rouge)
- **Modale Paramètres (`SpheraSettingsModal.tsx`)** :
  - 6 onglets clairs : Mon Profil, Préférences IA, Outils (Quiz & Flashcards), Usage & Quota, Activité & Streak, Apparence.
  - Mini-explications contextuelles sous chaque réglage informant l'étudiant de l'impact direct de son choix.
  - Sauvegarde réactive avec feedback visuel discret.
- **Grille d'Activité façon GitHub (`ActivityStreakGrid.tsx`)** :
  - Matrice de 14 semaines avec cases colorées selon l'intensité des sessions en vert Sphera `#22C55E`.
  - Badges métriques (streak en cours, record, sessions totales, outil favori).
- **Thème Clair / Sombre / Système (`theme.ts`, `index.css`, `tailwind.config.js`)** :
  - Variables CSS dynamiques (`--sphera-bg`, `--sphera-surface`, `--sphera-border`, etc.) avec vert de marque `#22C55E` préservé.
  - Palette douce pour le thème clair évitant l'éblouissement.
  - Détection automatique du mode système via `matchMedia('(prefers-color-scheme: dark)')`.





