# Dentisterie App - Application de Gestion Dentaire

Application desktop moderne pour la gestion complète d'un service dentaire.

## Stack Technique

### Backend
- **Fastify** - Framework web haute performance
- **tRPC** - Type-safe API
- **Prisma** - ORM moderne
- **PostgreSQL** - Base de données relationnelle
- **Vitest** - Tests unitaires
- **Supertest** - Tests E2E

### Frontend
- **Tauri** - Framework desktop (Rust)
- **Next.js 14** - Framework React avec App Router
- **TailwindCSS** - Styling
- **shadcn/ui** - Composants UI
- **Playwright** - Tests E2E
- **Vitest** - Tests unitaires

## Structure du Projet

```
dentisterie-app/
├── backend/                 # Backend Fastify + tRPC + Prisma
│   ├── src/
│   │   ├── server.ts       # Serveur Fastify
│   │   ├── trpc/           # Configuration tRPC
│   │   ├── routers/        # Routers tRPC
│   │   ├── services/       # Logique métier
│   │   └── utils/          # Utilitaires
│   ├── prisma/
│   │   ├── schema.prisma   # Schéma base de données
│   │   └── migrations/     # Migrations
│   ├── tests/              # Tests unitaires et E2E
│   └── package.json
│
└── frontend/               # Frontend Tauri + Next.js
    ├── src-tauri/         # Code Rust Tauri
    │   ├── src/
    │   └── tauri.conf.json
    ├── src/
    │   ├── app/           # Next.js App Router
    │   ├── components/    # Composants React
    │   ├── lib/           # Utilitaires et tRPC client
    │   └── types/         # Types TypeScript
    ├── tests/             # Tests E2E Playwright
    └── package.json
```

## Modules

1. **Authentification** - 4 utilisateurs prédéfinis avec permissions
2. **Dashboard** - Vue d'ensemble des activités
3. **Patients** - CRUD patients avec détection doublons
4. **Interventions** - CRUD interventions hiérarchiques
5. **Produits** - CRUD produits avec catégories
6. **Activités/Facturation** - Création factures avec sélection interventions/produits
7. **Rendez-vous** - Agenda avec planification
8. **Tarifs** - Gestion des tarifs par type patient
9. **Rapports** - Rapports journaliers, mensuels, annuels
10. **Statistiques** - Statistiques patients par âge/sexe
11. **Paramètres** - Configuration docteurs, assistants, permissions
12. **Historique** - Logs des actions utilisateurs

## Utilisateurs Prédéfinis

| Username | Rôle | Permissions | Mot de passe |
|----------|------|-------------|--------------|
| dev | Super Admin | Tout + Logs | master!! |
| MC-Harison | Administrateur | Tout | (à définir) |
| GT-Nary | Administrateur | Tout | (à définir) |
| DT-Operateur | Opérateur | Tout sauf suppression directe | (à définir) |

**Note** : DT-Operateur peut demander des suppressions qui nécessitent validation de MC-Harison ou GT-Nary.

## Déploiement

### Développement (macOS)
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run tauri dev
```

### Production

**Backend - Windows Server 2019** (32GB RAM, i7 12th gen, NVMe 500GB)
```bash
cd backend
npm run build
npm run start
```

**Frontend - Windows 10** (4GB RAM)
- Build de l'application Tauri en `.exe`
- Installation sur Windows 10
- Connexion au backend via réseau local

## Configuration

### Backend (.env)
```
DATABASE_URL="postgresql://user:password@localhost:5432/dentisterie"
PORT=4000
NODE_ENV=production
```

### Frontend
- Configuration Tauri pour Windows
- URL backend configurable
- Mode offline avec cache local

## Tests

### Backend
```bash
npm run test          # Tests unitaires
npm run test:e2e      # Tests E2E
npm run test:coverage # Coverage
```

### Frontend
```bash
npm run test          # Tests unitaires
npm run test:e2e      # Tests E2E Playwright
```

## Migration des Données

Les données sont actuellement dans MySQL (`hopital_base_dentisterie`).
Un script de migration vers PostgreSQL sera fourni.

## Licence

Propriétaire - HLA Hospital Management System
