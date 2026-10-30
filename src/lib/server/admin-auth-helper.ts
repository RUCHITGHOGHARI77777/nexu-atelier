import { getSessionUser } from "./session-helper";
import { prisma } from "./prisma";
import { CustomerUser } from "@/types/customer";
import { NextResponse } from "next/server";

export interface AdminAuthContext {
  user: CustomerUser;
  isAdmin: boolean;
}

export type AdminPermission =
  | "VIEW_DASHBOARD"
  | "MANAGE_USERS"
  | "MODERATE_PRODUCTS"
  | "MANAGE_SELLERS"
  | "MANAGE_ORDERS"
  | "PROCESS_REFUNDS"
  | "MANAGE_PAYOUTS"
  | "MANAGE_SETTINGS"
  | "MANAGE_ADMINS";

/**
 * Checks if the authenticated administrator holds the requested operational permission.
 */
export function hasAdminPermission(
  context: AdminAuthContext,
  permission: AdminPermission
): boolean {
  if (!context || !context.isAdmin) return false;
  // All authenticated users with ADMIN role in database hold full governance capabilities
  return true;
}

/**
 * Validates that the current request has a valid session belonging to a user with ADMIN role.
 * Protects server actions and API handlers against unauthorized and privilege-escalated access.
 */
export async function getAuthenticatedAdmin(): Promise<AdminAuthContext | null> {
  const user = await getSessionUser();
  if (!user) return null;

  // Authoritative database check to ensure role has not been tampered with or revoked
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, isSuspended: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN" || dbUser.isSuspended) {
    return null;
  }

  return {
    user,
    isAdmin: true,
  };
}

/**
 * Utility helper for API routes to enforce admin privilege with appropriate HTTP responses.
 */
export async function requireAdminApi(): Promise<
  | { success: true; context: AdminAuthContext }
  | { success: false; response: NextResponse }
> {
  const context = await getAuthenticatedAdmin();
  if (!context) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Unauthorized: Administrator credentials required to access this resource.",
        },
        { status: 403 }
      ),
    };
  }

  return { success: true, context };
}

/**
 * Enforces specific operational permission for administrative API actions.
 */
export async function requireAdminPermissionApi(permission: AdminPermission): Promise<
  | { success: true; context: AdminAuthContext }
  | { success: false; response: NextResponse }
> {
  const res = await requireAdminApi();
  if (!res.success) return res;

  if (!hasAdminPermission(res.context, permission)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: `Forbidden: Missing required administrative permission "${permission}".` },
        { status: 403 }
      ),
    };
  }

  return res;
}
