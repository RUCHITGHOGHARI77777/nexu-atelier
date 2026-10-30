import { prisma } from "./prisma";
import { TicketCategory, TicketPriority, TicketStatus } from "@prisma/client";
import { createCustomerNotification } from "./customer-notification-service";

export interface CreateTicketInput {
  customerId: string;
  customerName: string;
  orderId?: string;
  subject: string;
  category: TicketCategory;
  priority?: TicketPriority;
  message: string;
  attachments?: string[];
}

export interface AddMessageInput {
  ticketId: string;
  senderId: string;
  senderRole: "CUSTOMER" | "SUPPORT_AGENT" | "SYSTEM";
  senderName: string;
  message: string;
  attachments?: string[];
}

export async function createSupportTicket(input: CreateTicketInput) {
  // Generate ticket number: e.g. TKT-202610-ABCD
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const ticketNumber = `TKT-${dateStr}-${randomSuffix}`;

  // If orderId is provided, verify ownership
  if (input.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      select: { customerId: true },
    });
    if (!order || order.customerId !== input.customerId) {
      throw new Error("Invalid order reference or access denied");
    }
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      customerId: input.customerId,
      ticketNumber,
      orderId: input.orderId || null,
      subject: input.subject,
      category: input.category,
      priority: input.priority || "MEDIUM",
      status: "OPEN",
      messages: {
        create: {
          senderId: input.customerId,
          senderRole: "CUSTOMER",
          senderName: input.customerName,
          message: input.message,
          attachmentsJson: input.attachments ? JSON.stringify(input.attachments) : null,
        },
      },
    },
    include: {
      messages: true,
    },
  });

  await createCustomerNotification({
    customerId: input.customerId,
    title: `Ticket Created: #${ticketNumber}`,
    body: `Your support request "${input.subject}" has been submitted. Our concierge team will respond shortly.`,
    type: "TICKET",
    link: `/account/tickets/${ticket.id}`,
    metadata: { ticketId: ticket.id, ticketNumber },
  });

  return ticket;
}

export async function getCustomerTickets(customerId: string) {
  const tickets = await prisma.supportTicket.findMany({
    where: { customerId },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return tickets.map((t) => ({
    ...t,
    messages: t.messages.map((m) => ({
      ...m,
      attachments: m.attachmentsJson ? JSON.parse(m.attachmentsJson) : [],
    })),
  }));
}

export async function getTicketById(ticketId: string, customerId?: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          totalPaise: true,
          createdAt: true,
          items: {
            select: {
              title: true,
              quantity: true,
              unitPricePaise: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) return null;

  if (customerId && ticket.customerId !== customerId) {
    throw new Error("Unauthorized to access this ticket");
  }

  return {
    ...ticket,
    messages: ticket.messages.map((m) => ({
      ...m,
      attachments: m.attachmentsJson ? JSON.parse(m.attachmentsJson) : [],
    })),
  };
}

export async function addTicketMessage(input: AddMessageInput) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: input.ticketId },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: input.ticketId,
      senderId: input.senderId,
      senderRole: input.senderRole,
      senderName: input.senderName,
      message: input.message,
      attachmentsJson: input.attachments ? JSON.stringify(input.attachments) : null,
    },
  });

  // Update ticket status based on who sent the message
  let nextStatus: TicketStatus = ticket.status;
  if (input.senderRole === "CUSTOMER") {
    if (ticket.status === "WAITING_CUSTOMER" || ticket.status === "RESOLVED") {
      nextStatus = "OPEN";
    }
  } else if (input.senderRole === "SUPPORT_AGENT") {
    nextStatus = "WAITING_CUSTOMER";
  }

  await prisma.supportTicket.update({
    where: { id: input.ticketId },
    data: {
      status: nextStatus,
      updatedAt: new Date(),
    },
  });

  if (input.senderRole === "SUPPORT_AGENT") {
    await createCustomerNotification({
      customerId: ticket.customerId,
      title: `Support Agent Replied: #${ticket.ticketNumber}`,
      body: `New message on "${ticket.subject}": ${input.message.slice(0, 100)}...`,
      type: "TICKET",
      link: `/account/tickets/${ticket.id}`,
      metadata: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
    });
  }

  return {
    ...message,
    attachments: message.attachmentsJson ? JSON.parse(message.attachmentsJson) : [],
  };
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus, adminId?: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const updated = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status,
      updatedAt: new Date(),
    },
  });

  if (status === "RESOLVED" || status === "CLOSED") {
    await createCustomerNotification({
      customerId: ticket.customerId,
      title: `Ticket #${ticket.ticketNumber} ${status.toLowerCase()}`,
      body: `Your ticket regarding "${ticket.subject}" has been marked as ${status.toLowerCase()}.`,
      type: "TICKET",
      link: `/account/tickets/${ticket.id}`,
      metadata: { ticketId: ticket.id, status },
    });
  }

  return updated;
}
