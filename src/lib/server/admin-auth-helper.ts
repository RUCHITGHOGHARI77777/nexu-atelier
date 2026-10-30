import { getSessionUser } from "./session-helper";
import { prisma } from "./prisma";
import { CustomerUser } from "@/types/customer";
import { NextResponse } from "next/server";

export interface AdminAuthContext {
  user: CustomerUser;
  isAdmin: boolean;
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
    select: { id: true, role: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
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
