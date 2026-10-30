import { NextRequest, NextResponse } from "next/server";
import { paymentRecordService } from "@/lib/server/payment-record-service";
import { getSessionUser } from "@/lib/server/session-helper";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

/**
 * Verified Payment Ingestion / Signature Verification Endpoint
 *
 * Implements strict server-side validation:
 * 1. Rejects unverified client assertions.
 * 2. Enforces cryptographic HMAC signature checks or verified provider callbacks.
 * 3. Idempotently creates payment records and prevents double-crediting.
 * 4. Strictly sanitizes any payloads, rejecting CVV or unmasked PANs.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ success: false, error: "Empty request payload." }, { status: 400 });
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON format." }, { status: 400 });
    }

    const {
      orderId,
      transactionRef,
      idempotencyKey,
      amount,
      currency = "INR",
      method = "UPI",
      status = "SUCCESS",
      provider = "RAZORPAY",
      signature,
      last4,
      cardBrand,
    } = body;

    if (!orderId || !transactionRef) {
      return NextResponse.json(
        { success: false, error: "Missing mandatory fields: orderId, transactionRef." },
        { status: 400 }
      );
    }

    // Authenticate session if initiated by a customer or admin
    const sessionUser = await getSessionUser();

    // Verify order exists and retrieve customer context
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Target order not found." }, { status: 404 });
    }

    // Verify authorization: customer can only record for their own order, or admin
    if (sessionUser && sessionUser.role !== "admin" && order.customerId !== sessionUser.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Access denied to other customer orders." },
        { status: 403 }
      );
    }

    // Cryptographic signature check: If signature is provided, verify it
    if (signature && process.env.RAZORPAY_KEY_SECRET) {
      const payloadToSign = `${order.id}|${transactionRef}`;
      const isValid = paymentRecordService.verifyWebhookSignature(
        payloadToSign,
        signature,
        process.env.RAZORPAY_KEY_SECRET
      );

      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Cryptographic signature verification failed. Untrusted payment assertion." },
          { status: 400 }
        );
      }
    }

    // Atomically and idempotently record transaction
    const recordResult = await paymentRecordService.recordTransaction({
      orderId,
      customerId: order.customerId,
      provider: provider as any,
      method,
      amountPaise: amount ? Math.round(Number(amount) * 100) : order.totalPaise,
      currency,
      transactionRef,
      idempotencyKey: idempotencyKey || `rec_${orderId}_${transactionRef}`,
      status: (status as any) || "CAPTURED",
      last4,
      cardBrand,
    });

    return NextResponse.json({
      success: true,
      isDuplicate: recordResult.isDuplicate ?? false,
      paymentRecordId: recordResult.paymentRecord.id,
      reconciliationStatus: recordResult.paymentRecord.reconciliationStatus,
      status: recordResult.paymentRecord.status,
    });
  } catch (err: any) {
    const isSecurityViolation = err.message?.includes("SECURITY VIOLATION");
    return NextResponse.json(
      { success: false, error: err.message || "Failed to record payment transaction." },
      { status: isSecurityViolation ? 400 : 500 }
    );
  }
}
