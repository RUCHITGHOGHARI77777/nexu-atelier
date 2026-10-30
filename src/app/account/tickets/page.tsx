"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  ArrowLeft,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  LifeBuoy,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

interface SupportTicket {
  id: string;
  ticketNumber: string;
  orderId?: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    senderRole: string;
    senderName: string;
    message: string;
    createdAt: string;
  }>;
}

export default function SupportTicketsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("ORDER_QUERY");
  const [priority, setPriority] = useState("MEDIUM");
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchTickets = () => {
    fetch("/api/support/tickets")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.tickets)) {
          setTickets(data.tickets);
        }
      })
      .catch((err) => console.error("Failed to fetch tickets:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login?redirect=/account/tickets");
      return;
    }

    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          category,
          priority,
          orderId: orderId.trim() || undefined,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create support ticket");

      setShowCreateModal(false);
      setSubject("");
      setMessage("");
      setOrderId("");
      fetchTickets();
    } catch (err: any) {
      setFormError(err.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge variant="warning">Open</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="accent">In Progress</Badge>;
      case "WAITING_CUSTOMER":
        return <Badge variant="neutral">Waiting for Patron</Badge>;
      case "RESOLVED":
        return <Badge variant="success">Resolved</Badge>;
      case "CLOSED":
      default:
        return <Badge variant="neutral">Closed</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight flex items-center gap-2.5">
            <LifeBuoy className="w-6 h-6 text-amber-600" />
            <span>Support Concierge & Tickets</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600">
            Dedicated assistance for orders, artisanal specifications, payments, and returns.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Support Inquiry</span>
        </Button>
      </div>

      {/* Ticket List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-zinc-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-white border border-zinc-200 rounded-2xl p-8">
          <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">No support tickets active</h3>
          <p className="text-xs text-zinc-600 max-w-sm mx-auto">
            Need help with an ongoing commission or delivery? Our atelier concierge is on standby.
          </p>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            Open Support Ticket
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => {
            const lastMsg = t.messages[t.messages.length - 1];
            return (
              <div
                key={t.id}
                className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-zinc-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-700">
                      {t.ticketNumber}
                    </span>
                    <span className="text-zinc-300">•</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                      {t.category.replace(/_/g, " ")}
                    </span>
                    {t.orderId && (
                      <>
                        <span className="text-zinc-300">•</span>
                        <span className="text-xs text-zinc-500 font-mono">
                          Order #{t.orderId}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(t.status)}
                    <Link href={`/account/tickets/${t.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-zinc-700 hover:text-zinc-950">
                        <span>View Conversation</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-zinc-950 hover:text-amber-700 transition-colors">
                    <Link href={`/account/tickets/${t.id}`}>{t.subject}</Link>
                  </h4>
                  {lastMsg && (
                    <p className="text-xs text-zinc-600 line-clamp-2">
                      <strong className="text-zinc-800">{lastMsg.senderName}:</strong> {lastMsg.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-2 border-t border-zinc-100">
                  <span>Updated: {new Date(t.updatedAt).toLocaleString("en-IN")}</span>
                  <span>{t.messages.length} message(s)</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="font-bold text-lg text-zinc-950">
                Submit Support Inquiry
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-zinc-800 text-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <Alert variant="error" title="Submission Error">
                {formError}
              </Alert>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of inquiry..."
                  className="w-full bg-zinc-50 text-xs text-zinc-900 p-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:bg-white focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-50 text-xs text-zinc-900 p-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:bg-white focus:border-amber-600"
                  >
                    <option value="ORDER_QUERY">Order Status</option>
                    <option value="DELIVERY_ISSUE">Logistics & Delivery</option>
                    <option value="RETURN_REFUND">Return / Replacement</option>
                    <option value="PAYMENT_ISSUE">Payment / Escrow</option>
                    <option value="PRODUCT_INQUIRY">Artisan Specification</option>
                    <option value="ACCOUNT_SECURITY">Account Security</option>
                    <option value="GENERAL">General Support</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-zinc-50 text-xs text-zinc-900 p-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:bg-white focus:border-amber-600"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Standard</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Order Reference (Optional)
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. ORD-202610-ABCD"
                  className="w-full bg-zinc-50 text-xs text-zinc-900 p-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:bg-white focus:border-amber-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Message Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide comprehensive details for our concierge..."
                  className="w-full bg-zinc-50 text-xs text-zinc-900 p-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:bg-white focus:border-amber-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {submitting ? "Submitting..." : "Submit Inquiry"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
