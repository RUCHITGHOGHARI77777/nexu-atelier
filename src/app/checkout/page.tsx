"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  MapPin,
  Truck,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Building2,
  AlertCircle,
  Tag,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Address, AddressType } from "@/types/customer";
import { DELIVERY_METHODS } from "@/lib/server/order-service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { formatCurrency } from "@/lib/formatters";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { items, totals, clearCart } = useCart();

  // Multi-step: 1 = Address, 2 = Delivery Method, 3 = Review & Place Order
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Address Selection & Creation
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // New Address Form fields
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newApartment, setNewApartment] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [newType, setNewType] = useState<AddressType>("home");

  // Delivery Method Selection
  const [selectedDeliveryMethodId, setSelectedDeliveryMethodId] = useState<
    "standard" | "express"
  >("standard");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Promotional Coupon Engine
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountINR: number;
    discountPaise: number;
    description?: string | null;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/account/addresses");
      if (res.ok) {
        const data = await res.json();
        const list: Address[] = data.addresses || [];
        setSavedAddresses(list);
        if (list.length > 0) {
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          setSelectedAddressId(defaultAddr.id);
        } else {
          setIsAddingNewAddress(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login?redirect=/checkout");
    } else if (isAuthenticated) {
      fetchAddresses();
      if (user) {
        setNewFullName(user.name);
        setNewPhone(user.phone || "");
      }
    }
  }, [isAuthLoading, isAuthenticated, user, router, fetchAddresses]);

  // If bag is empty, redirect to cart
  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart");
    }
  }, [items, router]);

  // Delivery fee & Grand Total calculation
  const deliveryMethod = DELIVERY_METHODS[selectedDeliveryMethodId];
  let calculatedShippingFee = deliveryMethod.baseFee;
  if (selectedDeliveryMethodId === "standard" && totals.subtotal >= 2500) {
    calculatedShippingFee = 0;
  }
  const couponDiscountINR = appliedCoupon ? appliedCoupon.discountINR : 0;
  const calculatedGrandTotal = Math.max(
    0,
    totals.subtotal + calculatedShippingFee - couponDiscountINR
  );

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponError("");
    setIsApplyingCoupon(true);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponInput.trim(),
          subtotal: totals.subtotal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponError(data.error || "Ineligible or invalid coupon code.");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          code: couponInput.trim().toUpperCase(),
          discountINR: data.discountINR,
          discountPaise: data.discountPaise,
          description: data.coupon?.description,
        });
        setCouponError("");
      }
    } catch {
      setCouponError("Failed to validate voucher against studio database.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const handleValidateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (isAddingNewAddress) {
      if (!newFullName.trim() || newFullName.length < 2) {
        setErrorMessage("Please enter recipient's full name.");
        return;
      }
      const cleanPhone = newPhone.replace(/\D/g, "");
      if (cleanPhone.length < 10) {
        setErrorMessage("Please provide a valid 10-digit mobile phone number.");
        return;
      }
      if (!newStreet.trim() || newStreet.length < 4) {
        setErrorMessage("Please provide a valid street / building address.");
        return;
      }
      if (!newCity.trim() || !newState.trim()) {
        setErrorMessage("City and State are required.");
        return;
      }
      const cleanPin = newPincode.replace(/\D/g, "");
      if (cleanPin.length !== 6) {
        setErrorMessage("Please provide a valid 6-digit postal PIN code.");
        return;
      }
    } else {
      if (!selectedAddressId) {
        setErrorMessage("Please select a saved delivery address or add a new one.");
        return;
      }
    }

    setStep(2);
  };

  const handlePlaceOrder = async () => {
    setErrorMessage("");
    setIsSubmitting(true);

    const payload = {
      items: items.map((i) => ({
        productId: i.productId,
        selectedColorName: i.selectedColor?.name,
        selectedSize: i.selectedSize,
        quantity: i.quantity,
      })),
      shippingAddressId: isAddingNewAddress ? undefined : selectedAddressId,
      newAddress: isAddingNewAddress
        ? {
            fullName: newFullName,
            phone: newPhone,
            street: newStreet,
            apartment: newApartment || undefined,
            city: newCity,
            state: newState,
            pincode: newPincode,
            country: "India",
            type: newType,
          }
        : undefined,
      deliveryMethodId: selectedDeliveryMethodId,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      idempotencyKey: `idemp_${Date.now()}_${items.length}`,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Order validation failed.");
        setIsSubmitting(false);
        return;
      }

      // Success: clear cart and route to confirmation
      clearCart();
      router.push(`/checkout/confirmation?orderId=${data.order.id}`);
    } catch {
      setErrorMessage("Network error placing order. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || !user || items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-xs text-zinc-500 font-mono">Preparing checkout session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest block font-medium">
            ESCROW SECURE CHECKOUT
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
            Checkout Commission
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>256-Bit Escrow Hold</span>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="flex items-center gap-4 text-xs font-semibold pb-2 border-b border-zinc-200">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 pb-2 border-b-2 transition-colors ${
            step === 1
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] text-zinc-700">
            1
          </span>
          <span>Delivery Address</span>
        </button>

        <span className="text-zinc-300">/</span>

        <button
          onClick={() => {
            if (selectedAddressId || isAddingNewAddress) setStep(2);
          }}
          className={`flex items-center gap-2 pb-2 border-b-2 transition-colors ${
            step === 2
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] text-zinc-700">
            2
          </span>
          <span>Courier Method</span>
        </button>

        <span className="text-zinc-300">/</span>

        <button
          onClick={() => {
            if (selectedAddressId || isAddingNewAddress) setStep(3);
          }}
          className={`flex items-center gap-2 pb-2 border-b-2 transition-colors ${
            step === 3
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] text-zinc-700">
            3
          </span>
          <span>Review & Place Order</span>
        </button>
      </div>

      {errorMessage && (
        <Alert variant="error" title="Checkout Notice">
          {errorMessage}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Step Body */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: Address Selection */}
          {step === 1 && (
            <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-zinc-600" />
                  <span>Select Destination Address</span>
                </h2>
                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewAddress((prev) => !prev)}
                    className="text-xs text-zinc-700 hover:text-zinc-950 underline font-medium"
                  >
                    {isAddingNewAddress
                      ? "Choose from saved addresses"
                      : "+ Enter a new address"}
                  </button>
                )}
              </div>

              {!isAddingNewAddress && savedAddresses.length > 0 ? (
                <div className="space-y-3">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        selectedAddressId === addr.id
                          ? "border-zinc-900 bg-zinc-50 shadow-xs"
                          : "border-zinc-200 bg-white hover:border-zinc-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address_select"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 w-4 h-4 text-zinc-900 bg-white border-zinc-300"
                      />
                      <div className="space-y-0.5 text-xs text-zinc-700">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-950">
                            {addr.fullName}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium">
                            {addr.type}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[10px] text-emerald-700 font-semibold">
                              (Default)
                            </span>
                          )}
                        </div>
                        <p>
                          {addr.street}
                          {addr.apartment ? `, ${addr.apartment}` : ""}
                        </p>
                        <p>
                          {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                        <p className="text-zinc-500 font-mono text-[11px]">
                          Phone: {addr.phone}
                        </p>
                      </div>
                    </label>
                  ))}

                  <div className="pt-4 flex justify-end">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setStep(2)}
                      className="flex items-center gap-2"
                    >
                      <span>Continue to Courier Method</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleValidateAddress} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Recipient Full Name *"
                      type="text"
                      required
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="e.g. Aarav Mehta"
                    />
                    <Input
                      label="10-digit Mobile Phone *"
                      type="tel"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="9876543210"
                    />
                  </div>

                  <Input
                    label="Flat / Floor / Building Address *"
                    type="text"
                    required
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    placeholder="Unit 402, Highline Residency, Nariman Point"
                  />

                  <Input
                    label="Apartment, Studio Suite, Landmark (Optional)"
                    type="text"
                    value={newApartment}
                    onChange={(e) => setNewApartment(e.target.value)}
                    placeholder="Tower B"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="City *"
                      type="text"
                      required
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      placeholder="Mumbai"
                    />
                    <Input
                      label="State *"
                      type="text"
                      required
                      value={newState}
                      onChange={(e) => setNewState(e.target.value)}
                      placeholder="Maharashtra"
                    />
                    <Input
                      label="Postal PIN Code *"
                      type="text"
                      maxLength={6}
                      required
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value)}
                      placeholder="400001"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-600 font-medium">Type:</span>
                      {(["home", "work", "studio"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNewType(t)}
                          className={`px-2.5 py-1 rounded text-xs capitalize border transition-colors ${
                            newType === t
                              ? "bg-zinc-950 text-white font-bold border-zinc-950"
                              : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <Button type="submit" variant="primary" size="md">
                      <span>Proceed to Courier Method →</span>
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: Delivery Method Selection */}
          {step === 2 && (
            <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-6">
              <div className="pb-3 border-b border-zinc-200 flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4 text-zinc-600" />
                  <span>Choose Courier Dispatch Speed</span>
                </h2>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-zinc-600 hover:text-zinc-950"
                >
                  ← Edit Address
                </button>
              </div>

              <div className="space-y-4">
                {Object.values(DELIVERY_METHODS).map((method) => {
                  const isFree =
                    method.id === "standard" && totals.subtotal >= 2500;
                  const feeDisplay = isFree
                    ? "Complimentary (Orders > ₹2,500)"
                    : formatCurrency(method.baseFee);

                  return (
                    <label
                      key={method.id}
                      className={`p-4 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                        selectedDeliveryMethodId === method.id
                          ? "border-zinc-900 bg-zinc-50 shadow-xs"
                          : "border-zinc-200 bg-white hover:border-zinc-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="delivery_method"
                          checked={selectedDeliveryMethodId === method.id}
                          onChange={() =>
                            setSelectedDeliveryMethodId(
                              method.id as "standard" | "express"
                            )
                          }
                          className="mt-1 w-4 h-4 text-zinc-900 bg-white border-zinc-300"
                        />
                        <div className="space-y-1 text-xs text-zinc-700">
                          <p className="font-bold text-zinc-950 text-sm">
                            {method.name}
                          </p>
                          <p className="text-zinc-600 text-xs">
                            {method.description}
                          </p>
                          <span className="font-mono text-[11px] text-zinc-500 block pt-0.5">
                            Estimated Transit: {method.estimatedDays} business day
                            {method.estimatedDays > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-zinc-950 block">
                          {feeDisplay}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-zinc-200">
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                  ← Back to Address
                </Button>
                <Button variant="primary" size="md" onClick={() => setStep(3)}>
                  <span>Review Final Order →</span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Final Review & Order Placement */}
          {step === 3 && (
            <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-6">
              <div className="pb-3 border-b border-zinc-200 flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-600" />
                  <span>Final Order & Escrow Review</span>
                </h2>
                <button
                  onClick={() => setStep(2)}
                  className="text-xs text-zinc-600 hover:text-zinc-950"
                >
                  ← Edit Courier
                </button>
              </div>

              {/* Order items recap */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">
                  Commissioned Pieces ({items.length})
                </h4>
                <div className="divide-y divide-zinc-200 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 rounded-md overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                          <ImageWithFallback
                            src={
                              item.selectedColor?.image ||
                              item.product.images[0]
                            }
                            alt={item.product.title}
                            fill
                            sizes="50px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-950">
                            {item.product.title}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {item.product.vendor.name} • Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-zinc-950">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Gateway Sandbox Mode Notice */}
              <Alert
                variant="info"
                title="Payment Integration — Sandbox Test Mode"
                className="text-xs"
              >
                Sandbox test mode is active (Razorpay / Test Gateway). No real payment card will be debited. Transactions, cryptographic checksums, and inventory locks are authoritatively validated on the server.
              </Alert>

              <div className="pt-4 flex items-center justify-between border-t border-zinc-200">
                <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                  ← Back to Courier
                </Button>

                <Button
                  variant="accent"
                  size="lg"
                  onClick={handlePlaceOrder}
                  isLoading={isSubmitting}
                  className="font-bold flex items-center gap-2"
                >
                  <span>
                    Authorize & Place Order ({formatCurrency(calculatedGrandTotal)})
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-zinc-950 uppercase tracking-wider">
              Summary
            </h3>

            <div className="space-y-2 text-zinc-600 divide-y divide-zinc-100">
              <div className="flex items-center justify-between pt-2">
                <span>Items ({totals.itemCount}):</span>
                <span className="font-mono text-zinc-950 font-medium">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span>Courier Dispatch:</span>
                <span className="font-mono text-zinc-950 font-medium">
                  {calculatedShippingFee === 0
                    ? "Complimentary"
                    : formatCurrency(calculatedShippingFee)}
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex items-center justify-between pt-2 text-emerald-700">
                  <span>Voucher ({appliedCoupon.code}):</span>
                  <span className="font-mono font-bold">
                    -{formatCurrency(couponDiscountINR)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span>Estimated GST Included (12%):</span>
                <span className="font-mono text-zinc-950 font-medium">
                  {formatCurrency(totals.estimatedTax)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 font-bold text-sm text-zinc-950">
                <span>Total Payable:</span>
                <span className="font-mono text-base font-black text-zinc-950">
                  {formatCurrency(calculatedGrandTotal)}
                </span>
              </div>
            </div>

            {/* Promotional Voucher Input */}
            <div className="pt-3 border-t border-zinc-200 space-y-2">
              <span className="text-[11px] font-medium text-zinc-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                <span>Promotional Voucher</span>
              </span>

              {appliedCoupon ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-emerald-800 text-xs">
                      {appliedCoupon.code}
                    </span>
                    <p className="text-[10px] text-zinc-600">
                      {appliedCoupon.description || `Savings: -₹${appliedCoupon.discountINR.toLocaleString("en-IN")}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-zinc-500 hover:text-rose-600 p-1 transition-colors"
                    title="Remove voucher"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="e.g. NEXUFIRST"
                      className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-950 uppercase placeholder-zinc-400 focus:outline-none focus:border-zinc-400 font-mono"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      isLoading={isApplyingCoupon}
                      disabled={!couponInput.trim()}
                    >
                      Apply
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-[10px] text-rose-600">{couponError}</p>
                  )}
                  <p className="text-[10px] text-zinc-500">
                    Try <span className="font-mono text-zinc-700">NEXUFIRST</span> or <span className="font-mono text-zinc-700">ATELIER10</span>
                  </p>
                </form>
              )}
            </div>

            <div className="pt-2 text-[11px] text-zinc-500 font-mono space-y-1">
              <p>• Verified directly against studio database</p>
              <p>• Duplicate submission protection active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
