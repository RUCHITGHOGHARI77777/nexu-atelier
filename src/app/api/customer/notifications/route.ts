import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import {
  getCustomerNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/server/customer-notification-service";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";

  try {
    const [notifications, unreadCount] = await Promise.all([
      getCustomerNotifications(user.id, unreadOnly),
      getUnreadNotificationCount(user.id),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.markAll) {
      await markAllNotificationsAsRead(user.id);
      return NextResponse.json({ success: true, unreadCount: 0 });
    }

    if (body.notificationId) {
      await markNotificationAsRead(user.id, body.notificationId);
      const unreadCount = await getUnreadNotificationCount(user.id);
      return NextResponse.json({ success: true, unreadCount });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to mark as read" }, { status: 400 });
  }
}
