import { describe, it, expect } from "vitest";
import { authService } from "../auth-service";
import { hashPassword, verifyPassword } from "../password-util";

describe("authService - Database Registration & Validation", () => {
  it("successfully registers a new customer with valid inputs in database", async () => {
    const testEmail = `newpatron_${Date.now()}@nexu.studio`;
    const res = await authService.register(
      "Rohan Sen",
      testEmail,
      "SecurePassword123!",
      "+91 9988776655"
    );

    expect(res.success).toBe(true);
    expect(res.user).toBeDefined();
    expect(res.user?.email).toBe(testEmail.toLowerCase());
    expect(res.user?.name).toBe("Rohan Sen");
    expect(res.user?.role).toBe("customer");
    expect(res.user?.id).toBeDefined();
  });

  it("rejects registration with duplicate email", async () => {
    const dupEmail = `dup_${Date.now()}@nexu.studio`;
    const first = await authService.register("Maya Rao", dupEmail, "SecretPass123!");
    expect(first.success).toBe(true);

    const second = await authService.register("Maya Rao Duplicate", dupEmail, "SecretPass123!");
    expect(second.success).toBe(false);
    expect(second.error).toContain("already exists");
  });

  it("validates registration field constraints before touching database", async () => {
    const shortName = await authService.register("A", "test@nexu.studio", "SecretPass123!");
    expect(shortName.success).toBe(false);
    expect(shortName.error).toContain("at least 2 characters");

    const badEmail = await authService.register("Aarav", "notanemail", "SecretPass123!");
    expect(badEmail.success).toBe(false);
    expect(badEmail.error).toContain("valid email");

    const shortPass = await authService.register("Aarav", "valid@nexu.studio", "short");
    expect(shortPass.success).toBe(false);
    expect(shortPass.error).toContain("at least 8 characters");
  });
});

describe("authService - Login & Session Flow with Database", () => {
  it("authenticates seeded default customer and creates persisted session token", async () => {
    const res = await authService.login("patron@nexu.studio", "Password123!");
    expect(res.success).toBe(true);
    expect(res.user?.id).toBe("usr_patron_01");
    expect(res.token).toBeDefined();

    // Verify session validation
    if (res.token) {
      const validatedUser = await authService.validateSession(res.token);
      expect(validatedUser).toBeDefined();
      expect(validatedUser?.id).toBe("usr_patron_01");
    }
  });

  it("rejects invalid password", async () => {
    const res = await authService.login("patron@nexu.studio", "WrongPassword999!");
    expect(res.success).toBe(false);
    expect(res.error).toContain("Invalid email or password");
  });

  it("rejects non-existent email", async () => {
    const res = await authService.login("unknown_user_never_existed@nexu.studio", "AnyPassword123!");
    expect(res.success).toBe(false);
    expect(res.error).toContain("Invalid email or password");
  });

  it("terminates session upon logout in database", async () => {
    const res = await authService.login("patron@nexu.studio", "Password123!");
    expect(res.success).toBe(true);
    const token = res.token!;

    expect(await authService.validateSession(token)).not.toBeNull();
    await authService.logout(token);
    expect(await authService.validateSession(token)).toBeNull();
  });
});

describe("password-util - Security Boundary", () => {
  it("creates cryptographically salted PBKDF2 hash and verifies correctly", () => {
    const plaintext = "HyperSecurePassphrase!2026";
    const hashed = hashPassword(plaintext);

    expect(hashed).toContain(":");
    const parts = hashed.split(":");
    expect(parts.length).toBe(3); // salt:iterations:hash
    expect(parts[0].length).toBe(32); // 16-byte hex salt
    expect(parts[1]).toBe("210000"); // OWASP ASVS standard iterations

    // Positive verification
    expect(verifyPassword(plaintext, hashed)).toBe(true);
    // Negative verification
    expect(verifyPassword("WrongGuess123!", hashed)).toBe(false);
  });
});
