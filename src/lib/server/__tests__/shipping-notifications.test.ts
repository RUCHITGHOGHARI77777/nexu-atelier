import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../prisma";
import { shippingService } from "../shipping/shipping-service";
import { notificationService } from "../notification-service";
import { reconciliationService } from "../reconciliation-service";
import { ShipmentStatus, NotificationStatus } from "@prisma/client";

describe("3PL Shipping Integration & Delivery Lifecycle", () => {
  const sellerId = "vnd_sol_textiles";
  let orderId: string;
  let orderItemId: string;

  beforeAll(async () => {
    // Find an order item belonging to Solstice Loom
    const item = await prisma.orderItem.findFirst({
      where: { vendorId: sellerId },
      include: { order: true },
    });

    if (item) {
      orderId = item.orderId;
      orderItemId = item.id;
    } else {
      const anyItem = await prisma.orderItem.findFirst();
      orderId = anyItem!.orderId;
      orderItemId = anyItem!.id;
    }
  });

  it("checks serviceability for 6-digit Indian PIN codes and rejects invalid formats", async () => {
    const valid = await shippingService.checkServiceability("400001"); // Mumbai
    expect(valid.serviceable).toBe(true);
    expect(valid.city).toBe("Mumbai");

    const invalid = await shippingService.checkServiceability("123");
    expect(invalid.serviceable).toBe(false);
  });

  it("calculates tiered 3PL shipping rate quotes based on parcel weight", async () => {
    const quotes = await shippingService.getSimulatedAdapter().calculateRates({
      pickupPincode: "400001",
      deliveryPincode: "560038",
      weightGrams: 800,
      cod: false,
      declaredValuePaise: 500000,
    });

    expect(quotes.length).toBeGreaterThanOrEqual(2);
    expect(quotes.some((q) => q.mode === "AIR")).toBe(true);
    expect(quotes.some((q) => q.mode === "SURFACE")).toBe(true);
  });

  it("creates a 3PL shipment for a seller's discrete order items, assigning an AWB and tracking events", async () => {
    const res = await shippingService.createOrderShipment({
      orderId,
      sellerId,
      orderItemIds: [orderItemId],
      preferredCourier: "Bluedart Air Express",
    });

    expect(res.success).toBe(true);
    expect(res.trackingNumber).toBeDefined();
    expect(res.shipmentId).toBeDefined();

    // Verify Shipment in database
    const shipment = await prisma.shipment.findUnique({
      where: { trackingNumber: res.trackingNumber },
      include: { trackingEvents: true },
    });
    expect(shipment).toBeDefined();
    expect(shipment?.status).toBe(ShipmentStatus.SHIPPED);
    expect(shipment?.trackingEvents.length).toBeGreaterThan(0);
  });

  it("progresses delivery lifecycle through tracking events up to DELIVERED and updates parent order", async () => {
    const trackingNumber = `BD-TEST-LIFECYCLE-${Date.now().toString().slice(-4)}`;

    // Create a standalone shipment for lifecycle testing
    await prisma.shipment.create({
      data: {
        id: `SHP-TEST-${Date.now().toString().slice(-4)}`,
        orderId,
        sellerId,
        carrierName: "Delhivery Surface Eco",
        trackingNumber,
        status: ShipmentStatus.SHIPPED,
      },
    });

    // 1. Advance to OUT_FOR_DELIVERY
    const outForDeliveryRes = await shippingService.updateShipmentStatus({
      trackingNumber,
      newStatus: ShipmentStatus.OUT_FOR_DELIVERY,
      location: "Bengaluru Delivery Branch",
      description: "Package is out for delivery with courier associate.",
    });
    expect(outForDeliveryRes.success).toBe(true);

    const midShipment = await prisma.shipment.findUnique({ where: { trackingNumber } });
    expect(midShipment?.status).toBe(ShipmentStatus.OUT_FOR_DELIVERY);

    // 2. Advance to DELIVERED
    const deliveredRes = await shippingService.updateShipmentStatus({
      trackingNumber,
      newStatus: ShipmentStatus.DELIVERED,
      location: "Patron Residence, Indiranagar",
      description: "Delivered to recipient.",
    });
    expect(deliveredRes.success).toBe(true);

    const deliveredShipment = await prisma.shipment.findUnique({ where: { trackingNumber } });
    expect(deliveredShipment?.status).toBe(ShipmentStatus.DELIVERED);
    expect(deliveredShipment?.deliveredAt).not.toBeNull();

    // 3. Terminal state protection: DELIVERED cannot transition back to IN_TRANSIT
    const invalidBackjump = await shippingService.updateShipmentStatus({
      trackingNumber,
      newStatus: ShipmentStatus.IN_TRANSIT,
      description: "Attempted backwards transition",
    });
    expect(invalidBackjump.success).toBe(false);
    expect(invalidBackjump.error).toContain("cannot transition to previous states");
  });

  it("handles courier delivery failure and records Return-To-Origin (RTO) with audit explanation", async () => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const rtoTrackingNumber = `BD-RTO-TEST-${uniqueSuffix}`;

    await prisma.shipment.create({
      data: {
        id: `SHP-RTO-${uniqueSuffix}`,
        orderId,
        sellerId,
        carrierName: "Bluedart Air Express",
        trackingNumber: rtoTrackingNumber,
        status: ShipmentStatus.OUT_FOR_DELIVERY,
      },
    });

    const rtoRes = await shippingService.updateShipmentStatus({
      trackingNumber: rtoTrackingNumber,
      newStatus: ShipmentStatus.RTO_INITIATED,
      location: "Local Delivery Hub",
      description: "Customer unavailable after 3 attempts. Return to origin initiated.",
      rtoReason: "Consignee premises locked",
    });

    expect(rtoRes.success).toBe(true);

    const rtoShipment = await prisma.shipment.findUnique({ where: { trackingNumber: rtoTrackingNumber } });
    expect(rtoShipment?.status).toBe(ShipmentStatus.RTO_INITIATED);
    expect(rtoShipment?.rtoReason).toBe("Consignee premises locked");
  });
});

describe("Transactional Notification Outbox & Event Deduplication", () => {
  it("queues notification in database using Outbox pattern and deduplicates identical events", async () => {
    const uniqueKey = `NOTIF_DEDUP_TEST_${Date.now()}`;

    // 1. Queue first notification
    const first = await notificationService.queueNotification({
      recipient: "patron@nexu.studio",
      template: "ORDER_CONFIRMED",
      orderId: "ORD-TEST-999",
      payload: {
        orderId: "ORD-TEST-999",
        customerName: "Aarav Mehta",
        totalINR: 4500,
      },
      idempotencyKey: uniqueKey,
    });

    expect(first.queued).toBe(true);
    expect(first.id).toBeDefined();

    // 2. Queue duplicate with same idempotency key
    const duplicate = await notificationService.queueNotification({
      recipient: "patron@nexu.studio",
      template: "ORDER_CONFIRMED",
      orderId: "ORD-TEST-999",
      payload: {
        orderId: "ORD-TEST-999",
        customerName: "Aarav Mehta",
        totalINR: 4500,
      },
      idempotencyKey: uniqueKey,
    });

    expect(duplicate.queued).toBe(false);
    expect(duplicate.id).toBe(first.id);

    // Verify NotificationEvent in database
    const saved = await prisma.notificationEvent.findUnique({ where: { idempotencyKey: uniqueKey } });
    expect(saved).toBeDefined();
    expect(saved?.template).toBe("ORDER_CONFIRMED");
  });

  it("dispatches queued notification and updates status to SENT with incremented attempts", async () => {
    const event = await prisma.notificationEvent.create({
      data: {
        recipient: "patron@nexu.studio",
        template: "SHIPMENT_DISPATCHED",
        payloadJson: JSON.stringify({
          orderId: "ORD-2026-DISPATCH",
          carrierName: "Bluedart Air",
          trackingNumber: "BD-998822IN",
        }),
        status: NotificationStatus.QUEUED,
      },
    });

    const dispatched = await notificationService.dispatchNotification(event.id);
    expect(dispatched).toBe(true);

    const updated = await prisma.notificationEvent.findUnique({ where: { id: event.id } });
    expect(updated?.status).toBe(NotificationStatus.SENT);
    expect(updated?.attempts).toBe(1);
    expect(updated?.sentAt).not.toBeNull();
  });
});

describe("Financial Ledger Reconciliation Audit", () => {
  const adminId = "usr_admin_01";

  it("executes automated ledger reconciliation across orders, payments, and refunds without data corruption", async () => {
    const report = await reconciliationService.runReconciliation({
      provider: "RAZORPAY",
      adminUserId: adminId,
    });

    expect(report.id).toBeDefined();
    expect(report.totalOrders).toBeGreaterThan(0);
    expect(report.totalInternalGMVPaise).toBeGreaterThan(0);
    expect(report.totalCapturedPaise).toBeGreaterThanOrEqual(0);
    expect(report.status).toMatch(/BALANCED|DISCREPANCY_DETECTED/);

    // Verify audit record was created in database
    const history = await reconciliationService.getReconciliationHistory();
    expect(history.length).toBeGreaterThan(0);
  });
});
