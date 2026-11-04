/**
 * NEXU ATELIER — Production Environment & Demo Guard
 *
 * Governs strict environmental boundaries between:
 * - Production: Zero unverified client assertions, no demo auto-logins, no public one-click admin access, real gateway enforcement.
 * - Demo / Staging: Evaluator sandbox mode with seeded accounts and simulated providers.
 */

export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === "true") return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

export function isDemoAdminAllowed(): boolean {
  // Demo admin access is strictly disabled in production unless explicitly enabled via DEMO_ADMIN_ALLOWED="true"
  if (process.env.NODE_ENV === "production") {
    return process.env.DEMO_ADMIN_ALLOWED === "true";
  }
  return true;
}

