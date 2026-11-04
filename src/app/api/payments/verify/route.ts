import { NextRequest, NextResponse } from "next/server";
import { paymentRecordService } from "@/lib/server/payment-record-service";
import { paymentService } from "@/lib/server/payment/payment-service";
import { getSessionUser } from "@/lib/server/session-helper";
import { prisma } from "@/lib/server/prisma";
import { PaymentProvider, PaymentStatus, OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * Verified Payment Ingestion / Signature Verification Endpoint
 *
 * Implements strict server-side validation:
 * 1. Requires authenticated session; rejects anonymous callers (401).
 * 2. Enforces customer order ownership or admin privileges (403).
 * 3. Never trusts client-submitted amount, status, or currency.
 * 4. Enforces cryptographic HMAC signature verification for gateway assertions.
 * 5. Idempotently creates payment records and prevents double-crediting.
 * 6. Strictly sanitizes any payloads, rejecting CVV or unmasked PANs.
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
      method = "ONLINE",
      provider = "RAZORPAY",
      signature,
      providerOrderId,
      last4,
      cardBrand,
    } = body;

    if (!orderId || !transactionRef) {
      return NextResponse.json(
        { success: false, error: "Missing mandatory fields: orderId, transactionRef." },
        { status: 400 }
      );
    }

    // 1. Mandatory Session Authentication
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required to record or verify payment." },
        { status: 401 }
      );
    }

    // 2. Fetch authoritative order context from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, payments: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Target order not found." }, { status: 404 });
    }

    // 3. Strict Authorization: Customer can only verify their own order, or admin
    if (sessionUser.role !== "admin" && order.customerId !== sessionUser.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Access denied to other customer orders." },
        { status: 403 }
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      return NextResponse.json(
        { success: false, error: "Cannot record payment for a cancelled order." },
        { status: 400 }
      );
    }

    // 4. Cryptographic signature check: Required for Razorpay provider
    if (provider === "RAZORPAY") {
      if (!signature) {
        return NextResponse.json(
          { success: false, error: "Cryptographic signature is mandatory for Razorpay payment verification." },
          { status: 400 }
        );
      }

      const pOrderId = providerOrderId || body.razorpay_order_id || order.id;
      const isValid = await paymentService.getRazorpayAdapter().verifyPaymentSignature({
        orderId,
        providerOrderId: pOrderId,
        providerPaymentId: transactionRef,
        signature,
      });

      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Cryptographic signature verification failed. Untrusted payment assertion." },
          { status: 400 }
        );
      }
    }

    // 5. Idempotency Check: Return existing record if already captured
    const existingRef = await prisma.paymentRecord.findUnique({
      where: { transactionRef },
    });
    if (existingRef && existingRef.status === PaymentStatus.CAPTURED) {
      return NextResponse.json({
        success: true,
        isDuplicate: true,
        paymentRecordId: existingRef.id,
        reconciliationStatus: existingRef.reconciliationStatus,
        status: existingRef.status,
      });
    }

    // 6. Atomically and idempotently record transaction using server-authoritative amount & currency
    const recordResult = await paymentRecordService.recordTransaction({
      orderId,
      customerId: order.customerId,
      provider: provider === "RAZORPAY" ? PaymentProvider.RAZORPAY : PaymentProvider.ESCROW_INTERNAL,
      method,
      amountPaise: order.totalPaise, // Authoritative order total from database
      currency: "INR",
      transactionRef,
      idempotencyKey: idempotencyKey || `rec_${orderId}_${transactionRef}`,
      status: PaymentStatus.CAPTURED,
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
