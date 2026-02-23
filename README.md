# Dentisterie App -

Application desktop complète pour la gestion d'un service de dentisterie hospitalier.

## Stack Technique

### Backend
- **Fastify 5** - Framework web haute performance
- **tRPC 10** - API typesafe de bout en bout
- **Prisma 5** - ORM avec migrations
- **PostgreSQL / MySQL** - Base de données relationnelle
- **Vitest** - Tests unitaires et intégration
- **Supertest** - Tests HTTP d'intégration
- **PM2** - Process manager, monitoring, logs

### Frontend
- **Tauri 2** - Framework desktop natif (Rust)
- **Next.js 16** - Framework React avec App Router
- **React 19** - Bibliothèque UI
- **TypeScript** - Typage statique
- **TailwindCSS 4** - Styling utility-first
- **shadcn/ui** - Composants UI modernes (Radix UI)
- **Zustand** - Gestion d'état
- **Vitest** - Tests unitaires
- **React Testing Library** - Tests de composants
- **Playwright** - Tests E2E navigateur
- **Driver.js** - Guides interactifs utilisateur

---

## Démarrage Rapide

### Prérequis
- **Node.js** >= 18
- **npm** >= 9
- **PostgreSQL** (ou MySQL)
- **Rust** (pour le build Tauri desktop)

### 1. Cloner et installer
```bash
git clone <repo-url>
cd dentisterie-app

# Backend
cd backend
npm install
cp .env.example .env   # Configurer DATABASE_URL, JWT_SECRET, etc.
npx prisma generate
npx prisma migrate dev
npm run seed            # Données initiales (utilisateurs, etc.)

# Frontend
cd ../frontend
npm install
```

### 2. Lancer en développement
```bash
# Terminal 1 - Backend (port 4000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 3000)
cd frontend
npm run dev

# Ou via Tauri desktop
cd frontend
npm run tauri:dev
```

### 3. Lancer avec PM2 (production)
```bash
cd backend
npm run build
npm run pm2:start       # Démarre le serveur en production
npm run pm2:monit       # Monitoring temps réel
npm run pm2:logs        # Voir les logs
npm run pm2:status      # État du processus
```

---

## Configuration

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dentisterie"
PORT=4000
NODE_ENV=production
JWT_SECRET="votre-secret-jwt-securise"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:3000"
LOG_LEVEL="info"
```

### Frontend
Le frontend se connecte au backend via tRPC sur `http://localhost:4000/trpc`.
Modifier `src/lib/trpc.ts` pour changer l'URL en production.

---

## Structure du Projet

```
dentisterie-app/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Point d'entrée Fastify
│   │   ├── lib/
│   │   │   ├── auth.ts            # JWT, bcrypt
│   │   │   ├── prisma.ts          # Client Prisma
│   │   │   ├── rate-limit.ts      # Rate limiting
│   │   │   └── sanitize.ts        # Sanitisation entrées
│   │   └── trpc/
│   │       ├── trpc.ts            # Config tRPC + middlewares
│   │       ├── context.ts         # Contexte requête
│   │       ├── router.ts          # Router principal
│   │       └── routers/           # Routers par domaine
│   │           ├── auth.ts
│   │           ├── patient.ts
│   │           ├── intervention.ts
│   │           ├── produit.ts
│   │           ├── facture.ts
│   │           ├── rendezVous.ts
│   │           ├── tarif.ts
│   │           ├── statistique.ts
│   │           ├── rapport.ts
│   │           ├── personnel.ts
│   │           ├── parametre.ts
│   │           └── user.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── tests/
│   │   ├── auth.test.ts
│   │   ├── integration/http.test.ts
│   │   ├── security/
│   │   │   ├── rate-limit.test.ts
│   │   │   └── sanitize.test.ts
│   │   └── routers/               # Tests tRPC typesafe
│   │       ├── patient.test.ts
│   │       ├── intervention.test.ts
│   │       ├── produit.test.ts
│   │       ├── facture.test.ts
│   │       ├── statistique.test.ts
│   │       ├── user.test.ts
│   │       └── rendezVous.test.ts
│   ├── ecosystem.config.cjs       # PM2 config
│   └── logs/                      # PM2 logs
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── login/page.tsx
    │   │   └── (dashboard)/
    │   │       ├── layout.tsx      # Layout + TourButton + ErrorReport
    │   │       ├── patients/
    │   │       ├── interventions/
    │   │       ├── produits/
    │   │       ├── factures/
    │   │       ├── rendez-vous/
    │   │       ├── statistiques/
    │   │       ├── utilisateurs/
    │   │       └── tarifs/
    │   ├── components/
    │   │   ├── app-sidebar.tsx     # Navigation latérale
    │   │   ├── auth-guard.tsx      # Protection routes
    │   │   ├── error-report.tsx    # Bouton signalement erreur
    │   │   ├── tour-button.tsx     # Bouton guide interactif
    │   │   ├── providers.tsx       # Providers React
    │   │   └── ui/                 # shadcn/ui components
    │   ├── hooks/
    │   │   ├── use-debounce.ts     # Anti double-clic
    │   │   └── use-safe-action.ts  # Soumission sécurisée
    │   └── lib/
    │       ├── auth.ts             # Store Zustand auth
    │       ├── trpc.ts             # Client tRPC
    │       ├── utils.ts            # cn() utility
    │       ├── invoice-utils.ts    # Calculs facture/stock
    │       ├── validators.ts       # Validations formulaires
    │       └── guided-tours.ts     # Config Driver.js
    ├── tests/
    │   ├── setup.ts
    │   ├── unit/                   # Vitest unit tests
    │   │   ├── utils.test.ts
    │   │   ├── auth.test.ts
    │   │   ├── invoice-utils.test.ts
    │   │   └── validators.test.ts
    │   ├── components/             # React Testing Library
    │   │   ├── button.test.tsx
    │   │   ├── login-form.test.tsx
    │   │   └── sidebar.test.tsx
    │   └── e2e/                    # Playwright
    │       ├── auth.spec.ts
    │       ├── navigation.spec.ts
    │       └── patient-workflow.spec.ts
    ├── src-tauri/                  # Tauri config Rust
    ├── vitest.config.ts
    └── playwright.config.ts
```

---

## Modules Fonctionnels

### 1. Authentification
- Login JWT avec token persisté en localStorage
- 3 rôles : **SUPER_ADMIN**, **ADMIN**, **OPERATOR**
- Permissions granulaires par utilisateur
- Auth guard sur toutes les pages dashboard
- Rate limiting sur les tentatives de connexion (10/min)

### 2. Patients
- Liste paginée avec recherche par nom/numéro/téléphone
- Filtre par sexe (M/F)
- Création avec numéro unique auto-généré
- Fiche détaillée : infos personnelles, contact, observations
- Modification et suppression (demande de validation pour opérateurs)
- Historique des factures par patient

### 3. Interventions
- Arbre hiérarchique à 3 niveaux (Parent → Sous-parent → Enfant)
- Codes auto-générés selon la hiérarchie
- 5 grilles tarifaires par intervention (Public, Personnel, Retraité, Enf CD, Prise charge)
- CRUD complet avec validation

### 4. Produits
- Catalogue avec recherche par code/libellé
- Gestion des prix (vente, achat, personnel, retraité, enfant CD)
- Saisie d'entrée de stock avec référence auto
- Suivi des mouvements de stock (entrée/sortie)
- Cumul approvisionnement affiché

### 5. Facturation
- Création de facture : sélection patient + interventions + produits
- 4 types de tarif : Public, Personnel, Retraité, TIKO
- Recalcul dynamique des prix au changement de tarif
- Recherche autocomplete pour patients et produits
- Numéro d'ordre auto-incrémenté
- Affectation médecin/assistant par intervention

### 6. Rendez-vous
- Planning journalier avec vue agenda
- Création rapide avec patient, date, heures, motif
- Statuts : PLANIFIE, CONFIRME, EN_COURS, TERMINE, ANNULE, REPORTE
- Filtrage par date

### 7. Tarifs
- Grilles tarifaires par type de patient
- Prix pour interventions et produits
- Tarifs personnalisés

### 8. Statistiques
- Répartition par sexe (M/F/Inconnu) avec barres visuelles
- Répartition par tranche d'âge (Bébé, Enfant, Ado, Adulte, Senior)
- Filtrage par année
- Déduplication des patients (compte unique par patient)

### 9. Utilisateurs (Admin)
- Liste des comptes avec rôles et permissions
- Changement de mot de passe
- Gestion des demandes de suppression
- Approbation/rejet des suppressions
- Logs système (Super Admin uniquement)

---

## Sécurité

### Frontend
- **Anti double-clic** : hooks `useDebouncedCallback` et `useSafeAction` sur tous les boutons de soumission
- **Sanitisation** : `sanitizeInput()` et `isSafeInput()` pour prévenir XSS
- **Validation** : Validateurs complets pour chaque formulaire (patient, produit, intervention, RDV, login, mot de passe)
- **Auth Guard** : Redirection automatique vers /login si non authentifié
- **Token JWT** : Stocké en localStorage, envoyé dans les headers

### Backend
- **Rate Limiting** : 100 req/min global, 10 req/min pour l'authentification
- **Sanitisation SQL** : Détection de patterns d'injection SQL
- **JWT** : Vérification et décodage sécurisé avec expiration configurable
- **Bcrypt** : Hashage des mots de passe (salt rounds: 10)
- **Middlewares tRPC** : `protectedProcedure`, `adminProcedure`, `superAdminProcedure`
- **CORS** : Origine configurée, credentials activés
- **Validation Zod** : Tous les inputs validés côté serveur
- **Logs d'audit** : Toutes les actions CRUD logguées avec userId, action, module, détails

---

## Tests

### Frontend (115 tests)

```bash
cd frontend
npm run test              # Vitest (unit + component)
npm run test:watch        # Mode watch
npm run test:coverage     # Avec couverture
npm run test:e2e          # Playwright E2E
```

- **81 tests unitaires** : utils, auth store, invoice-utils, validators
- **34 tests composants** : Button, LoginPage, AppSidebar (React Testing Library)
- **E2E Playwright** : auth, navigation, patient workflow, factures, rdv, stats

### Backend (95 tests)

```bash
cd backend
npm run test              # Vitest
npm run test:watch        # Mode watch
npm run test:coverage     # Avec couverture
```

- **7 tests auth** : hashPassword, comparePassword, JWT generation/verification
- **64 tests tRPC** : patient, intervention, produit, facture, statistique, user, rendezVous, auth routers
- **8 tests intégration** : HTTP endpoints, CORS, 404, authentication via Supertest
- **16 tests sécurité** : rate limiting, sanitisation, injection detection

---

## PM2 - Monitoring Production

```bash
cd backend

# Démarrer en production
npm run pm2:start

# Démarrer en développement
npm run pm2:dev

# Commandes de gestion
npm run pm2:stop          # Arrêter
npm run pm2:restart       # Redémarrer
npm run pm2:logs          # Voir les logs en temps réel
npm run pm2:monit         # Dashboard monitoring
npm run pm2:status        # État des processus
```

Configuration dans `ecosystem.config.cjs` :
- Auto-restart en cas de crash
- Limite mémoire 512MB
- Logs JSON avec timestamps dans `logs/`
- Graceful shutdown (5s timeout)

---

## Fonctionnalités Additionnelles

### Guide Interactif (Driver.js)
Un bouton bleu d'aide (?) apparaît en bas à droite de chaque page. Il lance un guide pas à pas expliquant chaque section de la page et les actions possibles. Tours disponibles :
- Patients, Factures, Nouvelle Facture, Produits, Interventions, Rendez-vous, Statistiques, Utilisateurs

### Signalement d'Erreurs
Un bouton rouge (bug) en bas à droite permet de signaler une erreur. Le rapport est envoyé par email à `riantsoa96@gmail.com` avec :
- Titre de l'erreur
- Description détaillée
- Page concernée (auto-détectée)
- Date et heure
- Informations navigateur

---

## Build Desktop (Tauri)

### Développement
```bash
cd frontend
npm run tauri:dev
```

### Build Windows (.exe)
```bash
cd frontend
npm run tauri:build
```
L'installateur `.exe` sera dans `frontend/src-tauri/target/release/bundle/`.

---

## Utilisateurs Prédéfinis

| Username | Rôle | Permissions | Mot de passe |
|----------|------|-------------|--------------|
| dev | Super Admin | Tout + Logs | master!! |
| MC-Harison | Admin | Tout | (à définir) |
| GT-Nary | Admin | Tout | (à définir) |
| DT-Operateur | Opérateur | Tout sauf suppression directe | (à définir) |

**Note** : L'opérateur peut demander des suppressions qui nécessitent validation d'un administrateur.

---

## Licence

Propriétaire - HLA Hospital Management System - Hôpital Y Loterana
