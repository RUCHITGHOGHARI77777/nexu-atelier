/**
 * NEXU ATELIER — Centralized Demo Mode & Platform Environment Configuration
 *
 * Governs strict environmental boundaries between:
 * - Production: Zero unverified client assertions, real gateway enforcement, real 3PL couriers, real email/SMS delivery.
 * - Demo / Staging: Evaluator sandbox mode with seeded accounts, simulated adapters (Sandbox/Razorpay Test),
 *   simulated Shiprocket logistics with unique AWBs, and an email/WhatsApp demo outbox.
 *
 * SAFETY INVARIANT: Real money transactions, real courier pickups, and real unmonitored external
 * messages are STRICTLY PROHIBITED in Demo Mode.
 */

export interface DemoConfig {
  isDemoMode: boolean;
  isDemoAdminAllowed: boolean;
  payment: {
    mode: "DEMO_SANDBOX" | "RAZORPAY_TEST";
    provider: "SANDBOX" | "RAZORPAY";
    isLiveBlocked: boolean;
    allowFailureSimulation: boolean;
    allowCancelSimulation: boolean;
    allowRefundSimulation: boolean;
  };
  shipping: {
    mode: "DEMO_SIMULATED_3PL";
    providerName: string;
    awbPrefix: string;
    supportedStates: string[];
    isLiveCourierBlocked: boolean;
  };
  notifications: {
    mode: "DEMO_OUTBOX";
    interceptEmail: boolean;
    interceptWhatsApp: boolean;
    realDispatchBlocked: boolean;
  };
  seededAccounts: {
    customer: { email: string; name: string; role: string };
    seller: { email: string; name: string; role: string };
    admin: { email: string; name: string; role: string };
  };
}

export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === "false") return false;
  if (process.env.DEMO_MODE === "true") return true;
  if (process.env.ALLOW_DEMO_IN_PROD === "true") return true;
  if (process.env.NODE_ENV === "production") return false;
  return true;
}

export function isDemoAdminAllowed(): boolean {
  if (process.env.DEMO_ADMIN_ALLOWED === "true") return true;
  if (isDemoMode() && process.env.NODE_ENV !== "production") return true;
  return false;
}

export function getDemoConfig(): DemoConfig {
  const active = isDemoMode();
  const hasRazorpayTestKey = Boolean(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_ID.startsWith("rzp_test_") &&
    process.env.RAZORPAY_KEY_ID !== "rzp_test_placeholder"
  );

  return {
    isDemoMode: active,
    isDemoAdminAllowed: isDemoAdminAllowed(),
    payment: {
      mode: hasRazorpayTestKey ? "RAZORPAY_TEST" : "DEMO_SANDBOX",
      provider: hasRazorpayTestKey ? "RAZORPAY" : "SANDBOX",
      isLiveBlocked: true,
      allowFailureSimulation: true,
      allowCancelSimulation: true,
      allowRefundSimulation: true,
    },
    shipping: {
      mode: "DEMO_SIMULATED_3PL",
      providerName: "Shiprocket Simulator (NEXU Express 3PL)",
      awbPrefix: "DEMO-SR",
      supportedStates: [
        "CONFIRMED",
        "DISPATCHED",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "RTO",
      ],
      isLiveCourierBlocked: true,
    },
    notifications: {
      mode: "DEMO_OUTBOX",
      interceptEmail: true,
      interceptWhatsApp: true,
      realDispatchBlocked: true,
    },
    seededAccounts: {
      customer: {
        email: "patron@nexu.studio",
        name: "Vikramaditya Rao",
        role: "CUSTOMER",
      },
      seller: {
        email: "solstice@nexu.studio",
        name: "Solstice Handloom Textiles",
        role: "SELLER",
      },
      admin: {
        email: "admin@nexu.studio",
        name: "Sarah Jenkins (Platform Owner)",
        role: "ADMIN",
      },
    },
  };
}

/**
 * Strict Security Guard: Ensures live keys (rzp_live_*) can never be used in Demo Mode.
 * Throws a fatal security exception if real payment processing is attempted.
 */
export function assertNoLivePaymentInDemo(keyId?: string): void {
  const activeKey = keyId || process.env.RAZORPAY_KEY_ID || "";
  if (isDemoMode()) {
    if (activeKey.startsWith("rzp_live_")) {
      throw new Error(
        "CRITICAL SECURITY VIOLATION: Live Razorpay key detected in DEMO MODE. Real payments are strictly forbidden."
      );
    }
  }
}

export const SEEDED_DEMO_EMAILS = [
  "patron@nexu.studio",
  "solstice@nexu.studio",
  "admin@nexu.studio",
];

export function isDemoEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return SEEDED_DEMO_EMAILS.includes(clean) || clean.includes("demo") || clean.endsWith("@demo.nexu.studio");
}

export interface DatabaseIdentityVerification {
  safe: boolean;
  databaseName: string;
  isAmbiguous: boolean;
  reason?: string;
}

/**
 * Authoritative check that verifies the PostgreSQL database identity before any demo reset or purge.
 * Blocks operation if the target database points to production, is ambiguous, or lacks explicit demo indicators.
 */
export async function verifyDatabaseIdentityForReset(
  queryDbFn?: () => Promise<string>
): Promise<DatabaseIdentityVerification> {
  if (!isDemoMode()) {
    return {
      safe: false,
      databaseName: "UNKNOWN",
      isAmbiguous: false,
      reason: "Reset blocked: Platform is not running in DEMO_MODE.",
    };
  }

  let dbName = "UNKNOWN";
  if (queryDbFn) {
    try {
      dbName = await queryDbFn();
    } catch (err: any) {
      return {
        safe: false,
        databaseName: "ERROR",
        isAmbiguous: true,
        reason: `Failed to query database identity: ${err.message}`,
      };
    }
  }

  const rawUrl = process.env.DATABASE_URL || "";

  const prodMarkers = [
    "production",
    "prod-cluster",
    "prod_db",
    "aws.rds",
    "supabase.co",
    "neon.tech/prod",
    "cockroachlabs.cloud",
    "-prod",
  ];

  for (const marker of prodMarkers) {
    if (rawUrl.toLowerCase().includes(marker) || dbName.toLowerCase().includes(marker)) {
      return {
        safe: false,
        databaseName: dbName,
        isAmbiguous: false,
        reason: `Reset blocked: Target database '${dbName}' matches production marker '${marker}'.`,
      };
    }
  }

  const safeIndicators = [
    "demo",
    "test",
    "dev",
    "localhost",
    "127.0.0.1",
    "nexu_ecommerce",
    "nexu_demo",
  ];

  const urlWithoutScheme = rawUrl.replace(/^[a-zA-Z0-9+.-]+:\/\//, "");

  const urlMatchesSafe = safeIndicators.some((ind) => urlWithoutScheme.toLowerCase().includes(ind));
  const nameMatchesSafe = safeIndicators.some((ind) => dbName.toLowerCase().includes(ind));

  if (!urlMatchesSafe && !nameMatchesSafe) {
    return {
      safe: false,
      databaseName: dbName,
      isAmbiguous: true,
      reason: `Reset blocked: Ambiguous database identity. Database '${dbName}' lacks local/demo/dev verification markers.`,
    };
  }

  return {
    safe: true,
    databaseName: dbName,
    isAmbiguous: false,
  };
}
