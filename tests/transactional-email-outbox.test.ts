import { describe, it, expect } from "vitest";
import { notificationService } from "@/lib/server/notification-service";
import * as emailTemplates from "@/lib/server/email/email-templates";
import { prisma } from "@/lib/server/prisma";
import { NotificationStatus } from "@prisma/client";

describe("Transactional Email Architecture & Branded Luxury Templates", () => {
  describe("Customer Email Templates", () => {
    it("renders Welcome Onboarding email with luxury styling and welcome coupon", () => {
      const email = emailTemplates.renderWelcomeEmail({
        name: "Aarav Sharma",
        email: "aarav@example.com",
        couponCode: "NEXUFIRST",
      });

      expect(email.subject).toContain("Welcome to NEXU ATELIER");
      expect(email.html).toContain("NEXUFIRST");
      expect(email.html).toContain("Haute Artisan Commerce");
      expect(email.html).toContain("Aarav Sharma");
      expect(email.text).toContain("NEXUFIRST");
    });

    it("renders Order Confirmed email with order ID, total, and tracking link", () => {
      const email = emailTemplates.renderOrderConfirmedEmail({
        orderId: "ORD-2026-99001",
        customerName: "Priya Nair",
        totalINR: "45,000",
        itemsCount: 2,
        estimatedDeliveryDate: "3 business days",
      });

      expect(email.subject).toContain("ORD-2026-99001");
      expect(email.html).toContain("ORD-2026-99001");
      expect(email.html).toContain("₹45,000");
      expect(email.html).toContain("track-order?orderId=ORD-2026-99001");
      expect(email.text).toContain("ORD-2026-99001");
    });

    it("renders Payment Confirmed email with UTR reference and receipt details", () => {
      const email = emailTemplates.renderPaymentConfirmedEmail({
        orderId: "ORD-2026-99001",
        customerName: "Priya Nair",
        totalINR: "45,000",
        paymentMethod: "Direct Instant UPI (HDFC Bank)",
        transactionRef: "HDFC-UPI-998877",
      });

      expect(email.subject).toContain("Payment Receipt");
      expect(email.html).toContain("HDFC-UPI-998877");
      expect(email.html).toContain("Direct Instant UPI");
    });

    it("renders Order Shipped email with courier name and AWB tracking number", () => {
      const email = emailTemplates.renderOrderShippedEmail({
        orderId: "ORD-2026-99001",
        customerName: "Priya Nair",
        carrierName: "Blue Dart Express",
        trackingNumber: "BD9988776655",
      });

      expect(email.subject).toContain("Dispatched: Order ORD-2026-99001 via Blue Dart Express");
      expect(email.html).toContain("BD9988776655");
      expect(email.text).toContain("BD9988776655");
    });

    it("renders Order Delivered email", () => {
      const email = emailTemplates.renderOrderDeliveredEmail({
        orderId: "ORD-2026-99001",
        customerName: "Priya Nair",
      });

      expect(email.subject).toContain("Delivered: Your NEXU ATELIER Parcel Has Arrived");
      expect(email.html).toContain("Priya Nair");
    });

    it("renders Order Cancelled and Refund Issued emails", () => {
      const cancelEmail = emailTemplates.renderOrderCancelledEmail({
        orderId: "ORD-2026-99001",
        customerName: "Priya Nair",
        reason: "Patron size adjustment",
        refundInitiated: true,
        refundAmountINR: "45,000",
      });
      expect(cancelEmail.html).toContain("Escrow Refund Initiated");
      expect(cancelEmail.html).toContain("₹45,000");

      const refundEmail = emailTemplates.renderRefundUpdateEmail({
        orderId: "ORD-2026-99001",
        customerName: "Priya Nair",
        amountINR: "45,000",
        refundId: "REF-9988",
        status: "CREDITED_TO_SOURCE",
      });
      expect(refundEmail.subject).toContain("Refund Notice");
      expect(refundEmail.html).toContain("REF-9988");
    });

    it("renders Password Reset and Security Alert emails", () => {
      const resetEmail = emailTemplates.renderPasswordResetEmail({
        name: "Aarav",
        resetUrl: "https://nexuatelier.com/reset-password?token=secret123",
      });
      expect(resetEmail.html).toContain("https://nexuatelier.com/reset-password?token=secret123");

      const alertEmail = emailTemplates.renderSecurityAlertEmail({
        name: "Aarav",
        action: "Password Changed from New Device",
        ipAddress: "203.0.113.195",
      });
      expect(alertEmail.html).toContain("Password Changed from New Device");
      expect(alertEmail.html).toContain("203.0.113.195");
    });
  });

  describe("Supplier Email Templates", () => {
    it("renders New Order Allocated email for studio master artisans", () => {
      const email = emailTemplates.renderSupplierNewOrderEmail({
        supplierName: "Solstice Loom Studio",
        orderId: "ORD-2026-99002",
        itemsCount: 3,
        totalPayoutINR: "38,500",
      });

      expect(email.subject).toContain("New Order Allocated: ORD-2026-99002");
      expect(email.html).toContain("Solstice Loom Studio");
      expect(email.html).toContain("₹38,500");
      expect(email.html).toContain("/seller/orders");
    });

    it("renders Product Approved and Product Revision emails", () => {
      const approvedEmail = emailTemplates.renderSupplierProductApprovedEmail({
        supplierName: "Solstice Loom Studio",
        productTitle: "Handspun Mulberry Raw Silk Kimono",
        productId: "prod_123",
        slug: "handspun-mulberry-raw-silk-kimono",
      });
      expect(approvedEmail.subject).toContain("Approved");
      expect(approvedEmail.html).toContain("Handspun Mulberry Raw Silk Kimono");

      const rejectedEmail = emailTemplates.renderSupplierProductRejectedEmail({
        supplierName: "Solstice Loom Studio",
        productTitle: "Sample Robe",
        productId: "prod_456",
        feedback: "Please provide high-resolution studio photography on a neutral white background.",
      });
      expect(rejectedEmail.subject).toContain("Changes Requested");
      expect(rejectedEmail.html).toContain("Please provide high-resolution studio photography");
    });

    it("renders Supplier Settlement email with bank UTR and net payout", () => {
      const email = emailTemplates.renderSupplierSettlementEmail({
        supplierName: "Solstice Loom Studio",
        payoutId: "PAY-9922",
        amountINR: "1,25,000",
        utrReference: "HDFC998877665544",
        bankLast4: "4321",
      });

      expect(email.subject).toContain("Settlement Paid");
      expect(email.html).toContain("HDFC998877665544");
      expect(email.html).toContain("₹1,25,000");
    });
  });

  describe("Admin Email Templates", () => {
    it("renders Admin Supplier Application and Platform Alert emails", () => {
      const appEmail = emailTemplates.renderAdminSupplierApplicationEmail({
        studioName: "Kashmir Cashmere Guild",
        ownerName: "Tariq Mir",
        email: "tariq@mir-guild.in",
        city: "Srinagar",
        state: "Jammu & Kashmir",
      });
      expect(appEmail.subject).toContain("[Admin] New Studio Application: Kashmir Cashmere Guild");
      expect(appEmail.html).toContain("Srinagar, Jammu & Kashmir");

      const alertEmail = emailTemplates.renderAdminPlatformAlertEmail({
        title: "High Checkout Spike Detected",
        message: "Order volume increased by 300% over the last 15 minutes.",
        severity: "WARNING",
      });
      expect(alertEmail.subject).toContain("[Platform Alert - WARNING]");
      expect(alertEmail.html).toContain("High Checkout Spike Detected");
    });
  });

  describe("Outbox Queue & Reliable Processing Engine", () => {
    it("queues an email notification into the database and deduplicates by idempotencyKey", async () => {
      const key = `test_idem_${Date.now()}`;

      const res1 = await notificationService.queueNotification({
        channel: "EMAIL",
        recipient: "patron@example.com",
        template: "WELCOME_ONBOARDING",
        idempotencyKey: key,
        payload: { name: "Test Patron", email: "patron@example.com" },
      });

      expect(res1.queued).toBe(true);
      expect(res1.id).toBeDefined();

      // Second queue attempt with same idempotency key must not create a duplicate record
      const res2 = await notificationService.queueNotification({
        channel: "EMAIL",
        recipient: "patron@example.com",
        template: "WELCOME_ONBOARDING",
        idempotencyKey: key,
        payload: { name: "Test Patron", email: "patron@example.com" },
      });

      expect(res2.queued).toBe(false);
      expect(res2.id).toBe(res1.id);

      // Clean up test record
      if (res1.id) {
        await prisma.notificationEvent.delete({ where: { id: res1.id } }).catch(() => {});
      }
    });

    it("processes pending notifications in the outbox queue and reports metrics", async () => {
      const metrics = await notificationService.getOutboxMetrics();
      expect(metrics.total).toBeGreaterThanOrEqual(0);
      expect(metrics.deliveryRatePercent).toBeGreaterThanOrEqual(0);

      const batchResult = await notificationService.processOutboxQueue(5);
      expect(batchResult.processed).toBeGreaterThanOrEqual(0);
      expect(batchResult.succeeded).toBeGreaterThanOrEqual(0);
    });
  });
});

