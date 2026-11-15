"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Star,
  ArrowLeft,
  Building2,
  Home,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Address, AddressType } from "@/types/customer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

export default function SavedAddressesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [type, setType] = useState<AddressType>("home");
  const [isDefault, setIsDefault] = useState(false);

  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/account/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    } else if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isLoading, isAuthenticated, router, fetchAddresses]);

  const resetForm = () => {
    setFullName(user?.name || "");
    setPhone(user?.phone || "");
    setStreet("");
    setApartment("");
    setCity("");
    setState("");
    setPincode("");
    setType("home");
    setIsDefault(false);
    setFormError("");
    setEditingAddressId(null);
    setIsFormOpen(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setEditingAddressId(addr.id);
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setStreet(addr.street);
    setApartment(addr.apartment || "");
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
    setType(addr.type);
    setIsDefault(addr.isDefault);
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSaving(true);

    const payload = {
      fullName,
      phone,
      street,
      apartment,
      city,
      state,
      pincode,
      type,
      isDefault,
    };

    try {
      const url = editingAddressId
        ? `/api/account/addresses/${editingAddressId}`
        : "/api/account/addresses";
      const method = editingAddressId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save address.");
        setIsSaving(false);
        return;
      }

      setStatusMessage(
        editingAddressId
          ? "Address details updated."
          : "New delivery address added."
      );
      setTimeout(() => setStatusMessage(""), 3000);
      resetForm();
      await fetchAddresses();
    } catch {
      setFormError("Network error saving address.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`/api/account/addresses/${addressId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStatusMessage("Address removed.");
        setTimeout(() => setStatusMessage(""), 3000);
        await fetchAddresses();
      }
    } catch {
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const res = await fetch(`/api/account/addresses/${addressId}/default`, {
        method: "POST",
      });
      if (res.ok) {
        setStatusMessage("Default delivery location updated.");
        setTimeout(() => setStatusMessage(""), 3000);
        await fetchAddresses();
      }
    } catch {
    }
  };

  if (isLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-xs text-zinc-500 font-mono">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
        <div className="space-y-1">
          <Link
            href="/account"
            className="text-xs text-zinc-500 hover:text-zinc-950 flex items-center gap-1 mb-2 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Account Overview</span>
          </Link>
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest block font-medium">
            LOCATION ARCHIVE
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
            Saved Delivery Addresses
          </h1>
        </div>

        {!isFormOpen && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Address</span>
          </Button>
        )}
      </div>

      {statusMessage && (
        <Alert variant="success" title="Success">
          {statusMessage}
        </Alert>
      )}

      {isFormOpen && (
        <div className="p-6 sm:p-8 rounded-2xl border border-zinc-200 bg-white shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
              {editingAddressId ? "Edit Delivery Location" : "New Delivery Address"}
            </h2>
            <button
              onClick={resetForm}
              className="text-xs text-zinc-500 hover:text-zinc-950"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <Alert variant="error" title="Validation Notice">
              {formError}
            </Alert>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Recipient Full Name *"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aarav Mehta"
              />
              <Input
                label="10-digit Mobile Phone *"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
              />
            </div>

            <Input
              label="Flat / Floor / Street Address *"
              type="text"
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Unit 402, Highline Residency, Nariman Point"
            />

            <Input
              label="Apartment, Studio Suite, Landmark (Optional)"
              type="text"
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              placeholder="Tower B, Level 4"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="City *"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
              />
              <Input
                label="State *"
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Maharashtra"
              />
              <Input
                label="Postal PIN Code *"
                type="text"
                maxLength={6}
                required
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="400001"
              />
            </div>

            <div className="pt-2">
              <span className="text-xs font-semibold text-zinc-700 block mb-2">
                Address Type:
              </span>
              <div className="flex items-center gap-2">
                {(["home", "work", "studio"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                      type === t
                        ? "bg-white text-[#171717] border-2 border-[#171717] shadow-xs font-bold"
                        : "bg-[#FAFAF8] text-[#626262] border-[#E8E8E4] hover:bg-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer pt-1 select-none">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-zinc-900"
              />
              <span>Set as default delivery address for 1-click checkout</span>
            </label>

            <div className="flex items-center gap-3 pt-3 border-t border-zinc-200">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
              >
                <span>Save Address</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={resetForm}
              >
                <span>Cancel</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {isFetching ? (
        <div className="py-12 text-center text-xs text-zinc-500 font-mono">
          Loading saved locations...
        </div>
      ) : addresses.length === 0 ? (
        <div className="py-16 text-center space-y-4 rounded-2xl border border-zinc-200 bg-white shadow-xs p-6">
          <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 mx-auto">
            <MapPin className="w-6 h-6 stroke-1" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-950">
              No saved addresses yet
            </h3>
            <p className="text-xs text-zinc-600 max-w-sm mx-auto">
              Add your home, office, or studio address for rapid checkout and courier scheduling.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            Add Address Now
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                addr.isDefault
                  ? "border-zinc-950 bg-white shadow-md ring-1 ring-zinc-900/15"
                  : "border-zinc-200 bg-white shadow-xs hover:border-zinc-300 hover:shadow-sm"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {addr.type === "home" ? (
                      <Home className="w-4 h-4 text-zinc-500" />
                    ) : addr.type === "studio" ? (
                      <Building2 className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <Briefcase className="w-4 h-4 text-zinc-500" />
                    )}
                    <span className="font-bold text-xs uppercase tracking-wider text-zinc-950">
                      {addr.type}
                    </span>
                  </div>

                  {addr.isDefault && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200 font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-zinc-600 text-zinc-600" />
                      Default
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-zinc-700">
                  <p className="font-bold text-zinc-950 text-sm">{addr.fullName}</p>
                  <p className="leading-relaxed">
                    {addr.street}
                    {addr.apartment ? `, ${addr.apartment}` : ""}
                  </p>
                  <p>
                    {addr.city}, {addr.state} —{" "}
                    <span className="font-mono font-medium">{addr.pincode}</span>
                  </p>
                  <p className="text-zinc-500 font-mono text-[11px] pt-1">
                    Phone: {addr.phone}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenEdit(addr)}
                    className="text-zinc-600 hover:text-zinc-950 flex items-center gap-1 transition-colors font-medium"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-zinc-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-zinc-600 hover:text-zinc-950 text-[11px] font-medium transition-colors"
                  >
                    Set as default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
