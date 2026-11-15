import { cookies } from "next/headers";
import { CustomerUser } from "@/types/customer";
import { AUTH_COOKIE_NAME, authService } from "./auth-service";

/**
 * Retrieves the currently authenticated customer user from the HTTP-only session cookie.
 */
export async function getSessionUser(): Promise<CustomerUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return await authService.validateSession(token);
  } catch {
    return null;
  }
}
