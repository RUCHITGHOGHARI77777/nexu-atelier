import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import {
  createSupportTicket,
  getCustomerTickets,
} from "@/lib/server/support-ticket-service";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tickets = await getCustomerTickets(user.id);
    return NextResponse.json({ tickets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subject, category, priority, message, orderId, attachments } = body;

    if (!subject || !category || !message) {
      return NextResponse.json(
        { error: "Subject, category, and message are required" },
        { status: 400 }
      );
    }

    const ticket = await createSupportTicket({
      customerId: user.id,
      customerName: user.name || user.email.split("@")[0],
      subject,
      category,
      priority,
      message,
      orderId,
      attachments: Array.isArray(attachments) ? attachments : undefined,
    });

    return NextResponse.json({ success: true, ticket });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create support ticket" }, { status: 400 });
  }
}
