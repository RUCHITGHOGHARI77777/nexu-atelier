#!/usr/bin/env bash
# ==============================================================================
# NEXU ATELIER — Automated macOS & Linux Setup Script
# Reusable Multi-Vendor Marketplace Platform (Local, Academic & Hackathon Mode)
# ==============================================================================

set -e

echo -e "\033[1;33m==========================================================\033[0m"
echo -e "\033[1;33m  NEXU ATELIER — REUSABLE MARKETPLACE PLATFORM SETUP\033[0m"
echo -e "\033[0;37m  macOS / Linux Shell Setup Engine\033[0m"
echo -e "\033[1;33m==========================================================\033[0m\n"

# 1. Check Node.js
echo -e "\033[1;36m[1/6] Verifying Node.js environment...\033[0m"
if ! command -v node &> /dev/null; then
  echo -e "\033[0;31mError: Node.js is not installed. Please install Node.js v18 or v20 from https://nodejs.org\033[0m"
  exit 1
fi
NODE_VERSION=$(node -v)
echo -e "\033[0;32m  ✔ Node.js detected: ${NODE_VERSION}\033[0m"

# 2. Check & Install Dependencies
echo -e "\033[1;36m[2/6] Verifying npm dependencies...\033[0m"
if [ ! -d "node_modules" ]; then
  echo -e "\033[0;33m  Installing dependencies via npm install...\033[0m"
  npm install
  echo -e "\033[0;32m  ✔ Dependencies installed.\033[0m"
else
  echo -e "\033[0;32m  ✔ node_modules directory present.\033[0m"
fi

# 3. Environment Configuration
echo -e "\033[1;36m[3/6] Checking environment configuration (.env)...\033[0m"
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo -e "\033[0;33m  Copying .env.example -> .env...\033[0m"
    cp .env.example .env
    echo -e "\033[0;32m  ✔ Created default .env configuration.\033[0m"
  else
    echo -e "\033[0;31mError: .env.example not found!\033[0m"
    exit 1
  fi
else
  echo -e "\033[0;32m  ✔ Existing .env file found.\033[0m"
fi

# 4. Generate Prisma Client & Migrate Database
echo -e "\033[1;36m[4/6] Synchronizing PostgreSQL database with Prisma...\033[0m"
npx prisma generate
npx prisma db push --skip-generate
echo -e "\033[0;32m  ✔ Database schema synchronized with PostgreSQL.\033[0m"

# 5. Seed Demo Marketplace Data
echo -e "\033[1;36m[5/6] Seeding marketplace catalog and demo accounts...\033[0m"
ALLOW_SEED_RESET=true npm run db:seed
echo -e "\033[0;32m  ✔ Seed data initialized successfully.\033[0m"

# 6. TypeScript check
echo -e "\033[1;36m[6/6] Verifying application integrity (TypeScript)...\033[0m"
npx tsc --noEmit
echo -e "\033[0;32m  ✔ TypeScript compilation passed with zero errors.\033[0m\n"

echo -e "\033[1;32m==========================================================\033[0m"
echo -e "\033[1;32m  NEXU ATELIER SETUP COMPLETED SUCCESSFULLY\033[0m"
echo -e "\033[1;32m==========================================================\033[0m\n"

echo -e "\033[1;33mDemo Credentials for Instant Testing:\033[0m"
echo "  • Patron / Customer: patron@nexu.studio (Password: Password123!)"
echo "  • Artisan / Seller:   solstice@nexu.studio (Password: Password123!)"
echo "  • Super Admin:        atelier.admin@nexu.studio (Password: AdminPass123!)"
echo ""
echo -e "\033[1;33mKey Portals & URLs:\033[0m"
echo "  • Public Storefront:     http://localhost:3000"
echo "  • Guided Setup Wizard:   http://localhost:3000/admin/setup"
echo "  • Seller Studio Portal:  http://localhost:3000/seller"
echo "  • Admin Governance:      http://localhost:3000/admin"
echo "  • Demo Mode Simulator:   http://localhost:3000/admin/demo-status"
echo ""
echo -e "\033[1;36mTo start the development server:\033[0m"
echo "  npm run dev"
echo ""
echo -e "\033[1;36mTo run the test suite:\033[0m"
echo "  npm test"
echo ""

