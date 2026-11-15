import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { hashPassword, verifyPassword, OWASP_PBKDF2_ITERATIONS } from "../password-util";
import { authService } from "../auth-service";
import { orderService } from "../order-service";
import { reviewService, ReviewError } from "../review-service";
import { checkRateLimit, resetRateLimit, SECURITY_RATE_LIMITS } from "../rate-limiter";
import { sanitizeText, isSafeMediaUrl } from "../sanitizer";
import { webhookService } from "../webhook-service";
import crypto from "crypto";

describe("ZERO-TRUST E-COMMERCE SECURITY SUITE", () => {
  let victimCustomerId: string;
  let attackerCustomerId: string;
  let victimOrderId: string;
  let testProductId: string;

  const victimEmail = `victim_${Date.now()}@nexu.studio`;
  const attackerEmail = `attacker_${Date.now()}@nexu.studio`;

  beforeAll(async () => {
    const victimUser = await authService.register("Victim Patron", victimEmail, "StrongPassword123!");
    victimCustomerId = victimUser.user!.id;

    const attackerUser = await authService.register("Attacker User", attackerEmail, "AttackerPass123!");
    attackerCustomerId = attackerUser.user!.id;

    const product = await prisma.product.findFirst({ where: { isPublished: true, stock: { gt: 5 } } });
    testProductId = product!.id;

    const orderRes = await orderService.createOrder(victimCustomerId, {
      items: [{ productId: testProductId, quantity: 1 }],
      deliveryMethodId: "standard",
      newAddress: {
        fullName: "Victim Patron",
        street: "123 Defense Way",
        city: "Cyber City",
        state: "Karnataka",
        pincode: "560001",
        phone: "+919876543210",
      },
      idempotencyKey: `idem_sec_${Date.now()}`,
    });
    if (!orderRes.success || !orderRes.order) {
      throw new Error(`Order creation failed in test setup: ${orderRes.error}`);
    }
    victimOrderId = orderRes.order.id;
  });

  afterAll(async () => {
    if (victimOrderId) {
      await prisma.orderItem.deleteMany({ where: { orderId: victimOrderId } });
      await prisma.order.deleteMany({ where: { id: victimOrderId } });
    }
    await prisma.session.deleteMany({ where: { userId: { in: [victimCustomerId, attackerCustomerId] } } });
    await prisma.customerProfile.deleteMany({ where: { userId: { in: [victimCustomerId, attackerCustomerId] } } });
    await prisma.auditEvent.deleteMany({ where: { performedBy: { in: [victimEmail, attackerEmail] } } });
    await prisma.user.deleteMany({ where: { id: { in: [victimCustomerId, attackerCustomerId] } } });
  });

  describe("1. Password Hashing & Cryptographic Entropy (OWASP ASVS V2)", () => {
    it("generates password hashes using OWASP standard 210,000 PBKDF2-SHA512 iterations", () => {
      const password = "ComplexPatronPassword2026!";
      const hash = hashPassword(password);

      const parts = hash.split(":");
      expect(parts.length).toBe(3);
      expect(parts[0].length).toBe(32); // 16-byte salt as hex
      expect(parseInt(parts[1], 10)).toBe(OWASP_PBKDF2_ITERATIONS);
      expect(parts[2].length).toBe(128); // 64-byte SHA512 hash as hex

      expect(verifyPassword(password, hash)).toBe(true);
      expect(verifyPassword("WrongPassword123!", hash)).toBe(false);
    });

    it("verifies legacy 2-part hashes gracefully without regression", () => {
      const salt = crypto.randomBytes(16).toString("hex");
      const legacyHash = crypto.pbkdf2Sync("LegacyPass123!", salt, 1000, 64, "sha512").toString("hex");
      const stored = `${salt}:${legacyHash}`;

      expect(verifyPassword("LegacyPass123!", stored)).toBe(true);
      expect(verifyPassword("InvalidPass", stored)).toBe(false);
    });

    it("safely handles null, malformed, or tampered password hashes", () => {
      expect(verifyPassword("test", "")).toBe(false);
      expect(verifyPassword("test", "malformed_hash_without_salt")).toBe(false);
      expect(verifyPassword("test", "salt:invalid_nan_iterations:hash")).toBe(false);
    });
  });

  describe("2. Broken Object Level Authorization (BOLA / IDOR Defense)", () => {
    it("strictly prevents Attacker from accessing Victim's order manifest (IDOR read defense)", async () => {
      const order = await orderService.getOrderById(attackerCustomerId, victimOrderId);
      expect(order).toBeNull();
    });

    it("strictly prevents Attacker from cancelling Victim's order (IDOR mutation defense)", async () => {
      const cancelRes = await orderService.cancelOrder(attackerCustomerId, victimOrderId, "Malicious cancel attempt");
      expect(cancelRes.success).toBe(false);
      expect(cancelRes.error).toContain("Order not found");

      const freshOrder = await prisma.order.findUnique({ where: { id: victimOrderId } });
      expect(freshOrder?.status).not.toBe("CANCELLED");
    });

    it("strictly prevents Attacker from reviewing an order item belonging to Victim", async () => {
      const victimOrder = await prisma.order.findUnique({
        where: { id: victimOrderId },
        include: { items: true },
      });
      const victimOrderItemId = victimOrder!.items[0].id;

      await expect(
        reviewService.createReview(
          {
            productId: testProductId,
            orderItemId: victimOrderItemId,
            rating: 5,
            title: "Spoofed review",
            comment: "Attempting to claim verified purchase on victim order item",
          },
          attackerCustomerId
        )
      ).rejects.toThrow(ReviewError);
    });
  });

  describe("3. Input Sanitization & Cross-Site Scripting (XSS Defense)", () => {
    it("strips script tags and executable inline event handlers from user text", () => {
      const maliciousPayload = `<script>alert('XSS')</script>Hello <img src="x" onerror="stealCookies()">World`;
      const sanitized = sanitizeText(maliciousPayload);

      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("alert('XSS')");
      expect(sanitized).not.toContain("onerror=");
      expect(sanitized).toContain("Hello");
      expect(sanitized).toContain("World");
    });

    it("purges null bytes that could bypass input filters or file extensions", () => {
      const payloadWithNullByte = "malicious\0text.js";
      const sanitized = sanitizeText(payloadWithNullByte);
      expect(sanitized).not.toContain("\0");
      expect(sanitized).toBe("malicioustext.js");
    });

    it("sanitizes user profile updates preventing stored XSS in customer name", async () => {
      const xssName = `Aarav <script>fetch('/evil')</script>Mehta`;
      const updateRes = await authService.updateProfile(attackerCustomerId, { name: xssName });

      expect(updateRes.success).toBe(true);
      expect(updateRes.user?.name).not.toContain("<script>");
      expect(updateRes.user?.name).toBe("Aarav Mehta");
    });
  });

  describe("4. SSRF & Media URL Security", () => {
    it("strictly blocks private subnets, cloud metadata IPs, and loopback in media URLs", () => {
      expect(isSafeMediaUrl("http://127.0.0.1/admin")).toBe(false);
      expect(isSafeMediaUrl("http://localhost:3000/internal")).toBe(false);
      expect(isSafeMediaUrl("http://169.254.169.254/latest/meta-data/")).toBe(false);
      expect(isSafeMediaUrl("http://10.0.0.1/private-api")).toBe(false);
      expect(isSafeMediaUrl("http://192.168.1.1/router")).toBe(false);
      expect(isSafeMediaUrl("javascript:alert(1)")).toBe(false);
      expect(isSafeMediaUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    });

    it("permits approved trusted image CDNs and safe local upload paths", () => {
      expect(
        isSafeMediaUrl("https://images.unsplash.com/photo-1544005313", ["images.unsplash.com"])
      ).toBe(true);
      expect(isSafeMediaUrl("/uploads/verified-piece.jpg")).toBe(true);
      expect(isSafeMediaUrl("/uploads/../etc/passwd")).toBe(false); // Path traversal blocked
    });
  });

  describe("5. Rate Limiting & Automated Abuse Protection", () => {
    it("enforces sliding window limits and rejects requests exceeding the threshold", async () => {
      const testIp = `198.51.100.${Math.floor(Math.random() * 250)}`;
      const scope = "TEST_RATE_LIMIT";
      const options = { limit: 3, windowSeconds: 60 };

      const r1 = await checkRateLimit(testIp, scope, options);
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = await checkRateLimit(testIp, scope, options);
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = await checkRateLimit(testIp, scope, options);
      expect(r3.allowed).toBe(true);
      expect(r3.remaining).toBe(0);

      const r4 = await checkRateLimit(testIp, scope, options);
      expect(r4.allowed).toBe(false);
      expect(r4.remaining).toBe(0);
      expect(r4.retryAfterSeconds).toBeGreaterThan(0);

      resetRateLimit(testIp, scope);
      const r5 = await checkRateLimit(testIp, scope, options);
      expect(r5.allowed).toBe(true);
      expect(r5.remaining).toBe(2);
    });
  });

  describe("6. Cryptographic Webhook Integrity & Replay Defense", () => {
    it("rejects payment webhooks with forged or invalid HMAC signatures", async () => {
      const fakeEventId = `sec_evt_${Date.now()}`;
      const fakePayload = JSON.stringify({ event: "payment.captured", amount: 100000 });
      const badSignature = "forged_cryptographic_signature_abc123";

      const res = await webhookService.handleWebhook({
        provider: "RAZORPAY",
        eventId: fakeEventId,
        eventType: "payment.captured",
        rawBody: fakePayload,
        signature: badSignature,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("signature verification failed");
    });
  });

  describe("7. Privacy Masking & Sensitive Data Exposure Defense", () => {
    it("masks customer identities in public reviews to prevent patron tracking", async () => {
      const reviews = await reviewService.getProductReviews(testProductId);
      for (const rev of reviews.reviews) {
        expect(rev.reviewerName).toBeDefined();
        expect(typeof rev.reviewerName).toBe("string");
        expect((rev as any).customerId).toBeUndefined();
        expect((rev as any).customerEmail).toBeUndefined();
      }
    });

    it("ensures auth session outputs never leak passwordHash or salt", async () => {
      const patron = await authService.getUserById(victimCustomerId);
      expect(patron).not.toBeNull();
      expect((patron as any).passwordHash).toBeUndefined();
      expect((patron as any).salt).toBeUndefined();
    });
  });
});
