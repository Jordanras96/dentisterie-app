# Guide d'Installation - Dentisterie App

## Prérequis

### macOS (Développement)
- Node.js 18+ : `brew install node`
- PostgreSQL 15+ : `brew install postgresql@15`
- Rust : `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Tauri CLI : `cargo install tauri-cli`

### Windows Server 2019 (Production Backend)
- Node.js 18+ LTS
- PostgreSQL 15+
- Git

### Windows 10 (Production Frontend)
- Aucune installation requise (application .exe standalone)

## Installation Rapide

### 1. Backend

```bash
cd /Users/mac/Documents/WORK/HLA/dentisterie-app/backend

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres PostgreSQL

# Générer le client Prisma
npm run prisma:generate

# Créer la base de données et exécuter les migrations
npm run prisma:migrate

# Seed initial (utilisateurs prédéfinis)
npm run seed

# Démarrer le serveur de développement
npm run dev
```

Le backend sera disponible sur `http://localhost:4000`

### 2. Frontend

```bash
cd /Users/mac/Documents/WORK/HLA/dentisterie-app/frontend

# Installer les dépendances
npm install

# Démarrer en mode développement Tauri
npm run tauri dev
```

L'application desktop s'ouvrira automatiquement.

## Migration des Données MySQL → PostgreSQL

```bash
cd /Users/mac/Documents/WORK/HLA/dentisterie-app/backend

# Exécuter le script de migration
npm run migrate:from-mysql
```

Ce script :
1. Se connecte à MySQL (`hopital_base_dentisterie`)
2. Exporte toutes les données
3. Les importe dans PostgreSQL avec le schéma Prisma

## Build Production

### Backend (Windows Server 2019)

```bash
cd backend
npm run build
npm run start
```

Configuration recommandée :
- Port : 4000
- PM2 pour le process management : `pm2 start dist/server.js --name dentisterie-backend`
- Nginx en reverse proxy (optionnel)

### Frontend (Windows 10)

```bash
cd frontend
npm run tauri build
```

Cela génère :
- `src-tauri/target/release/dentisterie-app.exe` - Application standalone
- `src-tauri/target/release/bundle/msi/dentisterie-app_1.0.0_x64_en-US.msi` - Installateur MSI

**Configuration pour Windows 10 (4GB RAM)** :
- L'application est optimisée pour faible consommation mémoire
- Cache local pour mode offline
- Connexion au backend via IP réseau local

## Tests

### Backend
```bash
cd backend
npm run test              # Tests unitaires
npm run test:e2e          # Tests end-to-end
npm run test:coverage     # Coverage report
```

### Frontend
```bash
cd frontend
npm run test              # Tests unitaires
npm run test:e2e          # Tests Playwright
```

## Dépannage

### PostgreSQL ne démarre pas
```bash
# macOS
brew services start postgresql@15

# Vérifier le statut
brew services list
```

### Port 4000 déjà utilisé
Modifier `PORT` dans `.env` du backend

### Erreur Prisma
```bash
# Régénérer le client
npm run prisma:generate

# Reset la base de données (ATTENTION: supprime toutes les données)
npx prisma migrate reset
```

### Tauri build échoue
```bash
# Installer les dépendances système
# macOS
xcode-select --install

# Vérifier Rust
rustc --version
cargo --version
```

## Configuration Réseau (Production)

### Backend (Windows Server 2019)
- IP statique : 192.168.1.100 (exemple)
- Port : 4000
- Firewall : Autoriser port 4000

### Frontend (Windows 10)
- Configurer l'URL backend dans les paramètres de l'app
- Format : `http://192.168.1.100:4000`

## Sécurité

### Production
1. Changer `JWT_SECRET` dans `.env`
2. Utiliser HTTPS (certificat SSL)
3. Configurer le firewall
4. Backups PostgreSQL automatiques
5. Logs d'audit activés

## Support

Pour toute question, consulter :
- `README.md` - Vue d'ensemble
- `DOCUMENTATION_FRONTEND.md` - API et structure
- `TRANSITION_BACKEND_ACTUEL.md` - Migration depuis backend actuel
