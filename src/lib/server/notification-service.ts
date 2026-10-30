import { prisma } from "./prisma";
import { NotificationStatus } from "@prisma/client";

export interface QueueNotificationParams {
  channel?: "EMAIL" | "SMS" | "IN_APP";
  recipient: string;
  template: string;
  payload: Record<string, any>;
  orderId?: string;
  idempotencyKey?: string;
}

export interface INotificationAdapter {
  send(params: { recipient: string; template: string; body: string; subject: string }): Promise<{ success: boolean; error?: string }>;
}

export class ConsoleNotificationAdapter implements INotificationAdapter {
  public async send(params: { recipient: string; template: string; body: string; subject: string }): Promise<{ success: boolean }> {
    // Development / test sink: records log safely without exposing secrets
    console.log(`[Notification Service] Template: ${params.template} -> To: ${params.recipient} | Subject: ${params.subject}`);
    return { success: true };
  }
}

export class NotificationService {
  private adapter: INotificationAdapter;

  constructor() {
    this.adapter = new ConsoleNotificationAdapter();
  }

  public setAdapter(adapter: INotificationAdapter) {
    this.adapter = adapter;
  }

  /**
   * Safely queues a transactional notification using the Outbox pattern.
   * If an idempotencyKey is provided, duplicate events are silently deduplicated.
   */
  public async queueNotification(params: QueueNotificationParams): Promise<{ queued: boolean; id?: string }> {
    const channel = params.channel || "EMAIL";
    const key = params.idempotencyKey || `${params.template}_${params.orderId || params.recipient}_${Date.now()}`;

    try {
      const existing = params.idempotencyKey
        ? await prisma.notificationEvent.findUnique({ where: { idempotencyKey: params.idempotencyKey } })
        : null;

      if (existing) {
        return { queued: false, id: existing.id };
      }

      const event = await prisma.notificationEvent.create({
        data: {
          channel,
          recipient: params.recipient,
          template: params.template,
          payloadJson: JSON.stringify(params.payload),
          status: NotificationStatus.QUEUED,
          orderId: params.orderId,
          idempotencyKey: key,
        },
      });

      // Attempt immediate dispatch asynchronously without blocking caller
      this.dispatchNotification(event.id).catch(() => {});

      return { queued: true, id: event.id };
    } catch {
      // Non-fatal: notification failures must never break the main business transaction
      return { queued: false };
    }
  }

  /**
   * Dispatches a queued notification with template rendering and attempt tracking.
   */
  public async dispatchNotification(eventId: string): Promise<boolean> {
    const event = await prisma.notificationEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || event.status === NotificationStatus.SENT) {
      return true;
    }

    let payload: Record<string, any> = {};
    try {
      payload = JSON.parse(event.payloadJson);
    } catch {
      payload = {};
    }

    const { subject, body } = this.renderTemplate(event.template, payload);

    try {
      const res = await this.adapter.send({
        recipient: event.recipient,
        template: event.template,
        subject,
        body,
      });

      if (res.success) {
        await prisma.notificationEvent.update({
          where: { id: eventId },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
            attempts: { increment: 1 },
          },
        });
        return true;
      } else {
        await prisma.notificationEvent.update({
          where: { id: eventId },
          data: {
            status: NotificationStatus.FAILED,
            attempts: { increment: 1 },
            lastError: res.error || "Provider send failed",
          },
        });
        return false;
      }
    } catch (err: any) {
      await prisma.notificationEvent.update({
        where: { id: eventId },
        data: {
          status: NotificationStatus.FAILED,
          attempts: { increment: 1 },
          lastError: err.message || "Failed to dispatch notification",
        },
      });
      return false;
    }
  }

  private renderTemplate(template: string, payload: Record<string, any>): { subject: string; body: string } {
    switch (template) {
      case "ORDER_CONFIRMED":
        return {
          subject: `Order Confirmed — ${payload.orderId} | Nexu Atelier`,
          body: `Dear ${payload.customerName},\nYour order ${payload.orderId} of ₹${payload.totalINR} has been confirmed.\nEstimated Delivery: ${payload.estimatedDeliveryDate || "3 business days"}.`,
        };
      case "PAYMENT_VERIFIED":
        return {
          subject: `Payment Receipt for Order ${payload.orderId}`,
          body: `Your payment of ₹${payload.totalINR} (Ref: ${payload.transactionRef}) has been successfully verified.`,
        };
      case "PAYMENT_FAILED":
        return {
          subject: `Action Required: Payment Failed for Order ${payload.orderId}`,
          body: `We were unable to process your payment. Reason: ${payload.reason || "Gateway decline"}. Please retry checkout.`,
        };
      case "SHIPMENT_DISPATCHED":
        return {
          subject: `Parcel Dispatched: ${payload.carrierName} AWB ${payload.trackingNumber}`,
          body: `Your artisan order ${payload.orderId} has been dispatched via ${payload.carrierName}.\nTracking Number: ${payload.trackingNumber}.`,
        };
      case "OUT_FOR_DELIVERY":
        return {
          subject: `Out for Delivery: Order ${payload.orderId}`,
          body: `Your package with AWB ${payload.trackingNumber} is out for delivery today.`,
        };
      case "DELIVERED":
        return {
          subject: `Delivered: Your Nexu Atelier Parcel has arrived`,
          body: `Package with AWB ${payload.trackingNumber} has been delivered. Thank you for supporting master artisans!`,
        };
      case "REFUND_ISSUED":
        return {
          subject: `Refund Processed for Order ${payload.orderId}`,
          body: `A refund of ₹${payload.amountINR} has been issued. Reason: ${payload.reason || "Administrative resolution"}. Ref: ${payload.refundId}.`,
        };
      default:
        return {
          subject: `Notification: ${template}`,
          body: JSON.stringify(payload, null, 2),
        };
    }
  }

  /**
   * Retrieves pending/failed notifications for monitoring or admin retries.
   */
  public async getRecentNotifications(limit = 50) {
    return prisma.notificationEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

export const notificationService = new NotificationService();
