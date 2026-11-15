"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Truck,
  Printer,
  FileText,
  Receipt,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { formatCurrency } from "@/lib/formatters";

export default function CustomerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [invoices, setInvoices] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!orderId) return;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [orderRes, invoicesRes] = await Promise.all([
          fetch(`/api/orders/${orderId}`),
          fetch(`/api/orders/${orderId}/invoices`),
        ]);

        if (orderRes.ok) {
          const oData = await orderRes.json();
          setOrder(oData.order || oData);
        } else {
          setError("Failed to retrieve order details.");
        }

        if (invoicesRes.ok) {
          const invData = await invoicesRes.json();
          setInvoices(invData);
        }
      } catch {
        setError("Network error while loading order details.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [orderId]);

  if (authLoading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin mx-auto mb-2" />
        <p className="text-xs text-zinc-500 font-mono">Loading order and statutory documents...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-zinc-900">Order Information Unavailable</h2>
        <p className="text-xs text-zinc-500">{error || "Order not found."}</p>
        <Link href="/account/orders">
          <Button variant="outline" size="sm">Back to My Orders</Button>
        </Link>
      </div>
    );
  }

  const salesInvoices = invoices?.salesInvoices || [];
  const paymentReceipt = invoices?.paymentReceipt;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-2 border-b border-zinc-200 pb-6">
        <Link
          href="/account/orders"
          className="text-xs text-zinc-500 hover:text-zinc-950 flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Orders</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-serif text-zinc-900 tracking-tight">
                Order #{order.id}
              </h1>
              <Badge variant="neutral" className="bg-zinc-100 text-zinc-800 text-xs font-mono">
                {order.status}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-mono">
              Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/track-order?orderId=${order.id}&contact=${encodeURIComponent(order.customerEmail || "")}`}>
              <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                Live Tracking
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-700" />
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              Statutory Tax Invoices & Payment Receipts
            </h2>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            Indian GST Compliant (CBIC)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
              Maker Sales Invoices ({salesInvoices.length})
            </h3>
            {salesInvoices.map((inv: any) => (
              <div
                key={inv.id}
                className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-mono font-bold text-xs text-zinc-900">
                    {inv.invoiceNumber}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-sans mt-0.5">
                    Issued by: <strong>{inv.supplierLegalName || inv.supplierTradeName}</strong>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {inv.documentType} • Place of Supply: {inv.placeOfSupplyState} ({inv.placeOfSupplyStateCode})
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-zinc-900">
                    ₹{(inv.netAmountPaise / 100).toFixed(2)}
                  </div>
                  <Link
                    href={`/api/invoices/${inv.id}/render`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-950 mt-1.5 underline"
                  >
                    <Printer className="w-3 h-3" />
                    Print / PDF
                  </Link>
                </div>
              </div>
            ))}

            {salesInvoices.length === 0 && (
              <div className="p-4 rounded-lg bg-zinc-50 text-xs text-zinc-500 text-center">
                Generating official maker invoices...
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
              Platform Payment Receipt
            </h3>
            {paymentReceipt ? (
              <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono font-bold text-xs text-zinc-900">
                    {paymentReceipt.invoiceNumber}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-sans mt-0.5">
                    Payment Method: <strong>{paymentReceipt.paymentMethod || "ESCROW"}</strong>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    Total Order Value: ₹{(paymentReceipt.netAmountPaise / 100).toFixed(2)}
                  </div>
                </div>

                <div className="text-right">
                  <Link
                    href={`/api/invoices/${paymentReceipt.id}/render`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-950 underline"
                  >
                    <Printer className="w-3 h-3" />
                    Download Receipt
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-zinc-50 text-xs text-zinc-500 text-center">
                Receipt available upon payment capture.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
            Order Items ({order.items?.length || 0})
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            Payment Status: <strong>{order.paymentStatus}</strong>
          </span>
        </div>

        <div className="divide-y divide-zinc-100">
          {(order.items || []).map((item: any) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-16 relative rounded-md overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                  <ImageWithFallback
                    src={item.imageSnapshot || item.image || "/images/placeholder.png"}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">{item.title}</h3>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Maker: {item.vendorName || "Atelier Partner"} {item.selectedSize ? `• Size: ${item.selectedSize}` : ""}
                  </div>
                  <div className="text-xs font-mono text-zinc-600 mt-1">
                    Qty: {item.quantity} × ₹{((item.unitPricePaise || item.unitPrice * 100) / 100).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="font-mono font-bold text-sm text-zinc-900">
                ₹{((item.lineTotalPaise || item.lineTotal * 100) / 100).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
