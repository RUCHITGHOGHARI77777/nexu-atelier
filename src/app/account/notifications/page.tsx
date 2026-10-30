"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ArrowLeft,
  CheckCheck,
  Package,
  RotateCcw,
  LifeBuoy,
  Shield,
  Tag,
  Info,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export default function NotificationsCenterPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  const fetchNotifications = () => {
    fetch("/api/customer/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount || 0);
        }
      })
      .catch((err) => console.error("Failed to load notifications:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login?redirect=/account/notifications");
      return;
    }

    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/customer/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch("/api/customer/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "ORDER":
        return <Package className="w-4 h-4 text-emerald-600" />;
      case "RETURN":
        return <RotateCcw className="w-4 h-4 text-amber-600" />;
      case "TICKET":
        return <LifeBuoy className="w-4 h-4 text-blue-600" />;
      case "SECURITY":
        return <Shield className="w-4 h-4 text-rose-600" />;
      case "PROMO":
        return <Tag className="w-4 h-4 text-purple-600" />;
      default:
        return <Info className="w-4 h-4 text-zinc-600" />;
    }
  };

  const filtered = filter === "UNREAD" ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div className="space-y-1">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Patron Account</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight flex items-center gap-2.5">
              <Bell className="w-6 h-6 text-amber-600" />
              <span>Patron Notification Center</span>
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 font-mono">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-600">
            Real-time updates regarding your commissions, deliveries, returns, and concierge messages.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 gap-6 text-xs font-medium">
        <button
          onClick={() => setFilter("ALL")}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            filter === "ALL"
              ? "border-zinc-950 text-zinc-950 font-bold"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("UNREAD")}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            filter === "UNREAD"
              ? "border-zinc-950 text-zinc-950 font-bold"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-zinc-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-white border border-zinc-200 rounded-2xl p-8">
          <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">
            {filter === "UNREAD" ? "No unread notifications" : "You have no notifications yet"}
          </h3>
          <p className="text-xs text-zinc-600 max-w-sm mx-auto">
            Order updates, delivery tracking, and artisan concierge replies will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                !n.isRead
                  ? "bg-amber-50/30 border-amber-200 shadow-xs"
                  : "bg-white border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shrink-0 shadow-2xs">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
                    <span>{n.title}</span>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
                    )}
                  </h4>
                  <span className="text-[11px] text-zinc-400 font-mono shrink-0">
                    {new Date(n.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">{n.body}</p>

                <div className="pt-2 flex items-center gap-4 text-xs font-medium">
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={() => !n.isRead && handleMarkRead(n.id)}
                      className="text-amber-800 hover:text-amber-950 inline-flex items-center gap-1 font-semibold"
                    >
                      <span>View details</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
