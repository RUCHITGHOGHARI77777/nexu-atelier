"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  ArrowLeft,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  Shield,
  LifeBuoy,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  params: {
    id: string;
  };
}

export default function TicketDetailPage({ params }: Props) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [ticket, setTicket] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchTicket = () => {
    fetch(`/api/support/tickets/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Ticket not found or access denied");
        return res.json();
      })
      .then((data) => setTicket(data.ticket))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(`/login?redirect=/account/tickets/${params.id}`);
      return;
    }

    if (isAuthenticated) {
      fetchTicket();
    }
  }, [params.id, isAuthenticated, isAuthLoading, router]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${params.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyMessage }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");

      setReplyMessage("");
      fetchTicket();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!confirm("Are you sure you want to mark this support inquiry as resolved?")) return;
    try {
      const res = await fetch(`/api/support/tickets/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });
      if (!res.ok) throw new Error("Failed to close ticket");
      fetchTicket();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-4">
        <div className="h-8 bg-zinc-200 rounded w-48 animate-pulse" />
        <div className="h-64 bg-zinc-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <Alert variant="error" title="Access Error">
          {error || "Could not retrieve ticket conversation."}
        </Alert>
        <Link href="/account/tickets">
          <Button variant="outline" size="sm">
            Back to Support Hub
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div className="space-y-1">
          <Link
            href="/account/tickets"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Support Tickets</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-950 tracking-tight">
              {ticket.subject}
            </h1>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            {ticket.ticketNumber} • Category: {ticket.category.replace(/_/g, " ")} • Priority: {ticket.priority}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {ticket.status !== "CLOSED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseTicket}
              className="text-xs text-zinc-600 hover:text-zinc-950"
            >
              Mark as Resolved
            </Button>
          )}
          <span className="text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wider bg-zinc-100 text-zinc-800">
            {ticket.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {ticket.order && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-700" />
            <span className="font-mono font-bold text-amber-950">
              Linked Order: #{ticket.order.id}
            </span>
            <span className="text-amber-700">({ticket.order.status})</span>
          </div>
          <Link href={`/account/orders/${ticket.order.id}`} className="font-medium text-amber-900 hover:underline">
            View Order →
          </Link>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-6">
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
          Conversation Ledger
        </h3>

        <div className="space-y-4">
          {ticket.messages.map((m: any) => {
            const isCustomer = m.senderRole === "CUSTOMER";
            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border ${
                  isCustomer
                    ? "bg-zinc-50 border-zinc-200 ml-4 sm:ml-12"
                    : "bg-amber-50/50 border-amber-200 mr-4 sm:mr-12"
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900">
                      {m.senderName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-zinc-200 text-zinc-600">
                      {isCustomer ? "Patron" : "Atelier Concierge"}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {new Date(m.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">
                  {m.message}
                </p>
              </div>
            );
          })}
        </div>

        {ticket.status !== "CLOSED" ? (
          <form onSubmit={handleSendReply} className="pt-4 border-t border-zinc-200 space-y-3">
            <textarea
              required
              rows={3}
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your response to the concierge team..."
              className="w-full bg-zinc-50 text-xs sm:text-sm text-zinc-900 p-3 rounded-xl border border-zinc-200 focus:outline-none focus:bg-white focus:border-amber-600 resize-none"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={sending || !replyMessage.trim()}
                className="bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border border-[#171717] hover:border-[#B78B45] flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? "Sending..." : "Send Message"}</span>
              </Button>
            </div>
          </form>
        ) : (
          <div className="p-4 bg-zinc-100 rounded-xl text-center text-xs text-zinc-600">
            This support inquiry has been resolved and closed. If you require further assistance, please open a new ticket.
          </div>
        )}
      </div>
    </div>
  );
}
