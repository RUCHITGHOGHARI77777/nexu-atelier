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

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<AdminCustomerDetailView | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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
      const res = await fetch(`/api/admin/users/${userId}/detail`);
      if (res.ok) {
        const data = await res.json();
        setCustomerDetail(data.customer || null);
      } else {
        setCustomerDetail(null);
      }
    } catch {
      setCustomerDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`User role updated to ${newRole}`);
        fetchUsers();
      } else {
        setActionError(data.error || "Failed to update role");
      }
    } catch {
      setActionError("Network error while changing user role.");
    }
  };

  const handleToggleSuspension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingUser) return;

    const isSuspending = !suspendingUser.isSuspended;
    if (isSuspending && !suspensionReason.trim()) {
      setActionError("A formal rationale is required to suspend an account.");
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
        return <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-50 font-mono text-[10px]">Super Admin</Badge>;
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
    <div className="space-y-8 font-sans text-slate-900 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
            Access Governance &amp; Patron CRM
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-slate-950 mt-1">
            Customer &amp; User Governance
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Authoritative directory of registered patrons, artisans, and administrators with 360° order histories, suspension governance, and audit trails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-slate-500 hover:text-slate-900 ml-4 font-mono text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-slate-500 hover:text-slate-900 ml-4 font-mono text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search accounts by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
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
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                roleFilter === tab.id
                  ? "bg-slate-950 text-white font-semibold shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 border border-slate-200 rounded-xl bg-white text-center shadow-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-xs text-slate-600">Loading user accounts...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-16 border border-slate-200 rounded-xl bg-white text-center text-xs text-slate-500 shadow-xs">
          No users match your query.
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Account Status</th>
                  <th className="py-3 px-4 font-semibold">Orders</th>
                  <th className="py-3 px-4 font-semibold">Joined Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-semibold text-slate-950 block text-xs">{u.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{u.email}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {getRoleBadge(u.role)}
                    </td>

                    <td className="py-3 px-4">
                      {u.isSuspended ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="border-rose-300 text-rose-700 bg-rose-50 text-[9px] font-mono">
                            Suspended
                          </Badge>
                          {u.suspensionReason && (
                            <span className="text-[10px] text-slate-500 truncate max-w-[120px]" title={u.suspensionReason}>
                              ({u.suspensionReason})
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 text-[9px] font-mono">
                          Active
                        </Badge>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700">
                      {u.orderCount} order{u.orderCount !== 1 ? "s" : ""}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {formatDateTime(u.createdAt)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openCustomerDetail(u.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[11px] text-slate-800 font-mono transition-colors cursor-pointer"
                        >
                          View 360°
                        </button>

                        <button
                          onClick={() => {
                            setSuspendingUser(u);
                            setSuspensionReason(u.suspensionReason || "");
                          }}
                          className={`px-2.5 py-1 border rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                            u.isSuspended
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                              : "bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100"
                          }`}
                        >
                          {u.isSuspended ? "Reactivate" : "Suspend"}
                        </button>

                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-800 focus:outline-none font-mono cursor-pointer"
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

      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6 p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-serif text-slate-950">
                    {customerDetail ? customerDetail.name : "Customer Intelligence"}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    {customerDetail?.email} • User ID: {selectedCustomerId}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedCustomerId(null);
                  setCustomerDetail(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-16 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                <p className="text-xs">Loading patron order history &amp; dispute records...</p>
              </div>
            ) : customerDetail ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Spent</span>
                    <span className="text-base font-bold text-slate-950 mt-1 block">
                      {formatCurrency(customerDetail.totalSpent)}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Orders Placed</span>
                    <span className="text-base font-bold text-slate-950 mt-1 block">
                      {customerDetail.orders.length}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Disputes Lodged</span>
                    <span className="text-base font-bold text-amber-700 mt-1 block">
                      {customerDetail.disputes.length}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Account State</span>
                    <span className={`text-base font-bold mt-1 block ${customerDetail.isSuspended ? "text-rose-700" : "text-emerald-700"}`}>
                      {customerDetail.isSuspended ? "SUSPENDED" : "ACTIVE"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase text-slate-700 font-semibold block flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" /> Saved Delivery Coordinates
                  </span>
                  {customerDetail.addresses.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No addresses saved.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {customerDetail.addresses.map((a) => (
                        <div key={a.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                          <p className="font-semibold">{a.street}</p>
                          <p className="text-slate-500">{a.city}, {a.state} - {a.pincode}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase text-slate-700 font-semibold block flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-slate-500" /> Order History
                  </span>
                  {customerDetail.orders.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No orders recorded for this customer.</p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase text-slate-600">
                          <tr>
                            <th className="py-2 px-3 font-semibold">Order ID</th>
                            <th className="py-2 px-3 font-semibold">Amount</th>
                            <th className="py-2 px-3 font-semibold">Status</th>
                            <th className="py-2 px-3 font-semibold">Items</th>
                            <th className="py-2 px-3 font-semibold">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {customerDetail.orders.map((o) => (
                            <tr key={o.id} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                                #{o.id.slice(-8).toUpperCase()}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-900 font-semibold">
                                {formatCurrency(o.total)}
                              </td>
                              <td className="py-2 px-3">
                                <Badge variant="neutral" className="text-[9px]">{o.status}</Badge>
                              </td>
                              <td className="py-2 px-3 text-slate-600">
                                {o.items.length} item{o.items.length > 1 ? "s" : ""}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">
                                {formatDateTime(o.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase text-slate-700 font-semibold block flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-500" /> Security &amp; Dispute Audit Log
                  </span>
                  {customerDetail.auditEvents.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No security incidents logged.</p>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 max-h-48 overflow-y-auto text-xs font-mono">
                      {customerDetail.auditEvents.map((ev) => (
                        <div key={ev.id} className="flex items-start justify-between gap-2 border-b border-slate-200 pb-1.5 last:border-0 last:pb-0">
                          <div>
                            <span className="text-slate-900 font-semibold">{ev.action}</span>
                            <p className="text-slate-600 text-[11px] font-sans">{ev.note}</p>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0">
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

      {suspendingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleToggleSuspension}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold font-serif text-slate-950">
                  {suspendingUser.isSuspended ? "Reactivate Patron Account" : "Suspend Patron Account"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSuspendingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {suspendingUser.isSuspended
                ? `You are about to restore full access for ${suspendingUser.name} (${suspendingUser.email}).`
                : `Suspending this account immediately prevents login, checkout, and new orders for ${suspendingUser.name} (${suspendingUser.email}).`}
            </p>

            {!suspendingUser.isSuspended && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-700 font-semibold">
                  Mandatory Formal Reason
                </label>
                <textarea
                  required
                  rows={3}
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Detail the rationale or policy violation (e.g. repeated payment disputes, abuse)..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
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
                    ? "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                    : "bg-rose-700 hover:bg-rose-800 text-white cursor-pointer"
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
