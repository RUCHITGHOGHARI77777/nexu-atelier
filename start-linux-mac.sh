#!/usr/bin/env bash
set -e

echo "========================================================"
echo "       NEXU ATELIER - ONE-CLICK QUICK SETUP & RUN"
echo "========================================================"
echo ""

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is NOT installed or not in PATH."
    echo "Please install Node.js v18 or v20 from https://nodejs.org/"
    exit 1
fi

echo "[OK] Node.js detected: $(node -v)"
echo "[OK] npm detected: $(npm -v)"
echo ""

# 2. Setup .env
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "[INFO] Creating .env from .env.example..."
        cp .env.example .env
        echo "[OK] .env created."
    fi
fi

# 3. Dependencies
if [ ! -d node_modules ]; then
    echo "[INFO] Installing dependencies..."
    npm install
fi

# 4. Prisma
echo "[INFO] Generating Prisma Client..."
npx prisma generate || true

# 5. Run Tests
echo "[INFO] Running test suite..."
npx vitest run --no-file-parallelism || true

# 6. Start
echo ""
echo "--------------------------------------------------------"
echo "Select Launch Mode:"
echo "1) Production Mode (Super Fast - Recommended)"
echo "2) Development Mode (Dev / Hot Reload)"
echo "--------------------------------------------------------"
read -p "Enter choice [1 or 2, default: 1]: " mode
mode=${mode:-1}

if [ "$mode" = "2" ]; then
    echo "[STARTING] Development Server on http://localhost:3000 ..."
    npm run dev
else
    echo "[BUILDING] Production build..."
    npm run build
    echo "[STARTING] Production Server on http://localhost:3000 ..."
    npm run start
fi

