#!/bin/bash

echo "🚀 Installation Dentisterie App"
echo "================================"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    echo "Installer avec: brew install node"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# Vérifier PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL n'est pas installé${NC}"
    echo "Installer avec: brew install postgresql@15"
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL installé${NC}"

# Vérifier Rust (pour Tauri)
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}❌ Rust n'est pas installé${NC}"
    echo "Installer avec: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

echo -e "${GREEN}✓ Rust $(rustc --version)${NC}"

# Installation Backend
echo ""
echo -e "${BLUE}📦 Installation Backend...${NC}"
cd backend

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Fichier .env créé${NC}"
fi

npm install
echo -e "${GREEN}✓ Dépendances backend installées${NC}"

# Générer Prisma Client
npx prisma generate
echo -e "${GREEN}✓ Prisma Client généré${NC}"

# Créer la base de données PostgreSQL
echo ""
echo -e "${BLUE}🗄️  Configuration PostgreSQL...${NC}"
createdb dentisterie 2>/dev/null || echo "Base de données 'dentisterie' existe déjà"

# Exécuter les migrations
npx prisma migrate dev --name init
echo -e "${GREEN}✓ Migrations exécutées${NC}"

cd ..

# Installation Frontend
echo ""
echo -e "${BLUE}📦 Installation Frontend...${NC}"
cd frontend

npm install
echo -e "${GREEN}✓ Dépendances frontend installées${NC}"

cd ..

echo ""
echo -e "${GREEN}✅ Installation terminée!${NC}"
echo ""
echo "Prochaines étapes:"
echo "1. Backend: cd backend && npm run dev"
echo "2. Frontend: cd frontend && npm run tauri dev"
echo ""
echo "Documentation: voir README.md et INSTALLATION.md"
