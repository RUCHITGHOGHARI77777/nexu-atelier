"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  IndianRupee,
  ShieldCheck,
  Download,
  Printer,
  Calendar,
  Building,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Lock,
  ArrowRight,
  Upload,
  Send,
  Trash2,
  Copy,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/context/StoreContext";

export default function SellerBillingPage() {
  const { showToast } = useStore();
  const [activeTab, setActiveTab] = useState<
    "invoices" | "commissions" | "creditNotes" | "caReports" | "profile" | "compliance" | "accountant"
  >("invoices");

  const [isLoading, setIsLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedFy, setSelectedFy] = useState("2026-27");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [caReport, setCaReport] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  const [profileForm, setProfileForm] = useState<any>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [caEmail, setCaEmail] = useState("");
  const [caName, setCaName] = useState("");
  const [caFirm, setCaFirm] = useState("");
  const [isInvitingCa, setIsInvitingCa] = useState(false);

  const [docType, setDocType] = useState("GST_CERTIFICATE");
  const [docFileName, setDocFileName] = useState("");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const fetchOverview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seller/billing/overview");
      if (res.ok) {
        const data = await res.json();
        setOverviewData(data);
        if (data.seller) {
          setProfileForm({
            legalBusinessName: data.seller.legalBusinessName || data.seller.name || "",
            tradeName: data.seller.name || "",
            pan: data.seller.pan || "",
            gstin: data.seller.gstin || "",
            taxRegistrationType: data.seller.taxRegistrationType || "REGULAR",
            businessConstitution: data.seller.businessConstitution || "INDIVIDUAL",
            registeredState: data.seller.registeredState || "Maharashtra",
            registeredAddress: data.seller.registeredAddress || "",
            pincode: data.seller.pincode || "",
            invoicePrefix: data.seller.invoicePrefix || "INV",
            compositionDeclaration: data.seller.compositionDeclaration || "",
          });
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to load seller billing overview.");
      }
    } catch {
      setError("Network error while connecting to financial ledger.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCaReport = async (fy: string, m: number) => {
    setIsLoadingReport(true);
    try {
      const res = await fetch(`/api/seller/billing/ca-reports?financialYear=${fy}&month=${m}`);
      if (res.ok) {
        const data = await res.json();
        setCaReport(data.report);
      } else {
        showToast("Failed to generate monthly CA report.", "warning");
      }
    } catch {
      showToast("Network error generating CA report.", "warning");
    } finally {
      setIsLoadingReport(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === "caReports" && !caReport) {
      loadCaReport(selectedFy, selectedMonth);
    }
  }, [activeTab]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/seller/billing/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Business & GST profile updated successfully.", "success");
        fetchOverview();
      } else {
        showToast(data.error || "Failed to update profile.", "warning");
      }
    } catch {
      showToast("Network error updating profile.", "warning");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleInviteAccountant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caEmail) return;
    setIsInvitingCa(true);
    try {
      const res = await fetch("/api/seller/billing/accountant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: caEmail,
          accountantName: caName,
          firmName: caFirm,
          financialYears: selectedFy,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Accountant access grant generated successfully.", "success");
        setCaEmail("");
        setCaName("");
        setCaFirm("");
        fetchOverview();
      } else {
        showToast(data.error || "Failed to invite accountant.", "warning");
      }
    } catch {
      showToast("Network error issuing access grant.", "warning");
    } finally {
      setIsInvitingCa(false);
    }
  };

  const handleRevokeAccountant = async (id: string) => {
    try {
      const res = await fetch(`/api/seller/billing/accountant-access?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Accountant access grant revoked.", "info");
        fetchOverview();
      }
    } catch {
      showToast("Failed to revoke access.", "warning");
    }
  };

  const handleUploadComplianceDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFileName) return;
    setIsUploadingDoc(true);
    try {
      const res = await fetch("/api/seller/billing/compliance-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: docType,
          fileName: docFileName,
          fileUrl: `https://storage.nexuatelier.internal/compliance/${docFileName}`,
        }),
      });
      if (res.ok) {
        showToast("Compliance document recorded & verified.", "success");
        setDocFileName("");
        fetchOverview();
      } else {
        showToast("Failed to register document.", "warning");
      }
    } catch {
      showToast("Network error.", "warning");
    } finally {
      setIsUploadingDoc(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Accessing verified billing & tax ledger...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-800 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 flex-shrink-0 text-rose-600 mt-0.5" />
          <div>
            <h3 className="font-bold text-base">Billing Access Required</h3>
            <p className="text-sm mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOverview}
              className="mt-4 border-rose-300 text-rose-800 hover:bg-rose-100"
            >
              Retry Connection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const seller = overviewData?.seller;
  const summary = overviewData?.summary;
  const salesInvoices = overviewData?.recentSalesInvoices || [];
  const commissionInvoices = overviewData?.recentCommissionInvoices || [];
  const creditNotes = overviewData?.recentCreditNotes || [];
  const complianceDocs = overviewData?.complianceDocs || [];
  const accountantInvitations = overviewData?.accountantInvitations || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
              Seller Invoicing, GST & CA Reporting
            </h1>
            <Badge
              variant="outline"
              className={
                seller?.taxRegistrationType === "REGULAR"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-mono text-xs"
                  : "bg-blue-50 text-blue-700 border-blue-300 font-mono text-xs"
              }
            >
              {seller?.taxRegistrationType || "REGULAR"} GST
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Statutory Goods & Services Tax compliance, sequential tax invoices, platform fees (SAC 998313), and Chartered Accountant monthly registers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverview}
            className="flex items-center gap-1.5 text-xs text-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Ledger
          </Button>
          <Link href="/seller/payouts">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
              <IndianRupee className="w-3.5 h-3.5" />
              Payouts Ledger
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gross Sales (₹)</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-slate-900">
            ₹{summary?.grossSalesINR || "0.00"}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <span>{summary?.totalSalesInvoices || 0} customer invoices issued</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Platform Fees (₹)</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-slate-900">
            ₹{summary?.commissionPaidINR || "0.00"}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <span className="text-emerald-700 font-medium">Eligible for ITC (18% GST)</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Settled to Bank (₹)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-emerald-800">
            ₹{summary?.settledPayoutsINR || "0.00"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            <span>Bank: {seller?.bankAccountName || "Verified Studio Account"}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Escrow Balance (₹)</span>
            <Lock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-amber-700">
            ₹{summary?.pendingEscrowINR || "0.00"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            <span>14-day return period protection</span>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 overflow-x-auto pb-1 text-sm font-medium">
          {[
            { id: "invoices", label: "Customer Invoices", count: salesInvoices.length },
            { id: "commissions", label: "Platform Fee Invoices", count: commissionInvoices.length },
            { id: "creditNotes", label: "Credit Notes", count: creditNotes.length },
            { id: "caReports", label: "CA Monthly Center", highlight: true },
            { id: "profile", label: "Business & GST Profile" },
            { id: "compliance", label: "Compliance Docs", count: complianceDocs.length },
            { id: "accountant", label: "Accountant Access", count: accountantInvitations.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-slate-900 text-slate-900 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 text-[11px] font-mono">
                  {tab.count}
                </span>
              )}
              {tab.highlight && (
                <span className="bg-indigo-100 text-indigo-700 rounded px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                  GSTR-1
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "invoices" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Issued Customer Invoices & Bills of Supply
            </h2>
            <span className="text-xs text-slate-500">
              Sequential numbering per FY with immutable JSON freeze
            </span>
          </div>

          {salesInvoices.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Sales Invoices Generated Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Customer sales invoices are automatically generated sequentially when orders containing your atelier pieces are confirmed.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Supply State</th>
                    <th className="py-3 px-4 text-right">Taxable (₹)</th>
                    <th className="py-3 px-4 text-right">Total (₹)</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {salesInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(inv.createdAt).toISOString().slice(0, 10)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="neutral"
                          className={
                            inv.documentType === "TAX_INVOICE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                              : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                          }
                        >
                          {inv.documentType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-sans">
                        {inv.customerName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-sans">
                        {inv.placeOfSupplyState} ({inv.placeOfSupplyStateCode})
                        {inv.isInterState ? " [IGST]" : " [CGST+SGST]"}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        ₹{(inv.taxableAmountPaise / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{(inv.netAmountPaise / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <Link
                          href={`/api/invoices/${inv.id}/render`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-semibold text-xs border border-slate-200 rounded px-2.5 py-1 bg-white hover:bg-slate-50 shadow-2xs"
                        >
                          <Printer className="w-3 h-3 text-slate-500" />
                          View / Print
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "commissions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Platform Intermediation Invoices (NEXU to Studio)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official tax invoices issued by NEXU ATELIER PVT LTD under SAC 998313 with 18% GST. Registered sellers can claim Input Tax Credit (ITC).
              </p>
            </div>
          </div>

          {commissionInvoices.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Commission Invoices Yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Platform fee invoices are generated automatically for fulfilled orders.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Service Description</th>
                    <th className="py-3 px-4">SAC Code</th>
                    <th className="py-3 px-4 text-right">Commission (₹)</th>
                    <th className="py-3 px-4 text-right">GST 18% (₹)</th>
                    <th className="py-3 px-4 text-right">Total Fee (₹)</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {commissionInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(inv.createdAt).toISOString().slice(0, 10)}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-sans">
                        Marketplace Intermediation (Order #{inv.orderId})
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        998313
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        ₹{(inv.taxableAmountPaise / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        ₹{(((inv.cgstPaise || 0) + (inv.sgstPaise || 0) + (inv.igstPaise || 0)) / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{(inv.netAmountPaise / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <Link
                          href={`/api/invoices/${inv.id}/render`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-semibold text-xs border border-slate-200 rounded px-2.5 py-1 bg-white hover:bg-slate-50 shadow-2xs"
                        >
                          <Printer className="w-3 h-3 text-slate-500" />
                          Print / ITC Doc
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "creditNotes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Statutory Credit Notes & Sales Reversals
            </h2>
            <span className="text-xs text-slate-500">
              Issued under Section 34 of CGST Act for cancellations and returns
            </span>
          </div>

          {creditNotes.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <RotateCcw className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Credit Notes Issued</h3>
              <p className="text-xs text-slate-500 mt-1">
                When items are cancelled or returned, official credit notes with tax reversal are tracked here.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Credit Note No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4 text-right">Taxable Reversal (₹)</th>
                    <th className="py-3 px-4 text-right">Total Reversal (₹)</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {creditNotes.map((cn: any) => (
                    <tr key={cn.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-rose-800">
                        {cn.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(cn.createdAt).toISOString().slice(0, 10)}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        #{cn.orderId}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-sans">
                        {cn.cancellationReason || "Return / Reversal"}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        ₹{(cn.taxableAmountPaise / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-800">
                        ₹{(cn.netAmountPaise / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <Link
                          href={`/api/invoices/${cn.id}/render`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-semibold text-xs border border-slate-200 rounded px-2.5 py-1 bg-white hover:bg-slate-50 shadow-2xs"
                        >
                          <Printer className="w-3 h-3 text-slate-500" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "caReports" && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
                  Statutory GST Filing Center
                </span>
                <h2 className="text-xl font-serif font-bold mt-1">
                  Monthly Chartered Accountant Reporting & Export Center
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Export ready-to-file GSTR-1 sales registers, HSN summaries, debit/credit notes, platform fee input tax statements, and bank settlement reconciliation reports.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono">Financial Year</label>
                  <select
                    value={selectedFy}
                    onChange={(e) => {
                      setSelectedFy(e.target.value);
                      loadCaReport(e.target.value, selectedMonth);
                    }}
                    className="bg-slate-900 text-white text-xs rounded border border-slate-700 px-2.5 py-1.5 font-mono"
                  >
                    <option value="2026-27">FY 2026-27</option>
                    <option value="2025-26">FY 2025-26</option>
                    <option value="2024-25">FY 2024-25</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono">Return Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      const m = parseInt(e.target.value, 10);
                      setSelectedMonth(m);
                      loadCaReport(selectedFy, m);
                    }}
                    className="bg-slate-900 text-white text-xs rounded border border-slate-700 px-2.5 py-1.5 font-mono"
                  >
                    {[
                      { m: 1, name: "January" },
                      { m: 2, name: "February" },
                      { m: 3, name: "March" },
                      { m: 4, name: "April" },
                      { m: 5, name: "May" },
                      { m: 6, name: "June" },
                      { m: 7, name: "July" },
                      { m: 8, name: "August" },
                      { m: 9, name: "September" },
                      { m: 10, name: "October" },
                      { m: 11, name: "November" },
                      { m: 12, name: "December" },
                    ].map((mo) => (
                      <option key={mo.m} value={mo.m}>
                        {mo.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <a
                href={`/api/seller/billing/ca-reports/export?financialYear=${selectedFy}&month=${selectedMonth}&type=sales`}
                download
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-center text-xs flex flex-col items-center gap-1 transition-colors"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span className="font-bold">GSTR-1 Sales</span>
                <span className="text-[10px] text-slate-400">CSV format</span>
              </a>

              <a
                href={`/api/seller/billing/ca-reports/export?financialYear=${selectedFy}&month=${selectedMonth}&type=invoices`}
                download
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-center text-xs flex flex-col items-center gap-1 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">Invoice Register</span>
                <span className="text-[10px] text-slate-400">Full audit</span>
              </a>

              <a
                href={`/api/seller/billing/ca-reports/export?financialYear=${selectedFy}&month=${selectedMonth}&type=creditNotes`}
                download
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-center text-xs flex flex-col items-center gap-1 transition-colors"
              >
                <Download className="w-4 h-4 text-rose-400" />
                <span className="font-bold">Credit Notes</span>
                <span className="text-[10px] text-slate-400">Reversals</span>
              </a>

              <a
                href={`/api/seller/billing/ca-reports/export?financialYear=${selectedFy}&month=${selectedMonth}&type=taxHsn`}
                download
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-center text-xs flex flex-col items-center gap-1 transition-colors"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span className="font-bold">HSN Summary</span>
                <span className="text-[10px] text-slate-400">Rate-wise</span>
              </a>

              <a
                href={`/api/seller/billing/ca-reports/export?financialYear=${selectedFy}&month=${selectedMonth}&type=commissions`}
                download
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-center text-xs flex flex-col items-center gap-1 transition-colors"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span className="font-bold">Platform Fees</span>
                <span className="text-[10px] text-slate-400">ITC statements</span>
              </a>

              <a
                href={`/api/seller/billing/ca-reports/export?financialYear=${selectedFy}&month=${selectedMonth}&type=settlements`}
                download
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-center text-xs flex flex-col items-center gap-1 transition-colors"
              >
                <Download className="w-4 h-4 text-blue-400" />
                <span className="font-bold">Settlements</span>
                <span className="text-[10px] text-slate-400">Bank ledger</span>
              </a>
            </div>
          </div>

          {isLoadingReport ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-600">Compiling monthly registers...</p>
            </div>
          ) : caReport ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <div className="text-[11px] uppercase font-mono text-slate-500 font-semibold">Total Gross Sales</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    ₹{((caReport.summaryTotals?.totalGrossSalesPaise || 0) / 100).toFixed(2)}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <div className="text-[11px] uppercase font-mono text-slate-500 font-semibold">Net Taxable Value</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    ₹{((caReport.summaryTotals?.netTaxableSalesPaise || 0) / 100).toFixed(2)}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <div className="text-[11px] uppercase font-mono text-slate-500 font-semibold">Total GST Output</div>
                  <div className="text-xl font-bold font-mono text-emerald-800 mt-1">
                    ₹{((caReport.summaryTotals?.netTaxCollectedPaise || 0) / 100).toFixed(2)}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <div className="text-[11px] uppercase font-mono text-slate-500 font-semibold">Platform Fee ITC</div>
                  <div className="text-xl font-bold font-mono text-purple-800 mt-1">
                    ₹{((caReport.summaryTotals?.totalPlatformGstPaidPaise || 0) / 100).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Table 12 — HSN-wise Summary of Outward Supplies
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {caReport.taxSummaryHsn?.length || 0} classifications
                  </span>
                </div>
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100/50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">HSN Code</th>
                      <th className="py-2.5 px-4 font-sans">Description</th>
                      <th className="py-2.5 px-4 text-center">Total Qty</th>
                      <th className="py-2.5 px-4 text-right">Rate %</th>
                      <th className="py-2.5 px-4 text-right">Taxable Value (₹)</th>
                      <th className="py-2.5 px-4 text-right">CGST (₹)</th>
                      <th className="py-2.5 px-4 text-right">SGST (₹)</th>
                      <th className="py-2.5 px-4 text-right">IGST (₹)</th>
                      <th className="py-2.5 px-4 text-right">Total Tax (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {caReport.taxSummaryHsn?.map((h: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{h.hsnCode}</td>
                        <td className="py-2.5 px-4 font-sans text-slate-800">{h.description}</td>
                        <td className="py-2.5 px-4 text-center">{h.totalUnits}</td>
                        <td className="py-2.5 px-4 text-right">{h.ratePercent}%</td>
                        <td className="py-2.5 px-4 text-right font-medium">₹{h.taxableAmountINR}</td>
                        <td className="py-2.5 px-4 text-right text-slate-600">₹{h.cgstINR}</td>
                        <td className="py-2.5 px-4 text-right text-slate-600">₹{h.sgstINR}</td>
                        <td className="py-2.5 px-4 text-right text-slate-600">₹{h.igstINR}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">₹{h.totalTaxINR}</td>
                      </tr>
                    ))}
                    {(!caReport.taxSummaryHsn || caReport.taxSummaryHsn.length === 0) && (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                          No transactions recorded in {caReport.monthName} {caReport.financialYear}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === "profile" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-3xl">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h2 className="text-lg font-serif font-bold text-slate-900">Seller Business & Statutory Tax Profile</h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure your registered entity name, GSTIN, PAN, and tax treatment classification.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Legal Business Name (as per PAN/GST)
                </label>
                <input
                  type="text"
                  value={profileForm.legalBusinessName || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, legalBusinessName: e.target.value })}
                  placeholder="e.g. Solstice Handlooms LLP"
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trade / Display Name (Customer Facing)
                </label>
                <input
                  type="text"
                  value={profileForm.tradeName || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, tradeName: e.target.value })}
                  placeholder="e.g. Solstice Atelier"
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-slate-900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GST Registration Classification
                </label>
                <select
                  value={profileForm.taxRegistrationType || "REGULAR"}
                  onChange={(e) => setProfileForm({ ...profileForm, taxRegistrationType: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-slate-900 font-mono"
                >
                  <option value="REGULAR">REGULAR (Full GST Registered, Tax Invoices, HSN)</option>
                  <option value="COMPOSITION">COMPOSITION (Section 10, Bill of Supply, 0% Tax)</option>
                  <option value="UNREGISTERED">UNREGISTERED (Artisan below threshold, Delivery Memo)</option>
                  <option value="EXEMPT">EXEMPT (Wholly exempt goods)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Constitution
                </label>
                <select
                  value={profileForm.businessConstitution || "INDIVIDUAL"}
                  onChange={(e) => setProfileForm({ ...profileForm, businessConstitution: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-slate-900 font-mono"
                >
                  <option value="INDIVIDUAL">Sole Proprietorship / Individual</option>
                  <option value="PARTNERSHIP">Partnership Firm</option>
                  <option value="LLP">Limited Liability Partnership (LLP)</option>
                  <option value="PRIVATE_LIMITED">Private Limited Company</option>
                  <option value="PUBLIC_LIMITED">Public Limited Company</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Permanent Account Number (PAN)
                </label>
                <input
                  type="text"
                  value={profileForm.pan || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, pan: e.target.value.toUpperCase() })}
                  placeholder="e.g. AAPFU0939F"
                  maxLength={10}
                  className="w-full text-xs font-mono uppercase border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GSTIN (15 Alphanumeric Characters)
                </label>
                <input
                  type="text"
                  value={profileForm.gstin || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value.toUpperCase() })}
                  placeholder="e.g. 27AAPFU0939F1ZV"
                  maxLength={15}
                  disabled={profileForm.taxRegistrationType !== "REGULAR"}
                  className="w-full text-xs font-mono uppercase border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                />
                {profileForm.taxRegistrationType !== "REGULAR" && (
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Unregistered and composition taxpayers do not issue customer tax with GSTIN.
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Principal Place of Business
                </label>
                <input
                  type="text"
                  value={profileForm.registeredAddress || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, registeredAddress: e.target.value })}
                  placeholder="Street, Studio Complex, Landmark"
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Origin State & GST Code
                </label>
                <input
                  type="text"
                  value={profileForm.registeredState || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, registeredState: e.target.value })}
                  placeholder="e.g. Maharashtra"
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Prefix (Max 6 Chars)
                </label>
                <input
                  type="text"
                  value={profileForm.invoicePrefix || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, invoicePrefix: e.target.value.toUpperCase() })}
                  placeholder="INV"
                  maxLength={6}
                  className="w-full text-xs font-mono uppercase border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Postal PIN Code
                </label>
                <input
                  type="text"
                  value={profileForm.pincode || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                  placeholder="e.g. 400001"
                  maxLength={6}
                  className="w-full text-xs font-mono border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-slate-900"
                />
              </div>
            </div>

            {profileForm.taxRegistrationType === "COMPOSITION" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Statutory Composition Declaration
                </label>
                <textarea
                  value={profileForm.compositionDeclaration || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, compositionDeclaration: e.target.value })}
                  rows={2}
                  className="w-full text-xs border border-slate-300 rounded p-2 text-slate-900 font-mono"
                  placeholder="Composition taxable person, not eligible to collect tax on supplies."
                />
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={isSavingProfile} className="text-xs">
                {isSavingProfile ? "Updating Ledger..." : "Save Statutory Tax Profile"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "compliance" && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">Upload & Register Statutory Documents</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Registered copies of GST Registration Certificate (REG-06), PAN Card, MSME/Udyam, or CA turnover declaration.
            </p>

            <form onSubmit={handleUploadComplianceDoc} className="flex flex-col sm:flex-row gap-3">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-800 font-mono"
              >
                <option value="GST_CERTIFICATE">GST Registration Certificate (REG-06)</option>
                <option value="PAN_CARD">Permanent Account Number (PAN)</option>
                <option value="MSME_CERTIFICATE">MSME / Udyam Certificate</option>
                <option value="CANCELLED_CHEQUE">Cancelled Cheque / Bank Proof</option>
                <option value="CA_DECLARATION">Chartered Accountant Declaration</option>
              </select>

              <input
                type="text"
                placeholder="Document file name (e.g. gstin_reg06_solstice.pdf)"
                value={docFileName}
                onChange={(e) => setDocFileName(e.target.value)}
                className="flex-1 text-xs border border-slate-300 rounded px-3 py-2 text-slate-900"
                required
              />

              <Button type="submit" disabled={isUploadingDoc} className="text-xs whitespace-nowrap">
                <Upload className="w-3.5 h-3.5 mr-1" />
                {isUploadingDoc ? "Saving..." : "Register Document"}
              </Button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-semibold text-xs text-slate-700">
              Registered Compliance Repository
            </div>
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100/50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-4 font-sans">Document Type</th>
                  <th className="py-2.5 px-4">Filename</th>
                  <th className="py-2.5 px-4 font-sans">Verification Status</th>
                  <th className="py-2.5 px-4">Added Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complianceDocs.map((doc: any) => (
                  <tr key={doc.id}>
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-900">
                      {doc.documentType.replace(/_/g, " ")}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {doc.fileName}
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      <Badge
                        variant="neutral"
                        className={
                          doc.verificationStatus === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }
                      >
                        {doc.verificationStatus}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(doc.createdAt).toISOString().slice(0, 10)}
                    </td>
                  </tr>
                ))}
                {complianceDocs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 font-sans">
                      No statutory documents registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "accountant" && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                Invite Chartered Accountant / Auditor
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Provide read-only, secure token-authenticated access to your monthly GSTR-1 sales registers and commission statements without sharing your primary studio login credentials.
            </p>

            <form onSubmit={handleInviteAccountant} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Accountant / Auditor Email
                  </label>
                  <input
                    type="email"
                    placeholder="ca.sharma@auditassociates.com"
                    value={caEmail}
                    onChange={(e) => setCaEmail(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2 text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Name of Practitioner
                  </label>
                  <input
                    type="text"
                    placeholder="CA Rajesh Sharma"
                    value={caName}
                    onChange={(e) => setCaName(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Firm / Association
                  </label>
                  <input
                    type="text"
                    placeholder="Sharma & Co. Chartered Accountants"
                    value={caFirm}
                    onChange={(e) => setCaFirm(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isInvitingCa} className="text-xs">
                  <Send className="w-3.5 h-3.5 mr-1" />
                  {isInvitingCa ? "Generating Token..." : "Issue CA Access Link"}
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-semibold text-xs text-slate-700">
              Active Accountant Access Grants
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/50 border-b border-slate-200 text-slate-600 font-mono">
                <tr>
                  <th className="py-2.5 px-4 font-sans">Recipient / CA</th>
                  <th className="py-2.5 px-4 font-sans">Firm</th>
                  <th className="py-2.5 px-4">Financial Years</th>
                  <th className="py-2.5 px-4">Expires</th>
                  <th className="py-2.5 px-4 text-center font-sans">Access Link</th>
                  <th className="py-2.5 px-4 text-center font-sans">Revoke</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {accountantInvitations.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="py-2.5 px-4 font-sans">
                      <div className="font-semibold text-slate-900">{inv.accountantName || "Auditor"}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{inv.email}</div>
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-700">
                      {inv.firmName || "Independent"}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {inv.financialYears}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(inv.expiresAt).toISOString().slice(0, 10)}
                    </td>
                    <td className="py-2.5 px-4 text-center font-sans">
                      <button
                        onClick={() => {
                          const link = `${window.location.origin}/api/ca/portal/${inv.token}`;
                          navigator.clipboard.writeText(link);
                          showToast("CA Secure Portal link copied to clipboard.", "info");
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2 py-1 hover:bg-indigo-100"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Link
                      </button>
                    </td>
                    <td className="py-2.5 px-4 text-center font-sans">
                      <button
                        onClick={() => handleRevokeAccountant(inv.id)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                        title="Revoke Grant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {accountantInvitations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 font-sans">
                      No accountant access grants currently active.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
