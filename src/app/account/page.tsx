"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Package,
  MapPin,
  LogOut,
  Edit2,
  Check,
  ShieldCheck,
  ArrowRight,
  Clock,
  Download,
  Trash2,
  Shield,
  X,
  AlertTriangle,
  RotateCcw,
  LifeBuoy,
  Bell,
  Heart,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

export default function AccountOverviewPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateProfile, logout } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [showErasureModal, setShowErasureModal] = useState(false);
  const [erasureReason, setErasureReason] = useState("");
  const [isSubmittingErasure, setIsSubmittingErasure] = useState(false);
  const [erasureSuccess, setErasureSuccess] = useState("");
  const [erasureError, setErasureError] = useState("");

  const handleDownloadArchive = async () => {
    if (!user) return;
    try {
      setIsExporting(true);
      const res = await fetch("/api/account/export");
      if (!res.ok) throw new Error("Failed to generate archive");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexu-patron-data-${user.id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to download data archive");
    } finally {
      setIsExporting(false);
    }
  };

  const handleErasureRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingErasure(true);
      setErasureError("");
      const res = await fetch("/api/account/delete-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: erasureReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setErasureSuccess(data.message);
      setTimeout(() => {
        setShowErasureModal(false);
      }, 4000);
    } catch (err: any) {
      setErasureError(err.message || "Failed to submit erasure request");
    } finally {
      setIsSubmittingErasure(false);
    }
  };

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-xs text-zinc-500 font-mono">Authenticating session...</p>
      </div>
    );
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    const result = await updateProfile({ name, phone });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to update profile.");
    } else {
      setSuccess("Profile details updated successfully.");
      setIsEditing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest block font-medium">
            PATRON OVERVIEW
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
            Welcome, {user.name}
          </h1>
          <p className="text-xs text-zinc-600">
            Manage your personal profile, delivery locations, and studio orders.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="self-start sm:self-auto flex items-center gap-1.5 text-rose-600 border-zinc-200 hover:bg-rose-50 hover:border-rose-300 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </Button>
      </div>

      {success && (
        <Alert variant="success" title="Profile Updated">
          {success}
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/account/orders"
          className="p-5 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-xs hover:shadow-sm space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 group-hover:text-zinc-950 transition-colors">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-950 flex items-center justify-between">
              <span>My Orders</span>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-transform group-hover:translate-x-1" />
            </h3>
            <p className="text-xs text-zinc-600 mt-1">
              Inspect order history, tracking stages, and cancellations.
            </p>
          </div>
        </Link>

        <Link
          href="/account/returns"
          className="p-5 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-xs hover:shadow-sm space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 group-hover:text-zinc-950 transition-colors">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-950 flex items-center justify-between">
              <span>Returns & Replacements</span>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-transform group-hover:translate-x-1" />
            </h3>
            <p className="text-xs text-zinc-600 mt-1">
              Reverse pickups, quality audits, refunds, and replacements.
            </p>
          </div>
        </Link>

        <Link
          href="/account/tickets"
          className="p-5 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-xs hover:shadow-sm space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800 group-hover:text-blue-950 transition-colors">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-950 flex items-center justify-between">
              <span>Support Concierge</span>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-transform group-hover:translate-x-1" />
            </h3>
            <p className="text-xs text-zinc-600 mt-1">
              Open support tickets and converse directly with our studio team.
            </p>
          </div>
        </Link>

        <Link
          href="/account/notifications"
          className="p-5 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-xs hover:shadow-sm space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-800 group-hover:text-purple-950 transition-colors">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-950 flex items-center justify-between">
              <span>Notification Center</span>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-transform group-hover:translate-x-1" />
            </h3>
            <p className="text-xs text-zinc-600 mt-1">
              Delivery milestones, return approvals, and atelier alerts.
            </p>
          </div>
        </Link>

        <Link
          href="/account/addresses"
          className="p-5 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-xs hover:shadow-sm space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 group-hover:text-zinc-950 transition-colors">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-950 flex items-center justify-between">
              <span>Saved Addresses</span>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-transform group-hover:translate-x-1" />
            </h3>
            <p className="text-xs text-zinc-600 mt-1">
              Maintain delivery addresses for 1-click checkout.
            </p>
          </div>
        </Link>

        <Link
          href="/account/privacy"
          className="p-5 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-xs hover:shadow-sm space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 group-hover:text-emerald-950 transition-colors">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-950 flex items-center justify-between">
              <span>Privacy & Security</span>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-transform group-hover:translate-x-1" />
            </h3>
            <p className="text-xs text-zinc-600 mt-1">
              DPDP Act 2023 consents, OTP verification, and payment records.
            </p>
          </div>
        </Link>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 font-bold text-sm">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-950">
                Personal Credentials & Contact
              </h2>
              <p className="text-xs text-zinc-500 font-mono">
                Patron ID: {user.id}
              </p>
            </div>
          </div>

          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </Button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-4 max-w-lg">
            {error && (
              <Alert variant="error" title="Update Error">
                {error}
              </Alert>
            )}

            <Input
              label="Full Name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Contact Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              helperText="For dispatch SMS and courier coordination."
            />

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                className="flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setError("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div className="space-y-1">
              <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">
                Full Name
              </span>
              <p className="text-zinc-950 font-semibold text-sm">{user.name}</p>
            </div>
            <div className="space-y-1">
              <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">
                Email Address
              </span>
              <p className="text-zinc-950 font-mono text-sm font-semibold">{user.email}</p>
            </div>
            <div className="space-y-1">
              <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">
                Mobile Phone
              </span>
              <p className="text-zinc-950 font-mono text-sm font-semibold">
                {user.phone || "Not specified"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 sm:p-8 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-800">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-950">
                Data Sovereignty & Privacy
              </h2>
              <p className="text-xs text-zinc-600">
                Exercise your statutory data portability and privacy rights under Indian DPDP & global standards.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50 space-y-3">
            <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Personal Archive</span>
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Download a cryptographically verified JSON archive containing your full purchase manifest, payment records, delivery locations, and reviews.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadArchive}
              disabled={isExporting}
              className="text-xs font-mono border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"
            >
              {isExporting ? "Compiling Archive..." : "Download Data (.json)"}
            </Button>
          </div>

          <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50 space-y-3">
            <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Account Erasure Request</span>
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Submit a formal request to pseudonymize your profile credentials and revoke active marketing communications after statutory tax/warranty retention.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowErasureModal(true)}
              className="text-xs font-mono"
            >
              Request Account Erasure
            </Button>
          </div>
        </div>
      </div>

      {showErasureModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-erasure-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative space-y-4 text-zinc-900">
            <button
              type="button"
              onClick={() => setShowErasureModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-red-600 text-xs font-mono uppercase tracking-wider font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Right to Erasure Notice</span>
            </div>

            <h3 id="account-erasure-modal-title" className="text-lg font-bold text-zinc-950">
              Confirm Erasure Request
            </h3>

            {erasureSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed">
                {erasureSuccess}
              </div>
            ) : (
              <form onSubmit={handleErasureRequest} className="space-y-4">
                {erasureError && (
                  <p className="text-xs text-red-600 font-medium">{erasureError}</p>
                )}
                <p className="text-xs text-zinc-600 leading-relaxed">
                  In compliance with tax, financial, and consumer protection regulations, past invoices and order fulfillment records must be preserved in cold escrow logs for 7 years. Your active credentials and saved addresses will be scheduled for permanent pseudonymization.
                </p>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-700 mb-1 font-medium">
                    Reason for Deletion (Optional)
                  </label>
                  <textarea
                    value={erasureReason}
                    onChange={(e) => setErasureReason(e.target.value)}
                    placeholder="Help us improve: privacy preference, no longer needed, duplicate account..."
                    rows={3}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowErasureModal(false)}
                    disabled={isSubmittingErasure}
                    className="w-full sm:w-auto px-4 py-2 border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    disabled={isSubmittingErasure}
                    isLoading={isSubmittingErasure}
                    className="w-full sm:w-auto px-4 py-2 !bg-red-600 hover:!bg-red-700 active:!bg-red-800 !text-white hover:!text-white focus:!text-white active:!text-white !border-red-600 hover:!border-red-700 font-semibold cursor-pointer shadow-sm transition-colors"
                  >
                    {isSubmittingErasure ? "Submitting..." : "Confirm Erasure Request"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
