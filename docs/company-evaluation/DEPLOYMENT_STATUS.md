# 14. STAGING DEPLOYMENT & HOSTING INFRASTRUCTURE STATUS

## Deployed Staging Environment Details
- **Live Evaluator Staging URL:** `https://trailing-ungreased-unhappily.ngrok-free.dev`
- **Local Application Port:** `http://localhost:3000`
- **Database Engine:** PostgreSQL 17 (`localhost:5432/nexu_ecommerce`)
- **Ingress Controller:** Ngrok TLS Reverse Proxy with active background daemon
- **Staging Verification:** Verified via `scripts/verify-hosted-staging.mjs` across 11 end-to-end assertions (100% passed).
