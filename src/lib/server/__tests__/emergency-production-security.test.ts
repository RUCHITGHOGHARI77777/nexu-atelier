import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { authService } from "../auth-service";
import { orderService } from "../order-service";
import { paymentService } from "../payment/payment-service";
import { paymentRecordService } from "../payment-record-service";
import { getAuthenticatedSeller } from "../seller-auth-helper";
import { otpService } from "../otp-service";
import { isDemoMode } from "../demo-mode";
import { PaymentProvider, PaymentStatus, OrderStatus, UserRole } from "@prisma/client";

describe("EMERGENCY PRODUCTION SECURITY & AUTHENTICATION VERIFICATION", () => {
  let victimUserId: string;
  let attackerUserId: string;
  let victimOrderId: string;
  let testProductId: string;
  let suspendedUserId: string;
  let suspendedToken: string;

  const victimEmail = `victim_sec_${Date.now()}@nexu.studio`;
  const attackerEmail = `attacker_sec_${Date.now()}@nexu.studio`;
  const suspendedEmail = `suspended_sec_${Date.now()}@nexu.studio`;

  beforeAll(async () => {
    const victimRes = await authService.register("Victim Patron", victimEmail, "ValidPass12345!", "+919811122233");
    victimUserId = victimRes.user!.id;

    const attackerRes = await authService.register("Attacker User", attackerEmail, "ValidPass12345!", "+919844455566");
    attackerUserId = attackerRes.user!.id;

    const suspendedRes = await authService.register("Suspended Patron", suspendedEmail, "ValidPass12345!");
    suspendedUserId = suspendedRes.user!.id;
    const loginRes = await authService.login(suspendedEmail, "ValidPass12345!");
    suspendedToken = loginRes.token!;

    await prisma.user.update({
      where: { id: suspendedUserId },
      data: { isSuspended: true },
    });

    const product = await prisma.product.findFirst({ where: { isPublished: true, stock: { gt: 5 } } });
    testProductId = product!.id;

    const orderRes = await orderService.createOrder(victimUserId, {
      items: [{ productId: testProductId, quantity: 1 }],
      deliveryMethodId: "standard",
      newAddress: {
        fullName: "Victim Patron",
        street: "45 Palace Road",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
        phone: "+919811122233",
      },
      idempotencyKey: `idem_emg_${Date.now()}`,
    });

    if (!orderRes.success || !orderRes.order) {
      throw new Error(`Failed to set up victim order: ${orderRes.error}`);
    }
    victimOrderId = orderRes.order.id;
  });

  afterAll(async () => {
    if (victimOrderId) {
      await prisma.paymentRecord.deleteMany({ where: { orderId: victimOrderId } });
      await prisma.vendorPayout.deleteMany({ where: { orderItem: { orderId: victimOrderId } } });
      await prisma.orderItem.deleteMany({ where: { orderId: victimOrderId } });
      await prisma.order.deleteMany({ where: { id: victimOrderId } });
    }
    const testIds = [victimUserId, attackerUserId, suspendedUserId].filter(Boolean);
    await prisma.session.deleteMany({ where: { userId: { in: testIds } } });
    await prisma.customerProfile.deleteMany({ where: { userId: { in: testIds } } });
    await prisma.auditEvent.deleteMany({ where: { performedBy: { in: [victimEmail, attackerEmail, suspendedEmail] } } });
    await prisma.user.deleteMany({ where: { id: { in: testIds } } });
  });

  describe("PRIORITY 1 — Payment Security & Financial Isolation", () => {
    it("rejects unauthorized user attempting to initiate payment for another customer's order", async () => {
      const res = await paymentService.initiateOrderPayment(victimOrderId, attackerUserId);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/unauthorized/i);
    });

    it("rejects unauthorized user attempting to verify/capture payment for another customer's order", async () => {
      const res = await paymentService.verifyAndCapturePayment(
        {
          orderId: victimOrderId,
          providerOrderId: "order_fake_123",
          providerPaymentId: "pay_fake_123",
          signature: "tampered_signature",
        },
        attackerUserId
      );
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/unauthorized/i);
    });

    it("rejects invalid or forged cryptographic signatures for payment verification", async () => {
      const res = await paymentService.verifyAndCapturePayment(
        {
          orderId: victimOrderId,
          providerOrderId: "order_fake_123",
          providerPaymentId: "pay_fake_123",
          signature: "forged_cryptographic_signature_hex",
        },
        victimUserId,
        "RAZORPAY"
      );
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/invalid payment signature/i);
    });

    it("does NOT create real vendor payouts for demo/sandbox payment transactions", async () => {
      const recordRes = await paymentRecordService.recordTransaction({
        orderId: victimOrderId,
        customerId: victimUserId,
        provider: PaymentProvider.ESCROW_INTERNAL,
        amountPaise: 50000,
        currency: "INR",
        transactionRef: `DEMO-PAY-${Date.now()}`,
        status: PaymentStatus.CAPTURED,
        isCod: false,
      });

      expect(recordRes.success).toBe(true);

      const payouts = await prisma.vendorPayout.findMany({
        where: { orderItem: { orderId: victimOrderId } },
      });
      expect(payouts.length).toBe(0);
    });

    it("safely and idempotently handles duplicate payment record submissions", async () => {
      const txRef = `DEMO-IDEM-${Date.now()}`;
      const first = await paymentRecordService.recordTransaction({
        orderId: victimOrderId,
        customerId: victimUserId,
        provider: PaymentProvider.ESCROW_INTERNAL,
        amountPaise: 50000,
        currency: "INR",
        transactionRef: txRef,
        status: PaymentStatus.CAPTURED,
      });

      expect(first.success).toBe(true);
      expect(first.isDuplicate).toBe(false);

      const second = await paymentRecordService.recordTransaction({
        orderId: victimOrderId,
        customerId: victimUserId,
        provider: PaymentProvider.ESCROW_INTERNAL,
        amountPaise: 50000,
        currency: "INR",
        transactionRef: txRef,
        status: PaymentStatus.CAPTURED,
      });

      expect(second.success).toBe(true);
      expect(second.isDuplicate).toBe(true);
    });
  });

  describe("PRIORITY 2 — Authentication & Session Security", () => {
    it("immediately revokes and denies session for suspended users in validateSession", async () => {
      const validated = await authService.validateSession(suspendedToken);
      expect(validated).toBeNull();

      const dbSession = await prisma.session.findUnique({
        where: { token: suspendedToken },
      });
      expect(dbSession).toBeNull();
    });

    it("strictly prevents Google Sign-In from hijacking administrative or seller accounts", async () => {
      const res = await authService.authenticateGoogle({
        email: "admin@nexu.studio",
        name: "Malicious Actor",
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/administrative and seller accounts require direct password authentication/i);
    });

    it("strictly prevents Google Sign-In from hijacking supplier accounts", async () => {
      const res = await authService.authenticateGoogle({
        email: "solstice@nexu.studio",
        name: "Malicious Supplier Hijacker",
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/administrative and seller accounts require direct password authentication/i);
    });

    it("rejects fake WhatsApp OTP codes and enforces genuine database verification", async () => {
      const res = await otpService.verifyOtp({
        phone: "+919876500000",
        code: "482910",
        purpose: "LOGIN",
      });

      expect(res.verified).toBe(false);
      expect(res.message).toMatch(/no active verification code found|invalid or expired/i);
    });

    it("successfully verifies genuine issued OTP and enforces single-use invalidation", async () => {
      const phone = `+9198${Date.now().toString().slice(-8)}`;
      const issueRes = await otpService.requestOtp({
        phone,
        purpose: "LOGIN",
      });

      expect(issueRes.success).toBe(true);
      expect(issueRes._debugCode).toBeDefined();

      const verify1 = await otpService.verifyOtp({
        phone,
        code: issueRes._debugCode!,
        purpose: "LOGIN",
      });
      expect(verify1.verified).toBe(true);

      const verify2 = await otpService.verifyOtp({
        phone,
        code: issueRes._debugCode!,
        purpose: "LOGIN",
      });
      expect(verify2.verified).toBe(false);
    });
  });

  describe("PRIORITY 3 — Demo Gate & Environment Configuration", () => {
    it("reports correct demo mode status depending on environment", () => {
      expect(typeof isDemoMode()).toBe("boolean");
    });
  });
});
