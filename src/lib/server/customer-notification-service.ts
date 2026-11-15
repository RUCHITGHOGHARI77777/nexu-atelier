import { prisma } from "./prisma";

export interface CreateCustomerNotificationInput {
  customerId: string;
  title: string;
  body: string;
  type?: "ORDER" | "RETURN" | "TICKET" | "PROMO" | "SECURITY" | "INFO";
  link?: string;
  metadata?: Record<string, any>;
}

export async function createCustomerNotification(input: CreateCustomerNotificationInput) {
  try {
    return await prisma.customerNotification.create({
      data: {
        customerId: input.customerId,
        title: input.title,
        body: input.body,
        type: input.type || "INFO",
        link: input.link || null,
        metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (err) {
    console.error("Failed to create customer notification:", err);
    return null;
  }
}

export async function getCustomerNotifications(customerId: string, unreadOnly: boolean = false) {
  const where: any = { customerId };
  if (unreadOnly) {
    where.isRead = false;
  }

  const notifications = await prisma.customerNotification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return notifications.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    type: n.type,
    link: n.link,
    isRead: n.isRead,
    readAt: n.readAt?.toISOString() || null,
    createdAt: n.createdAt.toISOString(),
    metadata: n.metadataJson ? JSON.parse(n.metadataJson) : null,
  }));
}

export async function getUnreadNotificationCount(customerId: string): Promise<number> {
  return await prisma.customerNotification.count({
    where: {
      customerId,
      isRead: false,
    },
  });
}

export async function markNotificationAsRead(customerId: string, notificationId: string) {
  const notification = await prisma.customerNotification.findFirst({
    where: {
      id: notificationId,
      customerId,
    },
  });

  if (!notification) {
    throw new Error("Notification not found or access denied");
  }

  return await prisma.customerNotification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function markAllNotificationsAsRead(customerId: string) {
  return await prisma.customerNotification.updateMany({
    where: {
      customerId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}
