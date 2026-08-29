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

