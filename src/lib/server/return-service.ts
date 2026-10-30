import { prisma } from "./prisma";
import { ReturnRequestStatus, ReturnType } from "@prisma/client";
import { createCustomerNotification } from "./customer-notification-service";

export interface CreateReturnInput {
  customerId: string;
  orderId: string;
  orderItemId: string;
  type: ReturnType;
  quantity: number;
  reason: string;
  explanation?: string;
  photos?: string[];
}

export const VALID_RETURN_STATUSES: ReturnRequestStatus[] = [
  "REQUESTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "PICKUP_PENDING",
  "PICKED_UP",
  "RECEIVED",
  "REFUND_PENDING",
  "REFUNDED",
  "REPLACEMENT_DISPATCHED",
  "CLOSED",
];

export async function createReturnRequest(input: CreateReturnInput) {
  // Validate order and ownership
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.customerId !== input.customerId) {
    throw new Error("Unauthorized to initiate return for this order");
  }

  const orderItem = order.items.find((item) => item.id === input.orderItemId);
  if (!orderItem) {
    throw new Error("Order item not found in specified order");
  }

  if (input.quantity <= 0 || input.quantity > orderItem.quantity) {
    throw new Error(`Invalid return quantity. Must be between 1 and ${orderItem.quantity}`);
  }

  // Check if a return request already exists for this order item
  const existingReturn = await prisma.returnRequest.findFirst({
    where: {
      orderItemId: input.orderItemId,
      status: { notIn: ["REJECTED", "CLOSED"] },
    },
  });

  if (existingReturn) {
    throw new Error("An active return or replacement request already exists for this item");
  }

  // Verify return policy window (order must be DELIVERED or confirmed within eligible window)
  // For commercial standard: 7-day return window from delivery date or creation date if delivered
  const orderDeliveryDate = orderItem.deliveredAt || order.updatedAt;
  const daysSinceDelivery = Math.floor(
    (Date.now() - new Date(orderDeliveryDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceDelivery > 14) {
    throw new Error("The return window for this item has expired (14 days)");
  }

  const returnRequest = await prisma.returnRequest.create({
    data: {
      customerId: input.customerId,
      orderId: input.orderId,
      orderItemId: input.orderItemId,
      type: input.type,
      quantity: input.quantity,
      reason: input.reason,
      explanation: input.explanation || null,
      photosJson: input.photos ? JSON.stringify(input.photos) : null,
      status: "REQUESTED",
    },
    include: {
      orderItem: true,
    },
  });

  // Create in-app notification for the customer
  await createCustomerNotification({
    customerId: input.customerId,
    title: `${input.type === "RETURN" ? "Return" : "Replacement"} Request Received`,
    body: `Your request for "${orderItem.title}" has been registered (ID: ${returnRequest.id.slice(0, 8)}). We are reviewing it.`,
    type: "RETURN",
    link: `/account/returns/${returnRequest.id}`,
    metadata: { returnRequestId: returnRequest.id, orderId: order.id },
  });

  return returnRequest;
}

export async function getCustomerReturnRequests(customerId: string) {
  const returns = await prisma.returnRequest.findMany({
    where: { customerId },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      },
      orderItem: {
        select: {
          id: true,
          title: true,
          productSlug: true,
          imageSnapshot: true,
          unitPricePaise: true,
          selectedSize: true,
          selectedColorName: true,
          vendorName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return returns.map((r) => ({
    ...r,
    photos: r.photosJson ? JSON.parse(r.photosJson) : [],
  }));
}

export async function getReturnRequestById(returnId: string, customerId?: string) {
  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          totalPaise: true,
          shippingAddressSnapshot: true,
        },
      },
      orderItem: {
        select: {
          id: true,
          title: true,
          productSlug: true,
          imageSnapshot: true,
          unitPricePaise: true,
          selectedSize: true,
          selectedColorName: true,
          vendorName: true,
        },
      },
    },
  });

  if (!returnRequest) return null;

  if (customerId && returnRequest.customerId !== customerId) {
    throw new Error("Unauthorized to access this return request");
  }

  return {
    ...returnRequest,
    photos: returnRequest.photosJson ? JSON.parse(returnRequest.photosJson) : [],
  };
}

export interface UpdateReturnStatusInput {
  returnId: string;
  status: ReturnRequestStatus;
  rejectionReason?: string;
  adminNotes?: string;
  trackingNumber?: string;
  courierName?: string;
  refundAmountPaise?: number;
  replacementItemId?: string;
}

export async function updateReturnRequestStatus(input: UpdateReturnStatusInput) {
  const existing = await prisma.returnRequest.findUnique({
    where: { id: input.returnId },
    include: { orderItem: true },
  });

  if (!existing) {
    throw new Error("Return request not found");
  }

  const updated = await prisma.returnRequest.update({
    where: { id: input.returnId },
    data: {
      status: input.status,
      rejectionReason: input.rejectionReason ?? existing.rejectionReason,
      adminNotes: input.adminNotes ?? existing.adminNotes,
      trackingNumber: input.trackingNumber ?? existing.trackingNumber,
      courierName: input.courierName ?? existing.courierName,
      refundAmountPaise: input.refundAmountPaise ?? existing.refundAmountPaise,
      replacementItemId: input.replacementItemId ?? existing.replacementItemId,
    },
  });

  // Notify customer of status change
  let statusText = input.status.replace(/_/g, " ");
  await createCustomerNotification({
    customerId: existing.customerId,
    title: `Return Status Update: ${statusText}`,
    body: `Your return request for "${existing.orderItem.title}" is now ${statusText}.`,
    type: "RETURN",
    link: `/account/returns/${existing.id}`,
    metadata: { returnRequestId: existing.id, status: input.status },
  });

  return updated;
}
