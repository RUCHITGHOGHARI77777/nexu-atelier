import { describe, it, expect } from "vitest";
import { authService } from "../auth-service";
import { prisma } from "../prisma";

describe("NEXU Authentication Engine — Demo & Google Identity Verification", () => {
  describe("1. Server-Authoritative Demo Authentication", () => {
    it("authenticates seeded Customer demo account and creates valid database session", async () => {
      const res = await authService.authenticateDemo("customer");

      expect(res.success).toBe(true);
      expect(res.user).toBeDefined();
      expect(res.user?.email).toBe("patron@nexu.studio");
      expect(res.user?.role).toBe("customer");
      expect(res.user?.id).toBe("usr_patron_01");
      expect(res.token).toBeDefined();

      // Verify token can validate session in database
      const validated = await authService.validateSession(res.token!);
      expect(validated).toBeDefined();
      expect(validated?.id).toBe("usr_patron_01");
      expect(validated?.role).toBe("customer");
    });

    it("authenticates seeded Seller demo account and resolves activeStoreId", async () => {
      const res = await authService.authenticateDemo("seller");

      expect(res.success).toBe(true);
      expect(res.user).toBeDefined();
      expect(res.user?.email).toBe("solstice@nexu.studio");
      expect(res.user?.role).toBe("seller");
      expect(res.user?.id).toBe("usr_seller_01");
      expect(res.user?.activeStoreId).toBe("vnd_sol_textiles");
      expect(res.token).toBeDefined();

      const validated = await authService.validateSession(res.token!);
      expect(validated).toBeDefined();
      expect(validated?.id).toBe("usr_seller_01");
      expect(validated?.role).toBe("seller");
      expect(validated?.activeStoreId).toBe("vnd_sol_textiles");
    });

    it("authenticates seeded Super Admin demo account", async () => {
      const res = await authService.authenticateDemo("admin");

      expect(res.success).toBe(true);
      expect(res.user).toBeDefined();
      expect(res.user?.email).toBe("admin@nexu.studio");
      expect(res.user?.role).toBe("admin");
      expect(res.user?.id).toBe("usr_admin_01");
      expect(res.token).toBeDefined();

      const validated = await authService.validateSession(res.token!);
      expect(validated).toBeDefined();
      expect(validated?.id).toBe("usr_admin_01");
      expect(validated?.role).toBe("admin");
    });

    it("strictly rejects invalid demo roles to prevent privilege tampering", async () => {
      // @ts-expect-error Testing invalid role runtime rejection
      const res = await authService.authenticateDemo("superuser");
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/invalid demo role/i);
    });
  });

  describe("2. Genuine Google Identity Verification & Database Upsert", () => {
    it("creates a new customer record with customer role for new Google account", async () => {
      const googleEmail = `google_patron_${Date.now()}@gmail.com`;
      const res = await authService.authenticateGoogle({
        email: googleEmail,
        name: "Google Patron Evaluator",
        photoURL: "https://lh3.googleusercontent.com/a/mock_avatar",
        uid: `goog_uid_${Date.now()}`,
      });

      expect(res.success).toBe(true);
      expect(res.user).toBeDefined();
      expect(res.user?.email).toBe(googleEmail);
      expect(res.user?.name).toBe("Google Patron Evaluator");
      expect(res.user?.role).toBe("customer"); // Security: Must never default to seller or admin
      expect(res.token).toBeDefined();

      // Verify user created in PostgreSQL
      const dbUser = await prisma.user.findUnique({
        where: { email: googleEmail },
        include: { profile: true },
      });
      expect(dbUser).toBeDefined();
      expect(dbUser?.role).toBe("CUSTOMER");
      expect(dbUser?.profile?.isEmailVerified).toBe(true);
    });

    it("authenticates existing Google account without duplicating user", async () => {
      const existingEmail = `google_returning_${Date.now()}@gmail.com`;

      // First authentication
      const first = await authService.authenticateGoogle({
        email: existingEmail,
        name: "Returning Google User",
      });
      expect(first.success).toBe(true);
      const originalUserId = first.user!.id;

      // Second authentication with same email
      const second = await authService.authenticateGoogle({
        email: existingEmail,
        name: "Returning Google User",
      });
      expect(second.success).toBe(true);
      expect(second.user?.id).toBe(originalUserId);

      // Verify only 1 record exists in DB
      const userCount = await prisma.user.count({
        where: { email: existingEmail },
      });
      expect(userCount).toBe(1);
    });

    it("rejects invalid or malformed Google email payloads", async () => {
      const res = await authService.authenticateGoogle({
        email: "not-an-email",
        name: "Bad Email",
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/valid email/i);
    });
  });

  describe("3. Session Lifecycle & Invalidation", () => {
    it("invalidates session from database on logout", async () => {
      const loginRes = await authService.authenticateDemo("customer");
      expect(loginRes.success).toBe(true);
      const token = loginRes.token!;

      // Confirm session is valid
      const beforeLogout = await authService.validateSession(token);
      expect(beforeLogout).not.toBeNull();

      // Logout
      await authService.logout(token);

      // Confirm session is deleted from database
      const afterLogout = await authService.validateSession(token);
      expect(afterLogout).toBeNull();
    });
  });
});

