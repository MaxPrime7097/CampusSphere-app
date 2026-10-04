# 🌌 Sphera App Standalone (V2)

Sphera V2 est l'assistante IA académique de **CampusSphere**, conçue comme une application standalone moderne, ultra-rapide et performante. Elle permet aux étudiants de générer des fiches de révision, des quiz, des flashcards et de corriger des annales d'examen de manière totalement automatique à l'aide de l'Intelligence Artificielle.

---

## 🚀 Fonctionnalités Clés

* **Génération Asynchrone de Cours** : Transformez vos cours (PDF, Docx, Textes) en fiches condensées, quiz interactifs, et flashcards.
* **Correction Complète d'Annales** : Uploadez des examens passés et obtenez des corrections structurées par question, accompagnées d'explications pédagogiques détaillées.
* **Moteur d'Export PDF Premium** : Téléchargement instantané de vos fiches et de vos annales corrigées dans un format A4 élégant et vectoriel, respectant la charte graphique orange et supportant le formater Markdown.
* **Single Sign-On (SSO)** : Connexion automatique et fluide depuis l'application principale CampusSphere sans aucune étape d'authentification manuelle.

---

## 🛠️ Stack Technique

* **Framework principal** : [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build tool** : [Vite](https://vite.dev/) (avec HMR ultra-rapide)
* **Styling (CSS)** : [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/) (pour des composants premium)
* **Icônes** : [Lucide React](https://lucide.dev/)
* **Génération PDF** : [jsPDF](https://github.com/parallax/jsPDF) (rendu 100% natif et vectoriel)

---

## 🔑 Architecture de Connexion SSO

Pour connecter automatiquement l'utilisateur depuis l'application principale CampusSphere, Sphera intercepte les tokens d'authentification JWT lors du premier accès :

1. L'application principale CampusSphere redirige l'utilisateur vers :  
   `https://sphera.campussphere.app/app?access_token=ACCESS_JWT&refresh_token=REFRESH_JWT`
2. Le composant `SSOCatcher` situé dans `App.tsx` capture ces paramètres :
   ```typescript
   function SSOCatcher() {
     useEffect(() => {
       const params = new URLSearchParams(window.location.search)
       const token = params.get('access_token')
       const refresh = params.get('refresh_token')
       if (token) {
         localStorage.setItem('sphera_access', token)
         if (refresh) localStorage.setItem('sphera_refresh', refresh)
         window.history.replaceState({}, document.title, window.location.pathname)
         window.location.href = '/dashboard'
       }
     }, [])
     return null
   }
   ```
3. Les tokens sont stockés dans le `localStorage` de l'application standalone et l'utilisateur arrive instantanément connecté sur son tableau de bord sans mot de passe à saisir.

---

## 📁 Structure du Projet

```
frontend/sphera-app/
├── public/                 # Assets statiques (Logos, Favicon...)
├── src/
│   ├── components/         # Composants réutilisables (Layouts, UI...)
│   │   ├── app/            # Vues de résultats (ResultViews.tsx)
│   │   ├── layout/         # Sidebar, Navbar...
│   │   └── shared/         # Boutons personnalisés (DownloadPDFButton.tsx)
│   ├── contexts/           # Contexte d'authentification partagé
│   ├── hooks/              # Hooks personnalisés (useDownloadPDF.ts)
│   ├── pages/              # Pages principales (Dashboard, Pricing, Landing...)
│   ├── services/           # Gestion des appels d'API (spheraApi.ts)
│   ├── App.tsx             # Routeur principal & Capture SSO
│   └── main.tsx            # Point d'entrée de l'application
├── tailwind.config.js      # Configuration des styles Tailwind
└── vite.config.ts          # Configuration du bundler Vite
```

---

## ⚙️ Configuration locale

### 1. Variables d'Environnement
Créez un fichier `.env.local` dans la racine de `frontend/sphera-app` :

```env
# URL de l'API Django partagée de CampusSphere
VITE_API_URL=http://localhost:8000
```

### 2. Démarrage en Mode Développement
Installez les dépendances et lancez le serveur de développement local :

```bash
# Se placer dans le dossier de l'application Sphera
cd frontend/sphera-app

# Installer les dépendances
npm install

# Démarrer le serveur Vite
npm run dev
```
L'application démarre par défaut sur `http://localhost:5173`.

---

## 🚀 Déploiement en Production

### 1. Variables d'Environnement de Production
Assurez-vous de définir les variables d'environnement de production sur votre hébergeur (ex: Vercel, Netlify ou Render) :

```env
VITE_API_URL=https://api.campussphere.app
```

### 2. Compilation de l'Application
Générez le bundle de production optimisé :

```bash
npm run build
```
Les fichiers statiques prêts pour le déploiement seront générés dans le dossier `/dist`.

### 3. Redirections Single-Page App (SPA)
Si vous déployez sur **Vercel** ou **Netlify**, un fichier de configuration des redirections est requis pour que le routage React (`react-router-dom`) fonctionne correctement après actualisation des pages.

* **Pour Vercel** (`vercel.json`) :
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

---
*Sphera V2 — Conçu pour et par CampusSphere.*
