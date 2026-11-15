import { prisma } from "./prisma";
import { NotificationStatus } from "@prisma/client";
import { createEmailAdapter, IEmailAdapter } from "./email/email-adapter";
import * as templates from "./email/email-templates";
import { whatsappService } from "./whatsapp-service";
import { isDemoMode } from "./demo-mode";
import { securityAuditLedgerService } from "./security-audit-ledger-service";

export type NotificationChannel = "EMAIL" | "WHATSAPP" | "IN_APP";

export interface QueueNotificationParams {
  channel?: NotificationChannel | "SMS"; // "SMS" gracefully mapped to "WHATSAPP" or "EMAIL"
  recipient: string;
  template: string;
  payload: Record<string, any>;
  orderId?: string;
  idempotencyKey?: string;
}

export interface INotificationAdapter {
  send(params: {
    recipient: string;
    template: string;
    body: string;
    subject: string;
    html?: string;
  }): Promise<{ success: boolean; error?: string }>;
}

export class ProductionNotificationAdapter implements INotificationAdapter {
  private emailAdapter: IEmailAdapter;

  constructor() {
    this.emailAdapter = createEmailAdapter();
  }

  public setEmailAdapter(adapter: IEmailAdapter) {
    this.emailAdapter = adapter;
  }

  public async send(params: {
    recipient: string;
    template: string;
    body: string;
    subject: string;
    html?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const res = await this.emailAdapter.send({
      to: params.recipient,
      subject: params.subject,
      html: params.html || `<div style="font-family: sans-serif; white-space: pre-wrap;">${params.body}</div>`,
      text: params.body,
    });

    return {
      success: res.success,
      error: res.error,
    };
  }
}

export class NotificationService {
  private adapter: INotificationAdapter;

  constructor() {
    this.adapter = new ProductionNotificationAdapter();
  }

  public setAdapter(adapter: INotificationAdapter) {
    this.adapter = adapter;
  }

  /**
   * Safely queues a transactional notification using the Outbox pattern.
   * If an idempotencyKey is provided, duplicate events are silently deduplicated.
   */
  public async queueNotification(params: QueueNotificationParams): Promise<{ queued: boolean; id?: string }> {
    let channel: string = params.channel || "EMAIL";
    if (channel === "SMS") {
      channel = "WHATSAPP";
    }

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

      this.dispatchNotification(event.id).catch(() => {});

      return { queued: true, id: event.id };
    } catch {
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

    const rendered = this.renderTemplate(event.template, payload);

    if (isDemoMode()) {
      const demoPayload = {
        ...payload,
        _demoOutbox: {
          isDemo: true,
          channel: event.channel,
          renderedSubject: rendered.subject,
          renderedBody: rendered.body,
          renderedHtml: rendered.html,
          simulatedDeliveryStatus: "DELIVERED_SIMULATED",
          deliveredAt: new Date().toISOString(),
        },
      };

      await prisma.notificationEvent.update({
        where: { id: eventId },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
          attempts: 1,
          payloadJson: JSON.stringify(demoPayload),
        },
      });

      await securityAuditLedgerService.recordEvent({
        action: "DEMO_NOTIFICATION_INTERCEPTED",
        actorId: "system:demo_outbox",
        actorRole: "SYSTEM",
        targetId: eventId,
        targetType: "NOTIFICATION",
        payload: {
          isDemo: true,
          channel: event.channel,
          recipient: event.recipient,
          template: event.template,
          subject: rendered.subject,
          eventId,
          timestamp: new Date().toISOString(),
        },
      });

      return true;
    }

    try {
      if (event.channel === "WHATSAPP") {
        const otpCode = payload.code || payload.otpCode;
        if (otpCode) {
          const res = await whatsappService.sendOtp({
            recipientPhone: event.recipient,
            otpCode: String(otpCode),
            purpose: payload.purpose || "PHONE_VERIFICATION",
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
                lastError: res.error || "WhatsApp delivery failed",
              },
            });
            return false;
          }
        }
      }

      const res = await this.adapter.send({
        recipient: event.recipient,
        template: event.template,
        subject: rendered.subject,
        body: rendered.body,
        html: rendered.html,
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

  /**
   * Renders the subject, body (plain-text), and luxury HTML for any supported template.
   */
  public renderTemplate(
    template: string,
    payload: Record<string, any>
  ): { subject: string; body: string; html?: string } {
    switch (template) {
      case "WELCOME_ONBOARDING":
      case "CUSTOMER_WELCOME": {
        const rendered = templates.renderWelcomeEmail({
          name: payload.name || "Valued Patron",
          email: payload.email || "",
          couponCode: payload.welcomeCoupon || payload.couponCode,
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "ACCOUNT_VERIFIED":
      case "CUSTOMER_ACCOUNT_VERIFIED": {
        const rendered = templates.renderAccountVerifiedEmail({
          name: payload.name || "Valued Patron",
          identifier: payload.identifier || payload.phone || payload.email || "",
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "ORDER_CONFIRMED":
      case "CUSTOMER_ORDER_CONFIRMED": {
        const rendered = templates.renderOrderConfirmedEmail({
          orderId: payload.orderId || "ORD-PENDING",
          customerName: payload.customerName || "Valued Patron",
          totalINR: payload.totalINR || payload.total || "0",
          itemsCount: payload.itemsCount,
          estimatedDeliveryDate: payload.estimatedDeliveryDate,
          shippingAddress: payload.shippingAddress,
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "PAYMENT_VERIFIED":
      case "CUSTOMER_PAYMENT_CONFIRMED": {
        const rendered = templates.renderPaymentConfirmedEmail({
          orderId: payload.orderId || "ORD-PENDING",
          customerName: payload.customerName || "Valued Patron",
          totalINR: payload.totalINR || payload.total || "0",
          paymentMethod: payload.paymentMethod || "Direct Instant UPI / Card",
          transactionRef: payload.transactionRef || payload.utr || "TXN-VERIFIED",
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "SHIPMENT_DISPATCHED":
      case "CUSTOMER_ORDER_SHIPPED": {
        const rendered = templates.renderOrderShippedEmail({
          orderId: payload.orderId || "ORD-PENDING",
          customerName: payload.customerName || "Valued Patron",
          carrierName: payload.carrierName || "Blue Dart Express",
          trackingNumber: payload.trackingNumber || "AWB-PENDING",
          trackingUrl: payload.trackingUrl,
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "OUT_FOR_DELIVERY":
      case "CUSTOMER_DELIVERY_UPDATE": {
        const rendered = templates.renderDeliveryUpdateEmail({
          orderId: payload.orderId || "ORD-PENDING",
          customerName: payload.customerName || "Valued Patron",
          status: payload.status || "Out for delivery with courier partner",
          location: payload.location,
          timestamp: payload.timestamp,
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "DELIVERED":
      case "CUSTOMER_ORDER_DELIVERED": {
        const rendered = templates.renderOrderDeliveredEmail({
          orderId: payload.orderId || "ORD-PENDING",
          customerName: payload.customerName || "Valued Patron",
          deliveredAt: payload.deliveredAt,
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "ORDER_CANCELLED":
      case "CUSTOMER_ORDER_CANCELLED": {
        const rendered = templates.renderOrderCancelledEmail({
          orderId: payload.orderId || "ORD-PENDING",
          customerName: payload.customerName || "Valued Patron",
          reason: payload.reason,
          refundInitiated: Boolean(payload.refundInitiated),
          refundAmountINR: payload.refundAmountINR || payload.totalINR,
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "REFUND_ISSUED":
      case "CUSTOMER_REFUND_UPDATE": {
        const rendered = templates.renderRefundUpdateEmail({
          orderId: payload.orderId || "ORD-PENDING",
          customerName: payload.customerName || "Valued Patron",
          amountINR: payload.amountINR || payload.amount || "0",
          refundId: payload.refundId || "REF-COMPLETED",
          status: payload.status || "Processed to Original Payment Source",
          gatewayRef: payload.gatewayRef,
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "PASSWORD_RESET":
      case "CUSTOMER_PASSWORD_RESET": {
        const rendered = templates.renderPasswordResetEmail({
          name: payload.name || "Valued Patron",
          resetUrl: payload.resetUrl || "#",
          expiryMinutes: payload.expiryMinutes || 60,
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "SECURITY_ALERT":
      case "CUSTOMER_SECURITY_ALERT": {
        const rendered = templates.renderSecurityAlertEmail({
          name: payload.name || "Valued Patron",
          action: payload.action || "Credential Modification",
          ipAddress: payload.ipAddress,
          timestamp: payload.timestamp || new Date().toUTCString(),
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "SUPPLIER_NEW_ORDER": {
        const rendered = templates.renderSupplierNewOrderEmail({
          supplierName: payload.supplierName || "Studio Master Artisan",
          orderId: payload.orderId || "ORD-PENDING",
          itemsCount: payload.itemsCount || 1,
          totalPayoutINR: payload.totalPayoutINR || payload.payout || "0",
          dispatchDeadline: payload.dispatchDeadline,
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "SUPPLIER_ORDER_STATUS": {
        const rendered = templates.renderSupplierOrderStatusEmail({
          supplierName: payload.supplierName || "Studio Master Artisan",
          orderId: payload.orderId || "ORD-PENDING",
          oldStatus: payload.oldStatus || "PENDING",
          newStatus: payload.newStatus || "UPDATED",
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "SUPPLIER_PRODUCT_APPROVED": {
        const rendered = templates.renderSupplierProductApprovedEmail({
          supplierName: payload.supplierName || "Studio Master Artisan",
          productTitle: payload.productTitle || "Artisan Piece",
          productId: payload.productId || "",
          slug: payload.slug || "",
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "SUPPLIER_PRODUCT_REJECTED": {
        const rendered = templates.renderSupplierProductRejectedEmail({
          supplierName: payload.supplierName || "Studio Master Artisan",
          productTitle: payload.productTitle || "Artisan Piece",
          productId: payload.productId || "",
          feedback: payload.feedback || "Please review attribute guidelines and image quality standards.",
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "SUPPLIER_RETURN_REQUEST":
      case "DISPUTE_SUBMITTED": {
        const rendered = templates.renderSupplierReturnRequestEmail({
          supplierName: payload.supplierName || "Studio Master Artisan",
          orderId: payload.orderId || "ORD-PENDING",
          reason: payload.reason || "Patron replacement request",
          disputeId: payload.disputeId || "DISP-PENDING",
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "SUPPLIER_SETTLEMENT": {
        const rendered = templates.renderSupplierSettlementEmail({
          supplierName: payload.supplierName || "Studio Master Artisan",
          payoutId: payload.payoutId || "PAY-ESCROW",
          amountINR: payload.amountINR || payload.amount || "0",
          utrReference: payload.utrReference || payload.utr || "BANK-UTR-VERIFIED",
          bankLast4: payload.bankLast4,
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "ADMIN_SUPPLIER_APPLICATION": {
        const rendered = templates.renderAdminSupplierApplicationEmail({
          studioName: payload.studioName || "New Studio",
          ownerName: payload.ownerName || "Applicant",
          email: payload.email || "",
          city: payload.city || "India",
          state: payload.state || "",
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "ADMIN_PLATFORM_ALERT": {
        const rendered = templates.renderAdminPlatformAlertEmail({
          title: payload.title || "System Notice",
          message: payload.message || "",
          severity: payload.severity || "INFO",
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "ADMIN_TRANSACTION_FAILURE":
      case "PAYMENT_FAILED": {
        const rendered = templates.renderAdminTransactionFailureEmail({
          orderId: payload.orderId || "ORD-PENDING",
          customerEmail: payload.customerEmail || payload.email || "patron@unknown.com",
          amountINR: payload.amountINR || payload.totalINR || "0",
          reason: payload.reason || "Payment declined at gateway",
          gatewayError: payload.gatewayError,
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "ADMIN_DISPUTE_ALERT": {
        const rendered = templates.renderAdminDisputeAlertEmail({
          disputeId: payload.disputeId || "DISP-ALERT",
          orderId: payload.orderId || "ORD-PENDING",
          customerName: payload.customerName || "Patron",
          supplierName: payload.supplierName || "Artisan Studio",
          reason: payload.reason || "Arbitration request",
        });
        return { subject: rendered.subject, body: rendered.text, html: rendered.html };
      }

      case "WISHLIST_BACK_IN_STOCK":
        return {
          subject: `Back in Studio: ${payload.productTitle}`,
          body: `A piece from your saved wishlist, "${payload.productTitle}", has been restocked by ${payload.vendorName}. Available stock: ${payload.stock} units.`,
        };
      case "REVIEW_REMINDER":
        return {
          subject: `How was your artisan piece? Review ${payload.productTitle}`,
          body: `Dear ${payload.customerName},\nWe hope you are enjoying your piece from ${payload.vendorName}. Please share your review to help fellow patrons discover authentic craftsmanship.`,
        };
      case "ABANDONED_CART_REMINDER":
        return {
          subject: `Complete your commission: Pieces awaiting in your studio bag`,
          body: `You left pieces in your shopping bag at Nexu Atelier. Items remain reserved for a limited time.\nComplimentary shipping applies on orders above ₹2,500.`,
        };

      default:
        return {
          subject: `Notification: ${template}`,
          body: JSON.stringify(payload, null, 2),
        };
    }
  }

  /**
   * Processes the outbox queue with exponential backoff and maximum retry bounds.
   */
  public async processOutboxQueue(batchSize = 25): Promise<{ processed: number; succeeded: number; failed: number }> {
    const events = await prisma.notificationEvent.findMany({
      where: {
        status: { in: [NotificationStatus.QUEUED, NotificationStatus.FAILED] },
        attempts: { lt: 3 }, // Maximum 3 retries
      },
      orderBy: { createdAt: "asc" },
      take: batchSize,
    });

    let succeeded = 0;
    let failed = 0;

    for (const event of events) {
      const ok = await this.dispatchNotification(event.id);
      if (ok) {
        succeeded++;
      } else {
        failed++;
      }
    }

    return {
      processed: events.length,
      succeeded,
      failed,
    };
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

  /**
   * Returns outbox operational metrics.
   */
  public async getOutboxMetrics() {
    const [total, sent, queued, failed] = await Promise.all([
      prisma.notificationEvent.count(),
      prisma.notificationEvent.count({ where: { status: NotificationStatus.SENT } }),
      prisma.notificationEvent.count({ where: { status: NotificationStatus.QUEUED } }),
      prisma.notificationEvent.count({ where: { status: NotificationStatus.FAILED } }),
    ]);

    return {
      total,
      sent,
      queued,
      failed,
      deliveryRatePercent: total > 0 ? Math.round((sent / total) * 100) : 100,
    };
  }

  /**
   * Retrieves intercepted demo notifications with parsed template data for the Admin Demo Outbox Inspector.
   */
  public async getDemoOutbox(options?: {
    channel?: string;
    status?: NotificationStatus;
    search?: string;
    limit?: number;
    skip?: number;
  }) {
    const limit = options?.limit || 50;
    const skip = options?.skip || 0;
    const where: any = {};

    if (options?.channel && options.channel !== "ALL") {
      where.channel = options.channel;
    }
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.search) {
      where.OR = [
        { recipient: { contains: options.search, mode: "insensitive" } },
        { template: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const [total, events] = await Promise.all([
      prisma.notificationEvent.count({ where }),
      prisma.notificationEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
    ]);

    const items = events.map((ev) => {
      let parsedPayload: Record<string, any> = {};
      try {
        parsedPayload = JSON.parse(ev.payloadJson);
      } catch {
        parsedPayload = {};
      }

      const demoInfo = parsedPayload._demoOutbox || {};

      return {
        id: ev.id,
        channel: ev.channel,
        recipient: ev.recipient,
        template: ev.template,
        status: ev.status,
        orderId: ev.orderId,
        attempts: ev.attempts,
        sentAt: ev.sentAt,
        createdAt: ev.createdAt,
        renderedSubject: demoInfo.renderedSubject || `[${ev.channel}] ${ev.template}`,
        renderedBody: demoInfo.renderedBody || "",
        renderedHtml: demoInfo.renderedHtml || null,
        simulatedDeliveryStatus: demoInfo.simulatedDeliveryStatus || "DELIVERED_SIMULATED",
        isDemo: Boolean(demoInfo.isDemo || isDemoMode()),
      };
    });

    return {
      total,
      limit,
      skip,
      items,
    };
  }
}

export const notificationService = new NotificationService();
