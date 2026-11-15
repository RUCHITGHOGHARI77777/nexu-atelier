import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { paymentService } from "@/lib/server/payment/payment-service";
import { isDemoMode } from "@/lib/server/demo-mode";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.success) {
    return auth.response;
  }

  if (!isDemoMode()) {
    return NextResponse.json(
      { error: "Payment simulation is strictly restricted to Demo Mode." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { scenario, orderId, amountPaise, reason } = body;

    if (!scenario) {
      return NextResponse.json(
        { error: "Scenario is required (SUCCESS, FAILURE, CANCEL, REFUND)." },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "OrderId is required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: `Order ${orderId} not found.` },
        { status: 404 }
      );
    }

    const sandboxAdapter = paymentService.getSandboxAdapter();

    switch (scenario) {
      case "SUCCESS": {
        const orderResult = await sandboxAdapter.createPaymentOrder({
          orderId: order.id,
          amountPaise: order.totalPaise,
          currency: "INR",
          customerName: order.customerName,
          customerEmail: order.customerEmail,
        });

        const paymentId = sandboxAdapter.generateDemoPaymentId("pay_demo_sim");
        const signature = sandboxAdapter.generateTestSignature(orderResult.providerOrderId, paymentId);

        const confirmResult = await paymentService.verifyPaymentAndConfirmOrder(
          order.id,
          order.customerId,
          {
            orderId: order.id,
            providerOrderId: orderResult.providerOrderId,
            providerPaymentId: paymentId,
            signature,
          },
          "SANDBOX"
        );

        if (!confirmResult.success) {
          return NextResponse.json({ success: false, error: confirmResult.error }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          scenario: "SUCCESS",
          orderId: order.id,
          providerPaymentId: paymentId,
          providerOrderId: orderResult.providerOrderId,
          status: "CAPTURED",
          message: "Demo payment simulated and captured successfully.",
        });
      }

      case "FAILURE": {
        const failReason = reason || "Demo Simulator: Card declined by issuing bank.";
        const failedPaymentId = sandboxAdapter.generateDemoPaymentId("pay_demo_failed");

        await paymentService.handlePaymentFailure(order.id, failReason, failedPaymentId);

        return NextResponse.json({
          success: true,
          scenario: "FAILURE",
          orderId: order.id,
          providerPaymentId: failedPaymentId,
          status: "FAILED",
          reason: failReason,
          message: "Demo payment failure simulated successfully.",
        });
      }

      case "CANCEL": {
        const cancelReason = reason || "Demo Simulator: Patron cancelled transaction during 3DS approval.";
        const cancelResult = await paymentService.simulateDemoCancellation(
          order.id,
          cancelReason,
          auth.context.user.id
        );

        if (!cancelResult.success) {
          return NextResponse.json({ success: false, error: cancelResult.error }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          scenario: "CANCEL",
          orderId: order.id,
          status: "CANCELLED",
          message: "Demo payment cancellation simulated successfully.",
        });
      }

      case "REFUND": {
        const refundPaise = amountPaise ? Number(amountPaise) : order.totalPaise;
        const refundReason = reason || "Demo Simulator: Customer returned product in pristine condition.";

        const refundResult = await paymentService.simulateDemoRefund(
          order.id,
          refundPaise,
          refundReason,
          auth.context.user.id
        );

        if (!refundResult.success) {
          return NextResponse.json({ success: false, error: refundResult.error }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          scenario: "REFUND",
          orderId: order.id,
          refundId: refundResult.refundId,
          amountPaise: refundPaise,
          status: "REFUNDED",
          message: "Demo refund simulated and recorded in financial ledger successfully.",
        });
      }

      default:
        return NextResponse.json(
          { error: `Unsupported scenario: ${scenario}. Choose SUCCESS, FAILURE, CANCEL, or REFUND.` },
          { status: 400 }
        );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Payment simulation failed." },
      { status: 500 }
    );
  }
}

