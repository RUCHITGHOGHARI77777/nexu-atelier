# 20. RELEASE RUNBOOK & CONTINGENCY PLAYBOOK

## Demonstration Operating Instructions

### 1. Normal Service Startup
1. Ensure PostgreSQL is active on port 5432.
2. Start application server: `npm run dev` (running on `http://localhost:3000`).
3. Start TLS tunnel: `ngrok http 3000 --log=stdout`.
4. Run automated staging health check: `node scripts/verify-hosted-staging.mjs`.

### 2. Contingency Recovery Procedures
- **If Ngrok Tunnel Drops:** Re-launch `ngrok http 3000` and copy new forwarding URL.
- **If Database Corrupts:** Restore the verified snapshot:
  ```powershell
  psql -U postgres -d nexu_ecommerce -f backups/nexu_db_backup_2026-11-04T22-08-42-820Z.sql
  ```
- **If Next.js Cache Errors:** Terminate dev server, remove `.next` folder, and restart `npm run dev`.
