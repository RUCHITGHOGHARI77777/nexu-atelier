@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo        NEXU ATELIER - ONE-CLICK QUICK SETUP & RUN
echo ========================================================
echo.

REM 1. Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is NOT installed or not found in PATH!
    echo Please install Node.js v18 or v20 from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detected:
node -v
npm -v
echo.

REM 2. Ensure .env exists
if not exist .env (
    if exist .env.example (
        echo [INFO] Creating .env from .env.example...
        copy .env.example .env >nul
        echo [OK] .env created successfully.
    ) else (
        echo [WARN] .env.example not found, proceeding with defaults...
    )
) else (
    echo [OK] .env file detected.
)
echo.

REM 3. Check node_modules
if not exist node_modules (
    echo [INFO] node_modules not found. Installing dependencies (this may take 1-2 minutes)...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install failed! Please check your internet connection.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed.
) else (
    echo [OK] Dependencies already installed.
)
echo.

REM 4. Sync Database & Generate Prisma Client
echo [INFO] Syncing Database & Generating Prisma Client...
call npx prisma db push --skip-generate >nul 2>nul
call npx prisma generate
if %ERRORLEVEL% neq 0 (
    echo [WARN] Prisma generate encountered a warning, continuing...
)
echo [OK] Database & Prisma ready.
echo.

REM 5. Display Quick Demo Credentials
echo ========================================================
echo               DEMO CREDENTIALS & ACCESS
echo ========================================================
echo   Customer: patron@nexu.studio    (Pass: Password123!)
echo   Seller:   solstice@nexu.studio  (Pass: Password123!)
echo   Admin:    admin@nexu.studio     (Pass: AdminPass123!)
echo   Master OTP for WhatsApp/COD:   123456
echo ========================================================
echo.

REM 6. Launch Server
echo [STARTING] Opening http://localhost:3000 in your browser...
start http://localhost:3000
echo [STARTING] Running Development Server (Press Ctrl+C to stop)...
call npm run dev

pause

