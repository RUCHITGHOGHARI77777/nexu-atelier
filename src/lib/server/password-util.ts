import crypto from "crypto";

export const OWASP_PBKDF2_ITERATIONS = 210000;
export const LEGACY_PBKDF2_ITERATIONS = 1000;

/**
 * Hashes a password using PBKDF2-HMAC-SHA512 with a cryptographically secure 16-byte salt
 * and OWASP-compliant 210,000 iterations.
 * Formats output as salt:iterations:hash.
 */
export function hashPassword(
  password: string,
  iterations: number = OWASP_PBKDF2_ITERATIONS
): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, iterations, 64, "sha512")
    .toString("hex");
  return `${salt}:${iterations}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored hash string.
 * Supports backwards compatibility with legacy 2-part format (salt:hash)
 * and modern 3-part format (salt:iterations:hash).
 * Uses constant-time comparison (crypto.timingSafeEqual) to prevent timing attacks.
 */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    if (!stored || typeof stored !== "string") return false;
    const parts = stored.split(":");

    let salt: string;
    let iterations: number;
    let originalHash: string;

    if (parts.length === 3) {
      salt = parts[0];
      iterations = parseInt(parts[1], 10);
      originalHash = parts[2];
    } else if (parts.length === 2) {
      salt = parts[0];
      iterations = LEGACY_PBKDF2_ITERATIONS;
      originalHash = parts[1];
    } else {
      return false;
    }

    if (!salt || !originalHash || isNaN(iterations) || iterations < 1) {
      return false;
    }

    const hash = crypto
      .pbkdf2Sync(password, salt, iterations, 64, "sha512")
      .toString("hex");

    const hashBuffer = Buffer.from(hash, "hex");
    const originalBuffer = Buffer.from(originalHash, "hex");

    if (hashBuffer.length !== originalBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(hashBuffer, originalBuffer);
  } catch {
    return false;
  }
}
