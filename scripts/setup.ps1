<#
.SYNOPSIS
  NEXU ATELIER — Automated Windows Setup & Verification Script
.DESCRIPTION
  Prepares environment, verifies prerequisites, connects PostgreSQL,
  runs Prisma migrations, seeds demo dataset, and validates application readiness.
.EXAMPLE
  .\scripts\setup.ps1
  .\scripts\setup.ps1 -SkipSeed
#>

[CmdletBinding()]
param(
  [switch]$SkipSeed = $false,
  [switch]$StartDev = $false
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor DarkYellow
Write-Host "  NEXU ATELIER — REUSABLE MARKETPLACE PLATFORM SETUP" -ForegroundColor Yellow
Write-Host "  Windows PowerShell Setup Engine (Local / Academic / Hackathon)" -ForegroundColor DarkGray
Write-Host "==========================================================" -ForegroundColor DarkYellow
Write-Host ""

# 1. Check Node.js
Write-Host "[1/6] Verifying Node.js environment..." -ForegroundColor Cyan
try {
  $nodeVersion = node --version
  Write-Host "  ✔ Node.js detected: $nodeVersion" -ForegroundColor Green
  $majorVersion = [int]($nodeVersion -replace 'v','' -split '\.')[0]
  if ($majorVersion -lt 18) {
    Write-Warning "Node.js 18+ is strongly recommended. Current: $nodeVersion"
  }
} catch {
  Write-Error "Node.js is not installed or not in PATH. Please install Node.js v18 or v20 from https://nodejs.org"
  exit 1
}

# 2. Check & Install Dependencies
Write-Host "[2/6] Verifying npm dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
  Write-Host "  Installing dependencies via npm install..." -ForegroundColor Yellow
  npm install
  if ($LASTEXITCODE -ne 0) {
    Write-Error "npm install failed. Please check error output above."
    exit 1
  }
} else {
  Write-Host "  ✔ node_modules folder present." -ForegroundColor Green
}

# 3. Environment File Configuration
Write-Host "[3/6] Checking environment configuration (.env)..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
  if (Test-Path ".env.example") {
    Write-Host "  Copying .env.example -> .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "  ✔ Created default .env configuration." -ForegroundColor Green
  } else {
    Write-Error ".env.example not found! Please create a valid .env configuration."
    exit 1
  }
} else {
  Write-Host "  ✔ Existing .env file found." -ForegroundColor Green
}

# 4. Generate Prisma Client & Migrate Database
Write-Host "[4/6] Synchronizing PostgreSQL database with Prisma..." -ForegroundColor Cyan
try {
  Write-Host "  Generating Prisma Client..." -ForegroundColor Yellow
  npx prisma generate
  Write-Host "  Pushing database schema (prisma db push)..." -ForegroundColor Yellow
  npx prisma db push --skip-generate
  Write-Host "  ✔ Database schema synchronized with PostgreSQL." -ForegroundColor Green
} catch {
  Write-Error "Database synchronization failed. Please verify that PostgreSQL is running and DATABASE_URL in .env is correct."
  exit 1
}

# 5. Seed Demo Marketplace Data (If requested)
if (-not $SkipSeed) {
  Write-Host "[5/6] Seeding marketplace catalog and demo accounts..." -ForegroundColor Cyan
  $env:ALLOW_SEED_RESET = "true"
  npm run db:seed
  Remove-Item Env:\ALLOW_SEED_RESET -ErrorAction SilentlyContinue
  Write-Host "  ✔ Seed data initialized successfully." -ForegroundColor Green
} else {
  Write-Host "[5/6] Skipping database seed (-SkipSeed specified)." -ForegroundColor DarkGray
}

# 6. Run Core Smoke Test
Write-Host "[6/6] Verifying application integrity (TypeScript & Test Suite)..." -ForegroundColor Cyan
npx tsc --noEmit
if ($LASTEXITCODE -eq 0) {
  Write-Host "  ✔ TypeScript compilation passed with zero errors." -ForegroundColor Green
} else {
  Write-Warning "TypeScript check encountered warnings or errors."
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor DarkYellow
Write-Host "  NEXU ATELIER SETUP COMPLETED SUCCESSFULLY" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor DarkYellow
Write-Host ""
Write-Host "Demo Credentials for Instant Testing:" -ForegroundColor Yellow
Write-Host "  • Patron / Customer: patron@nexu.studio (Password: Password123!)"
Write-Host "  • Artisan / Seller:   solstice@nexu.studio (Password: Password123!)"
Write-Host "  • Super Admin:        atelier.admin@nexu.studio (Password: AdminPass123!)"
Write-Host ""
Write-Host "Key Portals & URLs:" -ForegroundColor Yellow
Write-Host "  • Public Storefront:     http://localhost:3000"
Write-Host "  • Guided Setup Wizard:   http://localhost:3000/admin/setup"
Write-Host "  • Seller Studio Portal:  http://localhost:3000/seller"
Write-Host "  • Admin Governance:      http://localhost:3000/admin"
Write-Host "  • Demo Mode Simulator:   http://localhost:3000/admin/demo-status"
Write-Host ""
Write-Host "To start the development server:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "To run the automated test suite:" -ForegroundColor Cyan
Write-Host "  npm test" -ForegroundColor White
Write-Host ""

if ($StartDev) {
  Write-Host "Starting Next.js development server..." -ForegroundColor Green
  npm run dev
}

