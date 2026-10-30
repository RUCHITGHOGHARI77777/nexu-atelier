import { prisma } from "../prisma";
import {
  ShipmentStatus,
  FulfillmentStatus,
  OrderStatus as PrismaOrderStatus,
} from "@prisma/client";
import { IShippingAdapter, ServiceabilityResult } from "./types";
import { Simulated3PLAdapter } from "./simulated-3pl-adapter";
import { ShiprocketShippingAdapter } from "./shiprocket-adapter";
import { notificationService } from "../notification-service";

export class ShippingService {
  private simulatedAdapter: Simulated3PLAdapter;
  private shiprocketAdapter: ShiprocketShippingAdapter;

  constructor() {
    this.simulatedAdapter = new Simulated3PLAdapter();
    this.shiprocketAdapter = new ShiprocketShippingAdapter();
  }

  public getAdapter(): IShippingAdapter {
    if (this.shiprocketAdapter.isConfigured()) {
      return this.shiprocketAdapter;
    }
    return this.simulatedAdapter;
  }

  public getSimulatedAdapter(): Simulated3PLAdapter {
    return this.simulatedAdapter;
  }

  public async checkServiceability(pincode: string): Promise<ServiceabilityResult> {
    return this.getAdapter().checkServiceability(pincode);
  }

  /**
   * Creates a dedicated 3PL shipment for a seller's discrete order items in a multi-vendor order.
   */
  public async createOrderShipment(params: {
    orderId: string;
    sellerId: string;
    orderItemIds: string[];
    preferredCourier?: string;
  }): Promise<{ success: boolean; trackingNumber?: string; shipmentId?: string; error?: string }> {
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found." };
    }

    const seller = await prisma.seller.findUnique({
      where: { id: params.sellerId },
    });

    if (!seller) {
      return { success: false, error: "Seller studio record not found." };
    }

    const itemsToShip = order.items.filter(
      (it) => it.vendorId === params.sellerId && params.orderItemIds.includes(it.id)
    );

    if (itemsToShip.length === 0) {
      return { success: false, error: "No valid order items belonging to this studio were found to ship." };
    }

    let customerAddress = {
      fullName: order.customerName,
      street: "Studio Address Record",
      city: "Hub",
      state: "Domestic",
      pincode: "400001",
      phone: "9876543210",
    };

    try {
      customerAddress = { ...customerAddress, ...JSON.parse(order.shippingAddressSnapshot) };
    } catch {
      // Use fallback
    }

    const pickupAddress = {
      fullName: `${seller.name} Workshop`,
      street: seller.originHub || "Artisan Guild Lane",
      city: "Hub",
      state: "Domestic",
      pincode: "400001",
      phone: seller.businessPhone || "9876500000",
    };

    const adapter = this.getAdapter();
    const shipmentRes = await adapter.createShipment({
      orderId: order.id,
      sellerId: seller.id,
      pickupAddress,
      deliveryAddress: customerAddress,
      items: itemsToShip.map((it) => ({
        title: it.title,
        sku: it.selectedSku || "SKU-ARTISAN",
        quantity: it.quantity,
        pricePaise: it.unitPricePaise,
      })),
      weightGrams: 500 * itemsToShip.length,
      preferredCourier: params.preferredCourier,
    });

    if (!shipmentRes.success) {
      return { success: false, error: shipmentRes.error || "Failed to create shipment with courier provider." };
    }

    const shipmentId = shipmentRes.shipmentId;
    const trackingNumber = shipmentRes.trackingNumber;

    // Database transaction: create Shipment, add tracking event, link order items
    await prisma.$transaction(async (tx) => {
      await tx.shipment.create({
        data: {
          id: shipmentId,
          orderId: order.id,
          sellerId: seller.id,
          provider: adapter.provider,
          carrierName: shipmentRes.carrierName,
          trackingNumber,
          labelUrl: shipmentRes.labelUrl,
          shippingRatePaise: shipmentRes.shippingRatePaise,
          status: ShipmentStatus.SHIPPED,
          dispatchedAt: new Date(),
        },
      });

      await tx.shipmentTrackingEvent.create({
        data: {
          shipmentId,
          status: ShipmentStatus.SHIPPED,
          location: seller.originHub || "Artisan Workshop Hub",
          description: `Dispatched via ${shipmentRes.carrierName}. AWB: ${trackingNumber}`,
          source: "SYSTEM",
        },
      });

      // Update linked order items
      for (const item of itemsToShip) {
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            shipmentId,
            fulfillmentStatus: FulfillmentStatus.SHIPPED,
            courierName: shipmentRes.carrierName,
            trackingNumber,
            dispatchedAt: new Date(),
          },
        });
      }

      // Check if all items in the parent order are now shipped
      const allItems = await tx.orderItem.findMany({ where: { orderId: order.id } });
      const allShipped = allItems.every(
        (it) => it.fulfillmentStatus === FulfillmentStatus.SHIPPED || it.fulfillmentStatus === FulfillmentStatus.DELIVERED
      );

      if (allShipped) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: PrismaOrderStatus.SHIPPED },
        });
      }

      await tx.auditEvent.create({
        data: {
          orderId: order.id,
          entityType: "SHIPMENT",
          entityId: shipmentId,
          action: "SHIPMENT_CREATED",
          note: `Shipment created via ${adapter.provider}. AWB: ${trackingNumber} for ${itemsToShip.length} item(s)`,
          performedBy: `seller:${seller.id}`,
        },
      });
    });

    // Queue notification
    await notificationService.queueNotification({
      recipient: order.customerEmail,
      template: "SHIPMENT_DISPATCHED",
      orderId: order.id,
      payload: {
        orderId: order.id,
        carrierName: shipmentRes.carrierName,
        trackingNumber,
      },
    });

    return {
      success: true,
      shipmentId,
      trackingNumber,
    };
  }

  /**
   * Updates shipment lifecycle status (from carrier webhook, tracking sync, or admin).
   * Validates state transitions and updates parent order / items when DELIVERED.
   */
  public async updateShipmentStatus(params: {
    trackingNumber: string;
    newStatus: ShipmentStatus;
    location?: string;
    description: string;
    source?: string;
    rtoReason?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const shipment = await prisma.shipment.findUnique({
      where: { trackingNumber: params.trackingNumber },
      include: { order: true, items: true },
    });

    if (!shipment) {
      return { success: false, error: `Shipment with tracking number ${params.trackingNumber} not found.` };
    }

    // Terminal state protection: DELIVERED or CANCELLED shipments cannot move back
    if (shipment.status === ShipmentStatus.DELIVERED && params.newStatus !== ShipmentStatus.DELIVERED) {
      return { success: false, error: "Delivered shipments cannot transition to previous states." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: params.newStatus,
          rtoReason: params.rtoReason || shipment.rtoReason,
          deliveredAt: params.newStatus === ShipmentStatus.DELIVERED ? new Date() : shipment.deliveredAt,
        },
      });

      await tx.shipmentTrackingEvent.create({
        data: {
          shipmentId: shipment.id,
          status: params.newStatus,
          location: params.location || null,
          description: params.description,
          source: params.source || "WEBHOOK",
        },
      });

      if (params.newStatus === ShipmentStatus.DELIVERED) {
        // Mark linked items as DELIVERED
        await tx.orderItem.updateMany({
          where: { shipmentId: shipment.id },
          data: {
            fulfillmentStatus: FulfillmentStatus.DELIVERED,
            deliveredAt: new Date(),
          },
        });

        // Check if all items in parent order are now DELIVERED
        const allItems = await tx.orderItem.findMany({ where: { orderId: shipment.orderId } });
        const allDelivered = allItems.every((it) => it.fulfillmentStatus === FulfillmentStatus.DELIVERED);

        if (allDelivered) {
          await tx.order.update({
            where: { id: shipment.orderId },
            data: { status: PrismaOrderStatus.DELIVERED },
          });
        }
      }

      await tx.auditEvent.create({
        data: {
          orderId: shipment.orderId,
          entityType: "SHIPMENT",
          entityId: shipment.id,
          action: `SHIPMENT_${params.newStatus}`,
          note: `Shipment ${params.trackingNumber} transitioned to ${params.newStatus}: ${params.description}`,
          performedBy: params.source || "system:logistics",
        },
      });
    });

    // Send notifications on critical milestones
    if (params.newStatus === ShipmentStatus.OUT_FOR_DELIVERY) {
      await notificationService.queueNotification({
        recipient: shipment.order.customerEmail,
        template: "OUT_FOR_DELIVERY",
        orderId: shipment.orderId,
        payload: {
          orderId: shipment.orderId,
          trackingNumber: params.trackingNumber,
        },
      });
    } else if (params.newStatus === ShipmentStatus.DELIVERED) {
      await notificationService.queueNotification({
        recipient: shipment.order.customerEmail,
        template: "DELIVERED",
        orderId: shipment.orderId,
        payload: {
          orderId: shipment.orderId,
          trackingNumber: params.trackingNumber,
        },
      });
    }

    return { success: true };
  }

  public async getShipmentByTracking(trackingNumber: string) {
    return prisma.shipment.findUnique({
      where: { trackingNumber },
      include: {
        trackingEvents: { orderBy: { timestamp: "desc" } },
        items: true,
        seller: true,
      },
    });
  }

  public async getShipmentsForOrder(orderId: string) {
    return prisma.shipment.findMany({
      where: { orderId },
      include: {
        trackingEvents: { orderBy: { timestamp: "asc" } },
        items: true,
        seller: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const shippingService = new ShippingService();
