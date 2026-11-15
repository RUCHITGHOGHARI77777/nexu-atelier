# NEXU ATELIER — Quick Setup & Running Guide (Zip / Clone)

Welcome to **NEXU ATELIER** — a multi-vendor Indian craft and luxury marketplace platform built with Next.js 14, React 18, Tailwind CSS, PostgreSQL, and Prisma ORM.

---

## ⚡ 1-Click Launch (Easiest Way)

### On Windows:
1. Extract the downloaded ZIP file to any folder.
2. Double-click **`start-windows.bat`**.
   - It will automatically check Node.js, create your `.env` configuration, install dependencies if missing, run tests, and launch the platform on `http://localhost:3000`.

### On macOS / Linux:
1. Extract the ZIP file.
2. Open Terminal in the project folder and run:
   ```bash
   chmod +x start-linux-mac.sh
   ./start-linux-mac.sh
   ```

---

## 🛠️ Manual Step-by-Step Setup

If you prefer running commands manually via terminal:

### Prerequisites:
- **Node.js**: v18.x or v20.x ([Download Node.js](https://nodejs.org/))
- **npm**: v9+ (comes bundled with Node.js)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env`:
```bash
# Windows PowerShell
copy .env.example .env

# Mac / Linux
cp .env.example .env
```
*(The defaults are pre-configured in demo isolation mode with database fallbacks, so everything works out of the box).*

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

### Step 4: Run Tests (Verification)
Verify all 493 test cases across 45 suites:
```bash
npm run test
```

For live production setup (Neon/Supabase, Razorpay, WhatsApp Cloud API, Shiprocket, Resend, Vercel), see [`PRODUCTION_SETUP_GUIDE.md`](./PRODUCTION_SETUP_GUIDE.md).

### Step 5: Start the Server

#### Option A: High-Speed Production Mode (Recommended for Demos & Showcases)
```bash
npm run build
npm run start
```
*Opens on `http://localhost:3000` with instant 30–70ms response times.*

#### Option B: Development Mode (For Code Editing)
```bash
npm run dev
```

---

## 🌐 Key URLs to Visit & Explore

| Portal / Page | URL | Description |
| :--- | :--- | :--- |
| **Customer Storefront** | `http://localhost:3000/` | Editorial homepage, curated handlooms, studio acoustics |
| **Artisanal Catalog** | `http://localhost:3000/catalog` | 17 verified categories, price filters, live inventory |
| **Instant Buy Now / Checkout** | `http://localhost:3000/checkout?direct=1` | Direct checkout with 1-click test address auto-fill |
| **Seller Studio Hub** | `http://localhost:3000/seller` | Multi-vendor dashboard, inventory management & CA billing |
| **Central Admin Platform** | `http://localhost:3000/admin` | Marketplace governance, commission settlement & simulator |
| **Consignment Tracking** | `http://localhost:3000/track-order` | 5-stage real-time courier tracking (Test: `ORD-2026-10008`) |

