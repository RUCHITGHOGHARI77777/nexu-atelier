import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { paymentRecordService } from "@/lib/server/payment-record-service";

export const dynamic = "force-dynamic";

/**
 * Customer Isolated Payment History API
 * Returns only transactions belonging to the authenticated customer.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const result = await paymentRecordService.getCustomerPayments(user.id);
    return NextResponse.json({
      success: true,
      records: result.payments,
      total: result.total,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load payment history." },
      { status: 500 }
    );
  }
}
