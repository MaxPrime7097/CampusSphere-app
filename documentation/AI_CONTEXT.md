# 🧠 AI Context & Project Status — CampusSphere & Sphera Monorepo

> **Dernière mise à jour :** 25 Septembre 2026  
> **Statut global :** ✅ Monorepo Turborepo + pnpm workspaces pleinement opérationnel.  
> **Qualité & Tests :** 0 erreur ESLint | 53/53 Vitest passés sur 4 packages | 7/7 packages TypeScript validés | Builds de production réussis | GitHub Actions CI Pipeline configuré.

Ce fichier sert de **mémoire vive et de source de référence pour les agents IA** (Antigravity, Claude, Cursor, etc.). À lire impérativement au début de chaque session technique.

---

## 📌 1. Vue d'ensemble & Architecture Monorepo

Le projet est unifié sous une architecture **pnpm workspaces + Turborepo** avec séparation stricte des responsabilités :

```
campussphere-monorepo/
├── apps/
│   ├── campus/              # @cs/campus (Vite + React 18) — Port 5173
│   │                        # Réseau social académique, sphères, documents & génération 1-clic.
│   ├── sphera/              # @cs/sphera (Vite + React 18) — Port 5174
│   │                        # Application d'étude interactive dédiée (mindmaps, audio, live quiz).
│   └── backend/             # @cs/backend (Node 22 / Express 5 + Prisma 5) — Port 3000
│                            # API REST unique, WebSockets natifs, Redis multi-instances.
├── packages/
│   ├── ui/                  # @cs/ui — Design system partagé (Button, Badge, Dialog, Tabs, cn...)
│   ├── types/               # @cs/types — Contrats de données TypeScript uniques (Single Source of Truth)
│   ├── api-client/          # @cs/api-client — Client HTTP avec auto-refresh token mutexé
│   └── sso/                 # @cs/sso — Handshake cross-domain postMessage (iframe bridge & popup)
├── .github/workflows/ci.yml # Pipeline d'intégration continue GitHub Actions
├── documentation/           # Spécifications d'architecture et guides de déploiement
│   └── features/            # Docs fonctionnelles (Quiz live, Audio, Mindmap, Routing IA, etc.)
├── turbo.json               # Pipeline de compilation et vérification
├── pnpm-workspace.yaml      # Configuration des workspaces pnpm
└── package.json             # Scripts racine
```

---

## ⚖️ 2. Rôles Produit & Frontières Claires

| Dimension | CampusSphere (`apps/campus`) | Sphera (`apps/sphera`) |
|---|---|---|
| **Rôle principal** | Réseau social académique, hub de collaboration étudiante. | Espace de travail d'étude profonde et interactive assisté par IA. |
| **Fonctionnalités clés** | Posts, sphères de travail, messagerie, tâches Kanban, fiches de cours. | Mindmaps 2D interactives, lecteurs podcasts audio TTS, live quiz multijoueurs. |
| **Rôle dans l'apprentissage** | **Génération rapide 1-clic** via `StudyToolsModal` directement depuis un document/cours. | **Consommation interactive complète**, réorganisation de concepts, révision guidée. |
| **Poids du bundle** | **Allégé** : suppression totale de `reactflow` (~135 Ko économisés). Carte arborescente légère + CTA vers Sphera. | **Complet** : intègre le canvas React Flow, les visualisations graphiques et les sockets de jeu. |
| **URL de production** | `https://campussphere.app` | `https://sphera.campussphere.app` |

---

## 🛡️ 3. Résolution Complète de l'Audit Initial (Septembre 2026)

L'audit technique initial (`AUDIT_FRONTEND_CAMPUSSPHERE.md`) avait révélé plusieurs fragilités critiques, désormais **toutes résolues** :

### 1. Duplication & Architecture (Résolu via Monorepo)
- **Avant** : `frontend/` et `frontend/sphera-app/` dupliquaient leurs composants, modèles, et dépendances (`node_modules` imbriqués).
- **Après** : Extraction des modules partagés dans `packages/` (`@cs/ui`, `@cs/types`, `@cs/api-client`, `@cs/sso`). Zéro redondance de code.

### 2. Sécurité de l'Authentification & SSO (Résolu via `@cs/sso`)
- **Avant** : Les tokens JWT transitaient en clair dans les fragments d'URL (`#access_token=...`), exposés dans l'historique de navigation et les referrers.
- **Après** : Handshake sécurisé via `window.postMessage` avec validation stricte de la liste blanche d'origines (`campussphere.app`, `sphera.campussphere.app`, et localhost). Deux mécanismes :
  - `attemptSilentSso()` : Iframe invisible interrogeant le stockage de CampusSphere en arrière-plan.
  - `openSsoPopup()` : Popup Google-style pour les navigateurs à stockage partitionné (Safari ITP).

### 3. Allègement du Bundle CampusSphere (Résolu en Phase 6)
- **Avant** : `apps/campus` embarquait toute la suite `reactflow` uniquement pour une vue de session peu visitée.
- **Après** : Remplacement de `MindMapView` dans CampusSphere par une vue arborescente responsive en Tailwind pur + bouton CTA d'ouverture dans Sphera. Suppression de `reactflow` et de 209 dépendances transitives.

### 4. Qualité de Code, Tests et CI/CD (Résolu)
- **Avant** : 687 problèmes ESLint, `strict: false`, `vitest` cassé par manque de `jsdom`, aucun pipeline CI/CD automatisé.
- **Après** :
  - **ESLint** : 0 erreur sur l'ensemble du monorepo.
  - **Vitest** : **53/53 tests passés** sans régression (`@cs/campus`: 16, `@cs/backend`: 24, `@cs/sso`: 9, `@cs/ui`: 4).
  - **TypeScript** : 7 packages sur 7 compilent rigoureusement via `turbo typecheck`.
  - **CI/CD** : Pipeline GitHub Actions automatisé (`.github/workflows/ci.yml`) validant typecheck, lint, tests et builds sur chaque push/PR.

---

## 🔌 4. Guide des Packages Partagés (`packages/`)

1. **`@cs/types`** :
   - Interfaces canoniques : `StudySession`, `AnnaleSession`, `ToolType`, `GenerationQuota`, `SpheraProfileData`, `ApiResponse<T>`, etc.
   - Ne contient aucun code exécutable, uniquement des types et enums TS.
2. **`@cs/ui`** :
   - Composants : `Button`, `Badge`, `Dialog`, `Tabs`, `SharedTabs`, `Progress`, `Skeleton`, `Alert`, `Select`, `SpheraIcon`.
   - Utilitaire : `cn` (`clsx` + `tailwind-merge`).
   - Re-exporté dans `apps/campus/src/components/ui/` pour rétrocompatibilité totale.
3. **`@cs/api-client`** :
   - Client HTTP typé avec auto-injection du token d'accès.
   - Mutex de rafraîchissement (`performRefreshRaw`) : empêche les déconnexions lors de requêtes concurrentes avec token expiré.
   - Méthodes pré-câblées pour `/api/sphera/*`.
4. **`@cs/sso`** :
   - Constantes d'origines autorisées (`CAMPUS_ORIGINS`, `SPHERA_ORIGINS`).
   - Fonctions `sendSsoTokens`, `sendSsoNone`, `attemptSilentSso`, `openSsoPopup`.

---

## 🚀 5. Commandes de Développement

```bash
# Développement simultané
pnpm dev              # Lance apps/campus, apps/sphera et apps/backend

# Développement ciblé
pnpm dev:campus       # CampusSphere seul -> http://localhost:5173
pnpm dev:sphera       # Sphera seul       -> http://localhost:5174 
pnpm dev:backend      # Backend Express   -> http://localhost:3000

# Vérifications qualité (Turborepo)
pnpm typecheck        # Vérifie le typage sur les 7 packages
pnpm lint             # Linter ESLint sur tout le monorepo
pnpm test             # Tests unitaires Vitest
pnpm build            # Builds de production Vite de tous les packages
```

---

## 🎯 6. Ce qu'il reste à faire (Roadmap & Prochaines Étapes)

Bien que la migration architecturale en monorepo soit achevée et validée, voici les chantiers restants recommandés pour le projet :

### 1. Configuration Vercel en Production (Action Dashboard)
- [ ] **CampusSphere (`campussphere.app`)** : Modifier le `Root Directory` de `frontend` vers `apps/campus`.
- [ ] **Sphera (`sphera.campussphere.app`)** : Modifier le `Root Directory` de `frontend/sphera-app` vers `apps/sphera`.
- [ ] Vérifier que la variable `VITE_SPHERA_STANDALONE_URL=https://sphera.campussphere.app` est active sur le projet Vercel CampusSphere.

### 2. Validation du SSO en Environnement Réel (Staging / Prod)
- [ ] Tester le flux de connexion silencieux entre `campussphere.app` et `sphera.campussphere.app` sous différents navigateurs (Chrome, Firefox, Safari iOS/macOS).
- [ ] Valider que le fallback popup (`openSsoPopup`) fonctionne bien lorsque les cookies tiers sont strictement bloqués.

### 3. Refactoring des Fichiers Monstres de Pages (SRP dans `apps/campus`)
Comme pointé dans l'audit initial, certaines pages de `apps/campus` dépassent les 1 000 lignes et mériteraient un découpage en sous-composants dédiés :
- [ ] `apps/campus/src/pages/Profile.tsx` (~1 800 lignes) : extraire les onglets et les modales dans des composants distincts.
- [ ] `apps/campus/src/pages/Messages.tsx` (~1 500 lignes) : scinder la liste des conversations, la fenêtre de chat et l'uploader.
- [ ] `apps/campus/src/pages/SphereDetail.tsx` (~1 100 lignes) : isoler la barre d'onglets et les vues membres/fichiers.

### 4. Extension de la Couverture de Tests
- [ ] Ajouter des tests de composants pour `@cs/ui` (tester les états `Button`, `Dialog`, `Tabs`).
- [ ] Ajouter des tests d'intégration Playwright / Cypress pour le flux critique : Connexion CampusSphere ➔ Redirection vers Sphera ➔ Validation de session.
