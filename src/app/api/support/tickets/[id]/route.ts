import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import {
  getTicketById,
  addTicketMessage,
  updateTicketStatus,
} from "@/lib/server/support-ticket-service";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ticket = await getTicketById(params.id, user.role === "admin" ? undefined : user.id);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch ticket" }, { status: 403 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { message, attachments } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const ticket = await getTicketById(params.id, user.role === "admin" ? undefined : user.id);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const newMessage = await addTicketMessage({
      ticketId: params.id,
      senderId: user.id,
      senderRole: user.role === "admin" ? "SUPPORT_AGENT" : "CUSTOMER",
      senderName: user.name || (user.role === "admin" ? "Support Concierge" : user.email.split("@")[0]),
      message,
      attachments: Array.isArray(attachments) ? attachments : undefined,
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to post message" }, { status: 400 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const ticket = await getTicketById(params.id);

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (user.role !== "admin") {
      if (ticket.customerId !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      if (body.status === "CLOSED") {
        const updated = await updateTicketStatus(params.id, "CLOSED");
        return NextResponse.json({ success: true, ticket: updated });
      } else {
        return NextResponse.json({ error: "Customers can only close tickets" }, { status: 403 });
      }
    }

    const updated = await updateTicketStatus(params.id, body.status, user.id);
    return NextResponse.json({ success: true, ticket: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update ticket" }, { status: 400 });
  }
}
