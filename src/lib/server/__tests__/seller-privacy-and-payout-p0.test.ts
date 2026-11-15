import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { sellerService } from "../seller-service";
import { adminService } from "../admin-service";
import {
  PayoutStatus,
  OrderStatus,
  PaymentStatus,
  UserRole,
  DisputeStatus,
  ReturnRequestStatus,
} from "@prisma/client";

describe("P0 Security & Integrity: Seller Privacy and Vendor Payout Hardening", () => {
  const sellerId = "vnd_sol_textiles";
  let testCustomerId: string;
  let testOrderId: string;
  let testOrderItemId: string;
  let testPayoutId: string;
  let secondPayoutId: string;
  const uniqueUtr = `UTR-TEST-${Date.now()}`;

  beforeAll(async () => {
    const customerUser = await prisma.user.create({
      data: {
        email: `privacy_test_${Date.now()}@example.com`,
        passwordHash: "test_hash_secure",
        role: UserRole.CUSTOMER,
        profile: {
          create: {
            name: "Test Privacy Patron",
          },
        },
      },
    });
    testCustomerId = customerUser.id;

    const product = await prisma.product.findFirst({
      where: { vendorId: sellerId },
    });

    if (!product) {
      throw new Error(`Product not found for seller ${sellerId}`);
    }

    testOrderId = `ord_priv_p0_${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        id: testOrderId,
        customerId: testCustomerId,
        customerName: "Test Privacy Patron",
        customerEmail: customerUser.email,
        shippingAddressSnapshot: JSON.stringify({
          fullName: "Test Privacy Patron",
          phone: "+91 99999 88888",
          street: "123 Artisan Way",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
          country: "India",
        }),
        deliveryMethodId: "standard",
        deliveryMethodName: "Standard Express Courier",
        deliveryEstimatedDays: 3,
        shippingFeePaise: 0,
        estimatedTaxPaise: 180000,
        subtotalPaise: 1000000,
        totalPaise: 1180000,
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.CAPTURED,
        estimatedDeliveryDate: new Date(Date.now() + 3 * 86400000),
        items: {
          create: [
            {
              title: product.title,
              productSlug: product.slug,
              vendorId: sellerId,
              vendorName: "Solstice Textiles",
              selectedSku: "TEST-SKU-01",
              unitPricePaise: 1000000,
              quantity: 1,
              lineTotalPaise: 1000000,
              imageSnapshot: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
              fulfillmentStatus: "PACKED",
              productId: product.id,
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });

    testOrderItemId = order.items[0].id;

    const payout = await prisma.vendorPayout.create({
      data: {
        sellerId: sellerId,
        orderItemId: testOrderItemId,
        grossAmountPaise: 1000000,
        commissionPaise: 100000,
        netPayoutPaise: 900000,
        status: PayoutStatus.ESCROW_HOLD,
      },
    });
    testPayoutId = payout.id;

    const secondPayout = await prisma.vendorPayout.create({
      data: {
        sellerId: sellerId,
        orderItemId: testOrderItemId,
        grossAmountPaise: 500000,
        commissionPaise: 50000,
        netPayoutPaise: 450000,
        status: PayoutStatus.ELIGIBLE_FOR_PAYOUT,
      },
    });
    secondPayoutId = secondPayout.id;
  });

  afterAll(async () => {
    try {
      if (testOrderId) {
        await prisma.disputeCase.deleteMany({ where: { orderId: testOrderId } });
        if (testOrderItemId) {
          await prisma.returnRequest.deleteMany({ where: { orderItemId: testOrderItemId } });
          await prisma.vendorPayout.deleteMany({ where: { orderItemId: testOrderItemId } });
        }
        await prisma.orderItem.deleteMany({ where: { orderId: testOrderId } });
        await prisma.order.deleteMany({ where: { id: testOrderId } });
      }
      if (testCustomerId) {
        await prisma.customerProfile.deleteMany({ where: { userId: testCustomerId } });
        await prisma.user.deleteMany({ where: { id: testCustomerId } });
      }
    } catch (err) {
      console.error("Cleanup error in afterAll:", err);
    }
  });

  describe("P0: Customer Privacy Leakage Prevention", () => {
    it("never exposes customerEmail in seller order line retrieval", async () => {
      const result = await sellerService.getOrderLines(sellerId);
      expect(result.orderLines.length).toBeGreaterThan(0);

      const targetLine = result.orderLines.find((l) => l.orderId === testOrderId);
      expect(targetLine).toBeDefined();

      expect((targetLine as any)?.customerEmail).toBeUndefined();
      expect("customerEmail" in (targetLine || {})).toBe(false);

      expect(targetLine?.customerName).toBe("Test Privacy Patron");
      expect(targetLine?.shippingAddress).toBeDefined();
      expect(targetLine?.shippingAddress?.street).toBe("123 Artisan Way");
      expect(targetLine?.shippingAddress?.city).toBe("Jaipur");
    });

    it("never exposes customerEmail in updateFulfillmentStatus response", async () => {
      const updateRes = await sellerService.updateFulfillmentStatus(
        sellerId,
        testOrderItemId,
        "SHIPPED",
        {
          courierName: "Delhivery Logistics",
          trackingNumber: "DLH-9988776655",
        }
      );

      expect(updateRes.success).toBe(true);
      expect(updateRes.orderLine).toBeDefined();
      expect((updateRes.orderLine as any)?.customerEmail).toBeUndefined();
      expect("customerEmail" in (updateRes.orderLine || {})).toBe(false);
    });
  });

  describe("P0: Payout Escrow Preservation on Shipment", () => {
    it("keeps vendor payout in ESCROW_HOLD when order item is marked SHIPPED", async () => {
      const payout = await prisma.vendorPayout.findUnique({
        where: { id: testPayoutId },
      });

      expect(payout).toBeDefined();
      expect(payout?.status).toBe(PayoutStatus.ESCROW_HOLD);
    });
  });

  describe("P0: Payout Settlement Hardening & Gatekeeping", () => {
    it("rejects payout settlement if payout status is ESCROW_HOLD", async () => {
      const settleRes = await adminService.settlePayout(
        testPayoutId,
        { transactionRef: "UTR-PREMATURE-01" },
        "usr_admin_01"
      );
      expect(settleRes.success).toBe(false);
      expect(settleRes.error).toContain("Funds are held in escrow");

      const payout = await prisma.vendorPayout.findUnique({ where: { id: testPayoutId } });
      expect(payout?.status).toBe(PayoutStatus.ESCROW_HOLD);
    });

    it("rejects payout settlement and withholds funds if order has an active dispute", async () => {
      await prisma.vendorPayout.update({
        where: { id: testPayoutId },
        data: { status: PayoutStatus.ELIGIBLE_FOR_PAYOUT },
      });

      const disputeId = `dsp_test_${Date.now()}`;
      const dispute = await prisma.disputeCase.create({
        data: {
          id: disputeId,
          orderId: testOrderId,
          customerId: testCustomerId,
          sellerId: sellerId,
          reason: "Damaged packaging complaint received",
          status: DisputeStatus.OPEN,
        },
      });

      const settleRes = await adminService.settlePayout(
        testPayoutId,
        { transactionRef: "UTR-DISPUTE-01" },
        "usr_admin_01"
      );
      expect(settleRes.success).toBe(false);
      expect(settleRes.error).toContain("Cannot settle payout: Order has an active dispute");

      const payout = await prisma.vendorPayout.findUnique({ where: { id: testPayoutId } });
      expect(payout?.status).toBe(PayoutStatus.WITHHELD);

      await prisma.disputeCase.delete({ where: { id: dispute.id } });
    });

    it("rejects payout settlement and withholds funds if order item has an active return request", async () => {
      await prisma.vendorPayout.update({
        where: { id: testPayoutId },
        data: { status: PayoutStatus.ELIGIBLE_FOR_PAYOUT },
      });

      const returnReq = await prisma.returnRequest.create({
        data: {
          orderId: testOrderId,
          orderItemId: testOrderItemId,
          customerId: testCustomerId,
          reason: "Fabric flaw observed",
          status: ReturnRequestStatus.REQUESTED,
        },
      });

      const settleRes = await adminService.settlePayout(
        testPayoutId,
        { transactionRef: "UTR-RETURN-01" },
        "usr_admin_01"
      );
      expect(settleRes.success).toBe(false);
      expect(settleRes.error).toContain("Cannot settle payout: Line item has an active return request");

      const payout = await prisma.vendorPayout.findUnique({ where: { id: testPayoutId } });
      expect(payout?.status).toBe(PayoutStatus.WITHHELD);

      await prisma.returnRequest.delete({ where: { id: returnReq.id } });
    });

    it("successfully settles an eligible payout and records manual ledger UTR", async () => {
      await prisma.vendorPayout.update({
        where: { id: testPayoutId },
        data: { status: PayoutStatus.ELIGIBLE_FOR_PAYOUT },
      });

      const settleRes = await adminService.settlePayout(
        testPayoutId,
        { transactionRef: uniqueUtr },
        "usr_admin_01"
      );
      expect(settleRes.success).toBe(true);

      const payout = await prisma.vendorPayout.findUnique({ where: { id: testPayoutId } });
      expect(payout?.status).toBe(PayoutStatus.SETTLED);
      expect(payout?.transactionRef).toBe(uniqueUtr);
      expect(payout?.settledAt).not.toBeNull();
    });

    it("rejects duplicate transaction UTRs across settled payouts", async () => {
      const dupRes = await adminService.settlePayout(
        secondPayoutId,
        { transactionRef: uniqueUtr },
        "usr_admin_01"
      );
      expect(dupRes.success).toBe(false);
      expect(dupRes.error).toContain(`Duplicate transaction reference: Banking UTR "${uniqueUtr}"`);

      const secondPayout = await prisma.vendorPayout.findUnique({ where: { id: secondPayoutId } });
      expect(secondPayout?.status).toBe(PayoutStatus.ELIGIBLE_FOR_PAYOUT);
    });
  });
});
