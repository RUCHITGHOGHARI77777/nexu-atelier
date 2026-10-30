"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Shield,
  Store,
  User as UserIcon,
  X,
  ShoppingBag,
  MapPin,
  Scale,
  ShieldAlert,
  Clock,
  Ban,
  CheckCircle,
} from "lucide-react";
import { AdminUserView, UserRole, AdminCustomerDetailView } from "@/types/admin";
import { formatDateTime, formatCurrency } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Customer 360-degree drawer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<AdminCustomerDetailView | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Suspension modal state
  const [suspendingUser, setSuspendingUser] = useState<AdminUserView | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [isSubmittingSuspension, setIsSubmittingSuspension] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to load user accounts.");
      }
    } catch {
      setActionError("Network error while loading user accounts.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCustomerDetail = async (userId: string) => {
    setSelectedCustomerId(userId);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerDetail(data.customer);
      } else {
        setActionError("Failed to fetch customer profile details.");
      }
    } catch {
      setActionError("Network error loading customer profile.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`User role updated to ${newRole}.`);
        fetchUsers();
      } else {
        setActionError(data.error || "Failed to update user role.");
      }
    } catch {
      setActionError("Network error while updating user role.");
    }
  };

  const handleToggleSuspension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingUser) return;

    const isSuspending = !suspendingUser.isSuspended;
    if (isSuspending && (!suspensionReason || suspensionReason.trim().length < 5)) {
      setActionError("A formal explanation (minimum 5 characters) is required to suspend an account.");
      return;
    }

    setIsSubmittingSuspension(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${suspendingUser.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isSuspended: isSuspending,
          reason: isSuspending ? suspensionReason.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(
          `Account for ${suspendingUser.email} has been ${isSuspending ? "suspended" : "reactivated"}.`
        );
        setSuspendingUser(null);
        setSuspensionReason("");
        fetchUsers();
        if (selectedCustomerId === suspendingUser.id) {
          openCustomerDetail(suspendingUser.id);
        }
      } else {
        setActionError(data.error || "Failed to update account suspension status.");
      }
    } catch {
      setActionError("Network error while updating account status.");
    } finally {
      setIsSubmittingSuspension(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="outline" className="border-amber-500/40 text-amber-300 font-mono text-[10px]">Super Admin</Badge>;
      case "SELLER":
        return <Badge variant="warning" className="font-mono text-[10px]">Artisan Studio</Badge>;
      case "CUSTOMER":
        return <Badge variant="neutral" className="font-mono text-[10px]">Patron</Badge>;
      default:
        return <Badge variant="neutral">{role}</Badge>;
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Access Governance & Patron CRM
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Customer & User Governance
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Authoritative directory of registered patrons, artisans, and administrators with 360° order histories, suspension governance, and audit trails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-zinc-500 hover:text-zinc-300 ml-4 font-mono text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-zinc-500 hover:text-zinc-300 ml-4 font-mono text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search accounts by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "ALL", label: "All Accounts" },
            { id: "CUSTOMER", label: "Patrons" },
            { id: "SELLER", label: "Artisans" },
            { id: "ADMIN", label: "Administrators" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${
                roleFilter === tab.id
                  ? "bg-zinc-200 text-zinc-950 font-medium"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-500 mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading user accounts...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center text-xs text-zinc-500">
          No users match your query.
        </div>
      ) : (
        <div className="border border-zinc-800 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-medium text-zinc-200 block text-xs">{u.name}</span>
                        <span className="text-[11px] text-zinc-500 font-mono">{u.email}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {getRoleBadge(u.role)}
                    </td>

                    <td className="py-3 px-4">
                      {u.isSuspended ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="border-rose-500/40 text-rose-400 text-[9px] font-mono">
                            Suspended
                          </Badge>
                          {u.suspensionReason && (
                            <span className="text-[10px] text-zinc-500 truncate max-w-[120px]" title={u.suspensionReason}>
                              ({u.suspensionReason})
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[9px] font-mono">
                          Active
                        </Badge>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-300">
                      {u.orderCount} order{u.orderCount !== 1 ? "s" : ""}
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-500 text-[11px]">
                      {formatDateTime(u.createdAt)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openCustomerDetail(u.id)}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[11px] text-zinc-300 font-mono transition-colors"
                        >
                          View 360°
                        </button>

                        <button
                          onClick={() => {
                            setSuspendingUser(u);
                            setSuspensionReason(u.suspensionReason || "");
                          }}
                          className={`px-2.5 py-1 border rounded text-[11px] font-mono transition-colors ${
                            u.isSuspended
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                          }`}
                        >
                          {u.isSuspended ? "Reactivate" : "Suspend"}
                        </button>

                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-zinc-300 focus:outline-none font-mono"
                        >
                          <option value="CUSTOMER">CUSTOMER</option>
                          <option value="SELLER">SELLER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer 360° Deep-Dive Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-100">
                    {customerDetail ? customerDetail.name : "Customer Intelligence"}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono">
                    {customerDetail?.email} • User ID: {selectedCustomerId}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedCustomerId(null);
                  setCustomerDetail(null);
                }}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-16 text-center text-zinc-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-400" />
                <p className="text-xs">Loading patron order history & dispute records...</p>
              </div>
            ) : customerDetail ? (
              <div className="space-y-6">
                {/* Stats Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded">
                    <span className="text-[10px] text-zinc-500 uppercase block">Total Spent</span>
                    <span className="text-base font-semibold text-emerald-400 mt-1 block">
                      {formatCurrency(customerDetail.totalSpent)}
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded">
                    <span className="text-[10px] text-zinc-500 uppercase block">Orders Placed</span>
                    <span className="text-base font-semibold text-zinc-100 mt-1 block">
                      {customerDetail.orders.length}
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded">
                    <span className="text-[10px] text-zinc-500 uppercase block">Disputes Lodged</span>
                    <span className="text-base font-semibold text-amber-400 mt-1 block">
                      {customerDetail.disputes.length}
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded">
                    <span className="text-[10px] text-zinc-500 uppercase block">Account State</span>
                    <span className={`text-base font-semibold mt-1 block ${customerDetail.isSuspended ? "text-rose-400" : "text-emerald-400"}`}>
                      {customerDetail.isSuspended ? "SUSPENDED" : "ACTIVE"}
                    </span>
                  </div>
                </div>

                {/* Shipping Addresses */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold block flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" /> Saved Delivery Coordinates
                  </span>
                  {customerDetail.addresses.length === 0 ? (
                    <p className="text-xs text-zinc-600 italic">No addresses saved.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {customerDetail.addresses.map((a) => (
                        <div key={a.id} className="p-3 bg-zinc-900/40 border border-zinc-800 rounded text-zinc-300">
                          <p>{a.street}</p>
                          <p className="text-zinc-500">{a.city}, {a.state} - {a.pincode}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Order History */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold block flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-zinc-500" /> Order History
                  </span>
                  {customerDetail.orders.length === 0 ? (
                    <p className="text-xs text-zinc-600 italic">No orders recorded for this customer.</p>
                  ) : (
                    <div className="border border-zinc-800 rounded overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-mono uppercase text-zinc-500">
                          <tr>
                            <th className="py-2 px-3">Order ID</th>
                            <th className="py-2 px-3">Amount</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Items</th>
                            <th className="py-2 px-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                          {customerDetail.orders.map((o) => (
                            <tr key={o.id}>
                              <td className="py-2 px-3 font-mono font-medium text-zinc-200">
                                #{o.id.slice(-8).toUpperCase()}
                              </td>
                              <td className="py-2 px-3 font-mono text-zinc-200 font-semibold">
                                {formatCurrency(o.total)}
                              </td>
                              <td className="py-2 px-3">
                                <Badge variant="neutral" className="text-[9px]">{o.status}</Badge>
                              </td>
                              <td className="py-2 px-3 text-zinc-400">
                                {o.items.length} item{o.items.length > 1 ? "s" : ""}
                              </td>
                              <td className="py-2 px-3 font-mono text-zinc-500 text-[11px]">
                                {formatDateTime(o.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Audit & Dispute History */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold block flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" /> Security & Dispute Audit Log
                  </span>
                  {customerDetail.auditEvents.length === 0 ? (
                    <p className="text-xs text-zinc-600 italic">No security incidents logged.</p>
                  ) : (
                    <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded space-y-2 max-h-48 overflow-y-auto text-xs font-mono">
                      {customerDetail.auditEvents.map((ev) => (
                        <div key={ev.id} className="flex items-start justify-between gap-2 border-b border-zinc-900 pb-1.5 last:border-0 last:pb-0">
                          <div>
                            <span className="text-zinc-300 font-medium">{ev.action}</span>
                            <p className="text-zinc-500 text-[11px] font-sans">{ev.note}</p>
                          </div>
                          <span className="text-[10px] text-zinc-600 shrink-0">
                            {formatDateTime(ev.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Suspension / Reactivation Modal */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleToggleSuspension}
            className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  {suspendingUser.isSuspended ? "Reactivate Patron Account" : "Suspend Patron Account"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSuspendingUser(null)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              {suspendingUser.isSuspended
                ? `You are about to restore full access for ${suspendingUser.name} (${suspendingUser.email}).`
                : `Suspending this account immediately prevents login, checkout, and new orders for ${suspendingUser.name} (${suspendingUser.email}).`}
            </p>

            {!suspendingUser.isSuspended && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-zinc-400">
                  Mandatory Formal Reason
                </label>
                <textarea
                  required
                  rows={3}
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Detail the rationale or policy violation (e.g. repeated payment disputes, abuse)..."
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSuspendingUser(null)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingSuspension}
                className={
                  suspendingUser.isSuspended
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-rose-600 hover:bg-rose-500 text-white"
                }
              >
                {isSubmittingSuspension
                  ? "Processing..."
                  : suspendingUser.isSuspended
                  ? "Confirm Reactivation"
                  : "Confirm Suspension"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
