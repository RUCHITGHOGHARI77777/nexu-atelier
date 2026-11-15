/**
 * NEXU PLATFORM — Zero Client Trust & Anti-IDOR Security Enforcer
 * 
 * Enforces the strict rule:
 * API routes (/api/seller/*, /api/orders/*, /api/products/*) NEVER accept raw sellerId or storeId
 * from request payloads without cross-verifying against the authenticated server session (session.user.activeStoreId).
 */

export class AntiIdorSecurityViolationError extends Error {
  public statusCode: number = 403;
  public violationType: string = "ANTI_IDOR_BREACH";

  constructor(message: string) {
    super(message);
    this.name = "AntiIdorSecurityViolationError";
  }
}

export interface ZeroTrustValidationParams {
  claimedStoreId?: string | null;
  authenticatedStoreId?: string | null;
  userRole?: string;
  actionContext?: string;
}

/**
 * Validates that any client-claimed storeId or sellerId exactly matches the authenticated session.
 * Throws AntiIdorSecurityViolationError if any unauthorized mismatch is detected.
 */
export function assertZeroClientTrust({
  claimedStoreId,
  authenticatedStoreId,
  userRole,
  actionContext = "Resource Access",
}: ZeroTrustValidationParams): { authorized: boolean; verifiedStoreId: string } {
  if (userRole === "admin") {
    const storeId = claimedStoreId || authenticatedStoreId || "PLATFORM_SUPER_ADMIN";
    return { authorized: true, verifiedStoreId: storeId };
  }

  if (!authenticatedStoreId) {
    throw new AntiIdorSecurityViolationError(
      `Zero Client Trust Barrier: No activeStoreId found in authenticated session for ${actionContext}.`
    );
  }

  if (claimedStoreId && claimedStoreId !== authenticatedStoreId) {
    throw new AntiIdorSecurityViolationError(
      `Zero Client Trust Violation in ${actionContext}: Client attempted to access/mutate tenant '${claimedStoreId}' while authenticated session is bound to '${authenticatedStoreId}'. Request blocked.`
    );
  }

  return { authorized: true, verifiedStoreId: authenticatedStoreId };
}

/**
 * Safe checker that returns a boolean and message without throwing.
 */
export function verifyZeroClientTrust(params: ZeroTrustValidationParams): {
  authorized: boolean;
  verifiedStoreId?: string;
  error?: string;
} {
  try {
    const result = assertZeroClientTrust(params);
    return { authorized: true, verifiedStoreId: result.verifiedStoreId };
  } catch (err: any) {
    return { authorized: false, error: err.message };
  }
}

