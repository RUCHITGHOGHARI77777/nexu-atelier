import { prisma } from "./prisma";
import { paymentService } from "./payment/payment-service";
import { shippingService } from "./shipping/shipping-service";
import { ShipmentStatus } from "@prisma/client";

export interface ProcessWebhookResult {
  success: boolean;
  duplicate?: boolean;
  eventId?: string;
  error?: string;
}

export class WebhookService {
  /**
   * Idempotently ingests and processes an incoming webhook from Razorpay, Shipping, or other providers.
   */
  public async handleWebhook(params: {
    provider: "RAZORPAY" | "SHIPROCKET" | "SIMULATED_3PL";
    eventId: string;
    eventType: string;
    rawBody: string;
    signature: string;
  }): Promise<ProcessWebhookResult> {
    const { provider, eventId, eventType, rawBody, signature } = params;

    // 1. Signature Verification
    let isSignatureValid = false;
    if (provider === "RAZORPAY") {
      isSignatureValid = paymentService.getAdapter(provider).verifyWebhookSignature(rawBody, signature);
    } else if (provider === "SHIPROCKET" || provider === "SIMULATED_3PL") {
      isSignatureValid = shippingService.getAdapter().verifyWebhookSignature(rawBody, signature);
    }

    if (!isSignatureValid) {
      await prisma.auditEvent.create({
        data: {
          entityType: "SECURITY",
          entityId: eventId,
          action: "INVALID_WEBHOOK_SIGNATURE",
          performedBy: provider,
          note: `Webhook signature verification failed for provider ${provider}, eventId ${eventId}. Potential signature tampering or replay attack.`,
        },
      }).catch(() => {});

      return {
        success: false,
        error: `Cryptographic signature verification failed for provider ${provider}.`,
      };
    }

    // 2. Idempotency Check & Ingestion
    const existing = await prisma.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider,
          eventId,
        },
      },
    });

    if (existing && existing.status === "PROCESSED") {
      return {
        success: true,
        duplicate: true,
        eventId: existing.id,
      };
    }

    // Create or update webhook record as RECEIVED
    const webhookRecord = await prisma.webhookEvent.upsert({
      where: {
        provider_eventId: {
          provider,
          eventId,
        },
      },
      create: {
        provider,
        eventId,
        eventType,
        payloadJson: rawBody,
        signature,
        status: "RECEIVED",
      },
      update: {
        retryCount: { increment: 1 },
      },
    });

    // 3. Event Processing
    try {
      const payload = JSON.parse(rawBody);

      if (provider === "RAZORPAY") {
        await this.processRazorpayEvent(eventType, payload);
      } else if (provider === "SHIPROCKET" || provider === "SIMULATED_3PL") {
        await this.processShippingEvent(eventType, payload);
      }

      await prisma.webhookEvent.update({
        where: { id: webhookRecord.id },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
          error: null,
        },
      });

      return {
        success: true,
        duplicate: false,
        eventId: webhookRecord.id,
      };
    } catch (err: any) {
      await prisma.webhookEvent.update({
        where: { id: webhookRecord.id },
        data: {
          status: "FAILED",
          error: err.message || "Failed to process webhook event",
        },
      });

      return {
        success: false,
        error: err.message || "Webhook processing failed.",
      };
    }
  }

  private async processRazorpayEvent(eventType: string, payload: any) {
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity || payload.payment;
      if (!paymentEntity) return;

      const providerPaymentId = paymentEntity.id;
      const providerOrderId = paymentEntity.order_id;
      const orderId = paymentEntity.notes?.orderId;

      if (orderId) {
        // Verify if payment already captured to prevent duplicate processing
        const order = await prisma.order.findUnique({
          where: { id: orderId },
        });

        if (order && order.paymentStatus !== "CAPTURED") {
          await paymentService.verifyAndCapturePayment(
            {
              orderId,
              providerOrderId,
              providerPaymentId,
              signature: "webhook_verified", // Already verified above
            },
            order.customerId,
            "RAZORPAY"
          );
        }
      }
    } else if (eventType === "payment.failed") {
      const paymentEntity = payload.payload?.payment?.entity || payload.payment;
      if (paymentEntity?.notes?.orderId) {
        await paymentService.handlePaymentFailure(
          paymentEntity.notes.orderId,
          paymentEntity.error_description || "Payment failed at gateway",
          paymentEntity.id
        );
      }
    }
  }

  private async processShippingEvent(eventType: string, payload: any) {
    const trackingNumber = payload.awb || payload.tracking_number || payload.trackingNumber;
    const statusStr = payload.current_status || payload.status || eventType;

    if (!trackingNumber) return;

    let targetStatus: ShipmentStatus = ShipmentStatus.IN_TRANSIT;
    const lower = String(statusStr).toLowerCase();

    if (lower.includes("delivered")) {
      targetStatus = ShipmentStatus.DELIVERED;
    } else if (lower.includes("out for delivery") || lower.includes("out_for_delivery")) {
      targetStatus = ShipmentStatus.OUT_FOR_DELIVERY;
    } else if (lower.includes("rto") || lower.includes("return to origin")) {
      targetStatus = ShipmentStatus.RTO_INITIATED;
    } else if (lower.includes("shipped") || lower.includes("dispatched") || lower.includes("in transit")) {
      targetStatus = ShipmentStatus.IN_TRANSIT;
    }

    await shippingService.updateShipmentStatus({
      trackingNumber,
      newStatus: targetStatus,
      location: payload.location || payload.current_city,
      description: payload.status_description || `Status updated to ${targetStatus} via carrier webhook`,
      source: "WEBHOOK",
    });
  }
}

export const webhookService = new WebhookService();
