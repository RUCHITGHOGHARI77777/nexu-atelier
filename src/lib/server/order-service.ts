import {
  CheckoutRequestPayload,
  DeliveryMethod,
  Order,
  OrderItem,
  OrderStatus as FrontendOrderStatus,
  OrderTimelineEvent,
  OrderTotals,
} from "@/types/order";
import { prisma } from "./prisma";
import {
  OrderStatus as PrismaOrderStatus,
  PaymentStatus,
  PaymentProvider,
} from "@prisma/client";
import { addressRepository } from "./address-repository";
import { authService } from "./auth-service";
import { adminService } from "./admin-service";
import { notificationService } from "./notification-service";

export const DELIVERY_METHODS: Record<string, DeliveryMethod> = {
  standard: {
    id: "standard",
    name: "Studio Direct Standard Courier",
    description: "Eco-conscious ground delivery with carbon-neutral transit.",
    estimatedDays: 3,
    baseFee: 150,
  },
  express: {
    id: "express",
    name: "Priority Air Express",
    description: "Guaranteed next-flight courier dispatch with priority packing.",
    estimatedDays: 1,
    baseFee: 250,
  },
};

function toFrontendStatus(status: PrismaOrderStatus): FrontendOrderStatus {
  switch (status) {
    case PrismaOrderStatus.IN_PRODUCTION:
      return "in_production";
    case PrismaOrderStatus.SHIPPED:
      return "shipped";
    case PrismaOrderStatus.DELIVERED:
      return "delivered";
    case PrismaOrderStatus.CANCELLED:
      return "cancelled";
    default:
      return "confirmed";
  }
}

function toPrismaStatus(status: FrontendOrderStatus): PrismaOrderStatus {
  switch (status) {
    case "in_production":
      return PrismaOrderStatus.IN_PRODUCTION;
    case "shipped":
      return PrismaOrderStatus.SHIPPED;
    case "delivered":
      return PrismaOrderStatus.DELIVERED;
    case "cancelled":
      return PrismaOrderStatus.CANCELLED;
    default:
      return PrismaOrderStatus.CONFIRMED;
  }
}

// Convert a full Prisma Order record with its relations into the typed Order interface
function mapDbOrderToFrontend(dbOrder: any): Order {
  const items: OrderItem[] = dbOrder.items.map((i: any) => ({
    productId: i.productId || "",
    slug: i.productSlug,
    title: i.title,
    vendorId: i.vendorId,
    vendorName: i.vendorName,
    selectedColor: i.selectedColorName
      ? {
          name: i.selectedColorName,
          hex: i.selectedColorHex || "#000000",
          image: i.selectedColorImage || i.imageSnapshot,
        }
      : undefined,
    selectedSize: i.selectedSize || undefined,
    unitPrice: i.unitPricePaise / 100,
    quantity: i.quantity,
    lineTotal: i.lineTotalPaise / 100,
    image: i.imageSnapshot,
  }));

  let shippingAddress: any = null;
  try {
    shippingAddress = JSON.parse(dbOrder.shippingAddressSnapshot);
  } catch {
    shippingAddress = {
      fullName: dbOrder.customerName,
      street: "Studio Address Record",
      city: "Hub",
      state: "Domestic",
      pincode: "000000",
    };
  }

  const deliveryMethod: DeliveryMethod =
    DELIVERY_METHODS[dbOrder.deliveryMethodId] || {
      id: dbOrder.deliveryMethodId,
      name: dbOrder.deliveryMethodName,
      description: "Direct courier dispatch",
      estimatedDays: dbOrder.deliveryEstimatedDays,
      baseFee: dbOrder.shippingFeePaise / 100,
    };

  const totals: OrderTotals = {
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: dbOrder.subtotalPaise / 100,
    shippingFee: dbOrder.shippingFeePaise / 100,
    estimatedTax: dbOrder.estimatedTaxPaise / 100,
    discount: (dbOrder.discountPaise || 0) / 100,
    couponCode: dbOrder.couponCode || undefined,
    total: dbOrder.totalPaise / 100,
  };

  const timeline: OrderTimelineEvent[] = (dbOrder.auditEvents || []).map((e: any) => ({
    status: toFrontendStatus(
      e.action.includes("CONFIRM")
        ? PrismaOrderStatus.CONFIRMED
        : e.action.includes("PRODUCTION")
        ? PrismaOrderStatus.IN_PRODUCTION
        : e.action.includes("DISPATCH")
        ? PrismaOrderStatus.SHIPPED
        : e.action.includes("DELIVER")
        ? PrismaOrderStatus.DELIVERED
        : PrismaOrderStatus.CANCELLED
    ),
    timestamp: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
    note: e.note,
  }));

  if (timeline.length === 0) {
    timeline.push({
      status: toFrontendStatus(dbOrder.status),
      timestamp: dbOrder.createdAt instanceof Date ? dbOrder.createdAt.toISOString() : String(dbOrder.createdAt),
      note: "Order confirmed.",
    });
  }

  let paymentInfo: any = undefined;
  if (dbOrder.payments && dbOrder.payments.length > 0) {
    const p = dbOrder.payments[0];
    let meta: any = {};
    try {
      meta = JSON.parse(p.rawGatewayResponse || "{}");
    } catch {}
    paymentInfo = {
      method: meta.mode || (p.provider === "RAZORPAY" ? "UPI" : "COD"),
      provider: p.provider,
      transactionRef: p.transactionRef,
      bankRef: meta.bankRef || `UPI/2026/${p.transactionRef.replace(/[^0-9]/g, "").slice(-6) || "849201"}`,
      vpa: meta.vpa || "patron@okhdfcbank",
      status: p.status,
      amountPaise: p.amountPaise,
      authorizedAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
    };
  }

  return {
    id: dbOrder.id,
    customerId: dbOrder.customerId,
    customerEmail: dbOrder.customerEmail,
    customerName: dbOrder.customerName,
    items,
    shippingAddress,
    deliveryMethod,
    totals,
    status: toFrontendStatus(dbOrder.status),
    discount: (dbOrder.discountPaise || 0) / 100,
    couponCode: dbOrder.couponCode || undefined,
    refundedAmount: (dbOrder.refundedPaise || 0) / 100,
    createdAt: dbOrder.createdAt instanceof Date ? dbOrder.createdAt.toISOString() : String(dbOrder.createdAt),
    estimatedDeliveryDate:
      dbOrder.estimatedDeliveryDate instanceof Date
        ? dbOrder.estimatedDeliveryDate.toISOString()
        : String(dbOrder.estimatedDeliveryDate),
    timeline,
    shipments: (dbOrder.shipments || []).map((s: any) => ({
      id: s.id,
      trackingNumber: s.trackingNumber,
      carrier: s.carrierName || s.carrier || "Standard 3PL Express",
      status: s.status,
      shippedAt: s.shippedAt ? (s.shippedAt instanceof Date ? s.shippedAt.toISOString() : String(s.shippedAt)) : null,
      deliveredAt: s.deliveredAt ? (s.deliveredAt instanceof Date ? s.deliveredAt.toISOString() : String(s.deliveredAt)) : null,
      trackingEvents: (s.trackingEvents || []).map((ev: any) => ({
        status: ev.status,
        location: ev.location,
        timestamp: ev.timestamp instanceof Date ? ev.timestamp.toISOString() : String(ev.timestamp),
        note: ev.description || ev.note,
      })),
    })),
    paymentInfo,
    idempotencyKey: dbOrder.idempotencyKey || undefined,
  };
}

export interface IOrderService {
  createOrder(
    customerId: string,
    payload: CheckoutRequestPayload
  ): Promise<{ success: boolean; order?: Order; error?: string }>;
  getOrders(customerId: string): Promise<Order[]>;
  getOrderById(customerId: string, orderId: string): Promise<Order | null>;
  cancelOrder(
    customerId: string,
    orderId: string,
    reason?: string
  ): Promise<{ success: boolean; order?: Order; error?: string }>;
}

export class PrismaOrderService implements IOrderService {
  public async createOrder(
    customerId: string,
    payload: CheckoutRequestPayload
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    const customer = await authService.getUserById(customerId);
    if (!customer) {
      return { success: false, error: "Authenticated customer record not found." };
    }

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: "Cannot create order: shopping bag is empty." };
    }

    // Idempotency check: prevent duplicate submissions
    const idempotencyKey =
      payload.idempotencyKey ||
      `${customerId}_${JSON.stringify(payload.items.map((i) => i.productId + i.quantity))}`;

    try {
      const existing = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: {
          items: true,
          payments: true,
          auditEvents: { orderBy: { createdAt: "asc" } },
        },
      });

      if (existing) {
        return { success: true, order: mapDbOrderToFrontend(existing) };
      }
    } catch {
      // Continue if not found
    }

    // Resolve delivery address
    let shippingAddress = null;
    if (payload.shippingAddressId) {
      shippingAddress = await addressRepository.getAddressById(
        customerId,
        payload.shippingAddressId
      );
    } else if (payload.newAddress) {
      const added = await addressRepository.addAddress(customerId, payload.newAddress);
      if (!added.success || !added.address) {
        return { success: false, error: added.error || "Invalid shipping address." };
      }
      shippingAddress = added.address;
    } else {
      const addresses = await addressRepository.getAddresses(customerId);
      shippingAddress = addresses.find((a) => a.isDefault) || addresses[0];
    }

    if (!shippingAddress) {
      return {
        success: false,
        error: "Please provide or select a valid delivery address.",
      };
    }

    const deliveryMethod =
      DELIVERY_METHODS[payload.deliveryMethodId] || DELIVERY_METHODS.standard;

    // Database Transaction for Atomic Stock Validation & Order Creation
    try {
      const resultOrder = await prisma.$transaction(async (tx) => {
        let subtotalPaise = 0;
        const validatedItemsData: any[] = [];

        for (const itemReq of payload.items) {
          const product = await tx.product.findUnique({
            where: { id: itemReq.productId },
            include: {
              vendor: true,
              images: { orderBy: { sortOrder: "asc" } },
              variants: true,
            },
          });

          if (!product || !product.isPublished) {
            throw new Error(
              `Product with ID ${itemReq.productId} is no longer in the studio catalog.`
            );
          }

          if (product.stock <= 0) {
            throw new Error(`"${product.title}" is currently out of stock.`);
          }

          const qty = Math.max(1, Math.floor(itemReq.quantity || 1));
          if (qty > product.stock) {
            throw new Error(
              `Requested quantity for "${product.title}" exceeds available stock (${product.stock} available).`
            );
          }

          // Atomically decrement stock
          const decremented = await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: qty } },
          });

          if (decremented.stock < 0) {
            throw new Error(`Race condition: "${product.title}" ran out of stock.`);
          }

          // Resolve & Validate Variant details
          let selectedColorHex: string | undefined = undefined;
          let selectedColorImage: string | undefined = undefined;
          let selectedSku: string | undefined = undefined;

          let matchedVariant = null;
          if (itemReq.selectedSku) {
            matchedVariant = product.variants.find((v) => v.sku === itemReq.selectedSku);
          }
          if (!matchedVariant && itemReq.selectedSize) {
            matchedVariant = product.variants.find(
              (v) => v.variantType === "SIZE" && v.value.toLowerCase() === itemReq.selectedSize?.toLowerCase()
            );
          }
          if (!matchedVariant && itemReq.selectedColorName) {
            matchedVariant = product.variants.find(
              (v) => v.variantType === "COLOR" && v.value.toLowerCase() === itemReq.selectedColorName?.toLowerCase()
            );
          }

          if (matchedVariant) {
            if (matchedVariant.stock <= 0) {
              throw new Error(`Selected variant "${matchedVariant.name} (${matchedVariant.value})" of "${product.title}" is out of stock.`);
            }
            if (qty > matchedVariant.stock) {
              throw new Error(
                `Requested quantity for variant "${matchedVariant.name} (${matchedVariant.value})" exceeds available stock (${matchedVariant.stock} available).`
              );
            }
            const decrementedVariant = await tx.productVariant.update({
              where: { id: matchedVariant.id },
              data: { stock: { decrement: qty } },
            });
            if (decrementedVariant.stock < 0) {
              throw new Error(`Race condition: Variant "${matchedVariant.name}" ran out of stock.`);
            }
            selectedSku = matchedVariant.sku;
            if (matchedVariant.variantType === "COLOR") {
              selectedColorHex = matchedVariant.hexCode || undefined;
              selectedColorImage = matchedVariant.imageUrl || undefined;
            }
          } else if (itemReq.selectedColorName) {
            const variant = product.variants.find(
              (v) =>
                v.variantType === "COLOR" &&
                v.value.toLowerCase() === itemReq.selectedColorName?.toLowerCase()
            );
            if (variant) {
              selectedColorHex = variant.hexCode || undefined;
              selectedColorImage = variant.imageUrl || undefined;
              selectedSku = variant.sku;
            }
          }

          const lineTotalPaise = product.basePricePaise * qty;
          subtotalPaise += lineTotalPaise;

          validatedItemsData.push({
            productId: product.id,
            productSlug: product.slug,
            title: product.title,
            vendorId: product.vendor.id,
            vendorName: product.vendor.name,
            selectedSku,
            selectedColorName: itemReq.selectedColorName,
            selectedColorHex,
            selectedColorImage,
            selectedSize: itemReq.selectedSize,
            unitPricePaise: product.basePricePaise,
            quantity: qty,
            lineTotalPaise,
            imageSnapshot: selectedColorImage || product.images[0]?.url || "",
          });
        }

        // Delivery fee: standard is free above ₹2,500 (250,000 paise)
        let shippingFeePaise = deliveryMethod.baseFee * 100;
        if (deliveryMethod.id === "standard" && subtotalPaise >= 250000) {
          shippingFeePaise = 0;
        }

        let discountPaise = 0;
        let appliedCouponCode: string | null = null;

        if (payload.couponCode && payload.couponCode.trim()) {
          const couponRes = await adminService.validateAndApplyCoupon(
            payload.couponCode,
            subtotalPaise,
            customerId
          );
          if (couponRes.valid) {
            discountPaise = couponRes.discountPaise;
            appliedCouponCode = couponRes.coupon?.code || payload.couponCode.trim().toUpperCase();
          }
        }

        const estimatedTaxPaise = Math.round(subtotalPaise * 0.12);
        const totalPaise = Math.max(0, subtotalPaise + shippingFeePaise - discountPaise);

        const orderId = `ORD-2026-${Date.now().toString().slice(-5)}${Math.floor(1000 + Math.random() * 9000)}`;
        const deliveryEta = new Date(
          Date.now() + 1000 * 60 * 60 * 24 * deliveryMethod.estimatedDays
        );

        const isCOD = payload.paymentMethod === "COD";
        const paymentProvider = isCOD ? PaymentProvider.ESCROW_INTERNAL : PaymentProvider.RAZORPAY;
        const paymentStatus = isCOD ? PaymentStatus.ESCROW_HOLD : PaymentStatus.CAPTURED;
        const bankRef = payload.paymentDetails?.bankRef || `UPI/2026/${Math.floor(100000 + Math.random() * 900000)}`;
        const vpa = payload.paymentDetails?.vpa || "patron@okhdfcbank";
        const paymentMode = payload.paymentMethod || "UPI";

        const createdOrder = await tx.order.create({
          data: {
            id: orderId,
            customerId,
            customerEmail: customer.email,
            customerName: customer.name,
            shippingAddressSnapshot: JSON.stringify(shippingAddress),
            deliveryMethodId: deliveryMethod.id,
            deliveryMethodName: deliveryMethod.name,
            deliveryEstimatedDays: deliveryMethod.estimatedDays,
            shippingFeePaise,
            estimatedTaxPaise,
            subtotalPaise,
            discountPaise,
            couponCode: appliedCouponCode,
            totalPaise,
            status: PrismaOrderStatus.CONFIRMED,
            paymentStatus,
            idempotencyKey,
            estimatedDeliveryDate: deliveryEta,
            items: {
              create: validatedItemsData,
            },
            payments: {
              create: {
                transactionRef: `TXN-${paymentMode}-${orderId.replace("ORD-", "")}`,
                provider: paymentProvider,
                amountPaise: totalPaise,
                currency: "INR",
                status: paymentStatus,
                rawGatewayResponse: JSON.stringify({
                  mode: paymentMode,
                  bankRef,
                  vpa,
                  authorizedAt: new Date().toISOString(),
                  verified: true,
                  details: payload.paymentDetails || {},
                }),
              },
            },
            auditEvents: {
              create: [
                {
                  entityType: "ORDER",
                  entityId: orderId,
                  action: "ORDER_CONFIRMED",
                  note: `Order confirmed via ${paymentMode}. Authorized reference: ${bankRef}.`,
                  performedBy: "system:checkout",
                },
              ],
            },
          },
          include: {
            items: true,
            payments: true,
            shipments: {
              include: {
                trackingEvents: { orderBy: { timestamp: "desc" } },
              },
            },
            auditEvents: { orderBy: { createdAt: "asc" } },
          },
        });

        // Create initial courier shipment record with tracking for each vendor
        const uniqueVendorIds = Array.from(new Set(validatedItemsData.map((v) => v.vendorId).filter(Boolean)));
        for (const vId of uniqueVendorIds) {
          const sellerExists = await tx.seller.findUnique({ where: { id: vId } });
          if (sellerExists) {
            const trackingNo = `BLUEDART-${Math.floor(10000000 + Math.random() * 90000000)}IN`;
            const shipmentId = `shp_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
            await tx.shipment.create({
              data: {
                id: shipmentId,
                orderId,
                sellerId: vId,
                provider: "SIMULATED_3PL",
                carrierName: "Blue Dart Air Express",
                trackingNumber: trackingNo,
                status: "LABEL_CREATED",
                shippingRatePaise: shippingFeePaise,
                trackingEvents: {
                  create: [
                    {
                      status: "LABEL_CREATED",
                      location: "Seller Studio Dispatch Hub",
                      description: "Shipping label generated and package registered with Blue Dart Express.",
                      source: "SYSTEM",
                    },
                  ],
                },
              },
            });
          }
        }

        if (appliedCouponCode && discountPaise > 0) {
          const couponRecord = await tx.coupon.findUnique({ where: { code: appliedCouponCode } });
          if (couponRecord) {
            await tx.coupon.update({
              where: { id: couponRecord.id },
              data: { timesUsed: { increment: 1 } },
            });
            await tx.couponUsage.create({
              data: {
                couponId: couponRecord.id,
                userId: customerId,
                orderId: createdOrder.id,
                discountPaise,
              },
            });
          }
        }

        return createdOrder;
      });

      // Queue transactional notifications: Customer + Suppliers
      try {
        await notificationService.queueNotification({
          channel: "EMAIL",
          recipient: resultOrder.customerEmail,
          template: "ORDER_CONFIRMED",
          orderId: resultOrder.id,
          payload: {
            orderId: resultOrder.id,
            customerName: resultOrder.customerName,
            totalINR: (resultOrder.totalPaise / 100).toLocaleString("en-IN"),
            itemsCount: resultOrder.items.length,
            estimatedDeliveryDate: `${resultOrder.deliveryEstimatedDays} business days`,
          },
        });

        // Queue supplier order notifications for each unique vendor involved
        const supplierItemMap = new Map<string, { count: number; totalPaise: number }>();
        for (const item of resultOrder.items) {
          if (item.vendorId) {
            const current = supplierItemMap.get(item.vendorId) || { count: 0, totalPaise: 0 };
            current.count += item.quantity;
            current.totalPaise += item.lineTotalPaise || 0;
            supplierItemMap.set(item.vendorId, current);
          }
        }

        for (const [vendorId, data] of supplierItemMap.entries()) {
          const seller = await prisma.seller.findUnique({
            where: { id: vendorId },
            include: { user: true },
          });
          const recipientEmail = seller?.businessEmail || seller?.user?.email;
          if (recipientEmail) {
            await notificationService.queueNotification({
              channel: "EMAIL",
              recipient: recipientEmail,
              template: "SUPPLIER_NEW_ORDER",
              orderId: resultOrder.id,
              payload: {
                supplierName: seller.name || "Studio Master Artisan",
                orderId: resultOrder.id,
                itemsCount: data.count,
                totalPayoutINR: (data.totalPaise / 100).toLocaleString("en-IN"),
                dispatchDeadline: "Within 48 hours",
              },
            });
          }
        }
      } catch {}

      return { success: true, order: mapDbOrderToFrontend(resultOrder) };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to process order transaction.",
      };
    }
  }

  public async getOrders(customerId: string): Promise<Order[]> {
    const list = await prisma.order.findMany({
      where: { customerId },
      include: {
        items: true,
        payments: true,
        shipments: {
          include: {
            trackingEvents: { orderBy: { timestamp: "desc" } },
          },
        },
        auditEvents: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return list.map(mapDbOrderToFrontend);
  }

  public async getOrderById(customerId: string, orderId: string): Promise<Order | null> {
    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: {
        items: true,
        payments: true,
        shipments: {
          include: {
            trackingEvents: { orderBy: { timestamp: "desc" } },
          },
        },
        auditEvents: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) return null;
    return mapDbOrderToFrontend(order);
  }

  public async cancelOrder(
    customerId: string,
    orderId: string,
    reason?: string
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: { items: true },
    });

    if (!order) {
      return { success: false, error: "Order not found or access denied." };
    }

    if (order.status === PrismaOrderStatus.CANCELLED) {
      return { success: false, error: "This order is already cancelled." };
    }

    if (
      order.status === PrismaOrderStatus.SHIPPED ||
      order.status === PrismaOrderStatus.DELIVERED
    ) {
      return {
        success: false,
        error: `Order cannot be cancelled because it has already been ${
          order.status === PrismaOrderStatus.SHIPPED ? "dispatched" : "delivered"
        }. Please contact customer care for returns.`,
      };
    }

    // Atomic Cancellation and Restock Transaction
    try {
      const updated = await prisma.$transaction(async (tx) => {
        // Restock inventory for each item
        for (const item of order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
            if (item.selectedSku) {
              await tx.productVariant.updateMany({
                where: { sku: item.selectedSku },
                data: { stock: { increment: item.quantity } },
              });
            }
          }
        }

        // Update order status
        const cancelledOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            status: PrismaOrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.REFUNDED,
            auditEvents: {
              create: {
                entityType: "ORDER",
                entityId: orderId,
                action: "ORDER_CANCELLED",
                note: reason || "Cancelled by patron prior to studio dispatch.",
                performedBy: `customer:${customerId}`,
              },
            },
          },
          include: {
            items: true,
            payments: true,
            auditEvents: { orderBy: { createdAt: "asc" } },
          },
        });

        return cancelledOrder;
      });

      // Queue transactional cancellation notification
      try {
        await notificationService.queueNotification({
          channel: "EMAIL",
          recipient: updated.customerEmail,
          template: "ORDER_CANCELLED",
          orderId: updated.id,
          payload: {
            orderId: updated.id,
            customerName: updated.customerName,
            reason: reason || "Cancelled by patron prior to studio dispatch.",
          },
        });
      } catch {}

      return { success: true, order: mapDbOrderToFrontend(updated) };
    } catch {
      return { success: false, error: "Failed to execute order cancellation." };
    }
  }
}

export const orderService = new PrismaOrderService();
