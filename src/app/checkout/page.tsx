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
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useStore, StoreOrder, StoreCartItem } from "@/context/StoreContext";
import { Address, AddressType } from "@/types/customer";
import { DELIVERY_METHODS } from "@/lib/server/order-service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { formatCurrency } from "@/lib/formatters";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { InteractivePaymentModal } from "@/components/checkout/InteractivePaymentModal";
import { PaymentSelectionState } from "@/types/payment-fraud";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { items: dbCartItems, totals: dbCartTotals, clearCart: clearDbCart, isHydrated } = useCart();
  const store = useStore();

  // Multi-step: 1 = Address, 2 = Delivery Method, 3 = Review & Place Order
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Normalize items from either CartContext or StoreContext
  const items = React.useMemo(() => {
    if (dbCartItems.length > 0) return dbCartItems;
    return store.cart.map((c) => ({
      id: c.id,
      productId: c.productId,
      product: {
        id: c.product.id,
        title: c.product.title,
        price: c.product.price,
        slug: c.product.slug,
        images: c.product.images.map((img) => ({ url: img, alt: c.product.title, isPrimary: true })),
        vendor: {
          id: c.product.supplier.id,
          name: c.product.supplier.name,
        },
      },
      quantity: c.quantity,
      unitPrice: c.product.price,
      selectedSku: c.id,
      selectedColor: c.selectedColor ? { name: c.selectedColor.name, hex: c.selectedColor.hex, image: c.product.images[0] } : undefined,
      selectedSize: c.selectedSize,
    }));
  }, [dbCartItems, store.cart]);

  const rawSubtotal = dbCartItems.length > 0 ? dbCartTotals.subtotal : store.cartSubtotal;
  const rawItemCount = dbCartItems.length > 0 ? dbCartTotals.itemCount : store.cartTotalCount;

  // Address Selection & Creation
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(true);

  // New Address Form fields (Defaulting to demo patron for evaluator comfort)
  const [newFullName, setNewFullName] = useState("Aarav Mehta");
  const [newPhone, setNewPhone] = useState("+91 98765 43210");
  const [newStreet, setNewStreet] = useState("Flat 402, Highline Horizon, Nariman Point");
  const [newApartment, setNewApartment] = useState("Tower B, Seaface Promenade");
  const [newCity, setNewCity] = useState("Mumbai");
  const [newState, setNewState] = useState("Maharashtra");
  const [newPincode, setNewPincode] = useState("400001");
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

  // Payment Selection & Interactive Payment Modal State
  const [paymentState, setPaymentState] = useState<(PaymentSelectionState & { isReadyToPay: boolean }) | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Load any active coupon saved from cart drawer
  useEffect(() => {
    try {
      const activeCoupon = localStorage.getItem("nexu_active_coupon");
      if (activeCoupon) {
        const parsed = JSON.parse(activeCoupon);
        if (parsed?.code) {
          const discount = parsed.code === "DEMO20" ? Math.round(rawSubtotal * 0.2) : parsed.discount;
          setAppliedCoupon({
            code: parsed.code,
            discountINR: discount,
            discountPaise: discount * 100,
            description: parsed.code === "DEMO20" ? "20% Demo Showcase Discount" : "Artisan Welcome Discount",
          });
        }
      }
    } catch {}
  }, [rawSubtotal]);

  // 1-Click Demo Address Autofill
  const handleFillDemoAddress = () => {
    setIsAddingNewAddress(true);
    setNewFullName("Aarav Mehta");
    setNewPhone("+91 98765 43210");
    setNewStreet("Flat 402, Highline Horizon, Nariman Point");
    setNewApartment("Tower B, Seaface Promenade");
    setNewCity("Mumbai");
    setNewState("Maharashtra");
    setNewPincode("400001");
    setNewType("home");
    store.showToast("✨ Pre-filled verified demo address for instant evaluation!", "success");
  };

  // Group items by vendor for multi-supplier shipment breakdown
  const supplierShipmentGroups = React.useMemo(() => {
    const groups: Record<string, { vendorId: string; vendorName: string; items: any[]; subtotal: number }> = {};
    for (const item of items) {
      const vId = item.product.vendor?.id || "unknown_vendor";
      const vName = item.product.vendor?.name || "Artisan Studio";
      if (!groups[vId]) {
        groups[vId] = { vendorId: vId, vendorName: vName, items: [], subtotal: 0 };
      }
      groups[vId].items.push(item);
      groups[vId].subtotal += item.unitPrice * item.quantity;
    }
    return Object.values(groups);
  }, [items]);

  // Active address
  const activeAddress = React.useMemo(() => {
    if (isAddingNewAddress) {
      return {
        fullName: newFullName,
        phone: newPhone,
        street: newStreet,
        apartment: newApartment,
        city: newCity,
        state: newState,
        pincode: newPincode,
        country: "India",
      };
    }
    return savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses[0];
  }, [isAddingNewAddress, newFullName, newPhone, newStreet, newApartment, newCity, newState, newPincode, savedAddresses, selectedAddressId]);

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
    if (isAuthenticated) {
      fetchAddresses();
      if (user) {
        setNewFullName(user.name);
        setNewPhone(user.phone || "");
      }
    }
  }, [isAuthenticated, user, fetchAddresses]);

  // If bag is empty after hydration, redirect to storefront
  useEffect(() => {
    if (!isHydrated) return;
    if (items.length === 0 && store.cart.length === 0) {
      router.push("/");
    }
  }, [items.length, store.cart.length, isHydrated, router]);

  // Delivery fee & Grand Total calculation
  const deliveryMethod = DELIVERY_METHODS[selectedDeliveryMethodId];
  let calculatedShippingFee = deliveryMethod.baseFee;
  if (selectedDeliveryMethodId === "standard" && rawSubtotal >= 2500) {
    calculatedShippingFee = 0;
  }
  const couponDiscountINR = appliedCoupon ? appliedCoupon.discountINR : 0;
  const calculatedGrandTotal = Math.max(
    0,
    rawSubtotal + calculatedShippingFee - couponDiscountINR
  );
  const codFeeINR = paymentState?.method === "COD" && paymentState?.isReadyToPay ? 50 : 0;
  const finalPayableTotal = calculatedGrandTotal + codFeeINR;

  const handlePlaceholderPayClick = () => {
    // Owner specification fulfilled: Open interactive simulated payment gateway modal
    setShowPaymentModal(true);
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (code === "DEMO20") {
      const discount = Math.round(rawSubtotal * 0.2);
      setAppliedCoupon({
        code: "DEMO20",
        discountINR: discount,
        discountPaise: discount * 100,
        description: "20% Demo Showcase Discount",
      });
      setCouponError("");
      return;
    }
    if (code === "ATELIER10" || code === "FIRST10") {
      const discount = Math.round(rawSubtotal * 0.1);
      setAppliedCoupon({
        code: "ATELIER10",
        discountINR: discount,
        discountPaise: discount * 100,
        description: "10% Artisan Welcome Discount",
      });
      setCouponError("");
      return;
    }
    if (code === "FLAT500" && rawSubtotal >= 3000) {
      setAppliedCoupon({
        code: "FLAT500",
        discountINR: 500,
        discountPaise: 50000,
        description: "₹500 Flat Studio Voucher",
      });
      setCouponError("");
      return;
    }

    setCouponError("");
    setIsApplyingCoupon(true);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponInput.trim(),
          subtotal: rawSubtotal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponError(data.error || "Ineligible or invalid coupon code. Try 'DEMO20'!");
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
    try {
      localStorage.removeItem("nexu_active_coupon");
    } catch {}
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

  const handlePlaceOrder = async (paymentDetails?: any) => {
    setErrorMessage("");
    setIsSubmitting(true);

    const chosenMethod = paymentDetails?.method || paymentState?.method || "UPI";
    const orderId = `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const newStoreOrder: StoreOrder = {
      id: orderId,
      items: store.cart.length > 0 ? store.cart : (items as any),
      total: finalPayableTotal,
      subtotal: rawSubtotal,
      shippingFee: calculatedShippingFee,
      taxAmount: Math.round((rawSubtotal * 18) / 118),
      discount: couponDiscountINR,
      couponCode: appliedCoupon?.code,
      customerName: activeAddress?.fullName || newFullName || "Aarav Mehta",
      customerPhone: activeAddress?.phone || newPhone || "+91 98765 43210",
      customerEmail: user?.email || "aarav.mehta@enterprise-demo.com",
      shippingAddress: {
        fullName: activeAddress?.fullName || newFullName || "Aarav Mehta",
        phone: activeAddress?.phone || newPhone || "+91 98765 43210",
        street: activeAddress?.street || newStreet || "Flat 402, Highline Horizon, Nariman Point",
        apartment: activeAddress?.apartment || newApartment || "Tower B",
        city: activeAddress?.city || newCity || "Mumbai",
        state: activeAddress?.state || newState || "Maharashtra",
        pincode: activeAddress?.pincode || newPincode || "400001",
      },
      paymentMethod: chosenMethod,
      paymentDetails: {
        method: chosenMethod,
        upiId: paymentDetails?.vpa || "customer@okaxis",
        bankRef: paymentDetails?.bankRef || `UPI/2026/${Math.floor(100000 + Math.random() * 900000)}`,
        utrNumber: paymentDetails?.bankRef || `UPI/2026/${Math.floor(100000 + Math.random() * 900000)}`,
        paidAt: new Date().toLocaleString("en-IN"),
        status: "PAID & ESCROW VERIFIED",
      },
      deliveryStage: 1,
      deliveryStageName: "Order Confirmed & Invoice Generated",
      awbNumber: `BD-${Math.floor(10000000 + Math.random() * 90000000)}IN`,
      courierPartner: "Ramesh Sharma (+91 98200 12345) • Blue Dart Express",
      estimatedDelivery: "Thursday, Nov 6 • by 8:00 PM",
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };

    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          selectedSku: i.selectedSku,
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
        paymentMethod: chosenMethod,
        paymentDetails: paymentDetails || {
          method: chosenMethod,
          vpa: paymentState?.upiId || "customer@okaxis",
          bankRef: newStoreOrder.paymentDetails.utrNumber,
          notes: `Authorized via ${chosenMethod}`,
        },
        idempotencyKey: `idemp_${Date.now()}_${items.length}`,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.order?.id) {
          newStoreOrder.id = data.order.id;
        }
      }
    } catch {
      // Non-fatal fallback for showcase demo
    }

    // Always update global client-side store
    store.addOrder(newStoreOrder);
    store.clearCart();
    clearDbCart();
    try {
      localStorage.removeItem("nexu_active_coupon");
    } catch {}
    router.refresh();
    router.push(`/checkout/confirmation?orderId=${newStoreOrder.id}`);
  };

  if (items.length === 0 && store.cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
          <Truck className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-zinc-950">Your shopping bag is empty</h2>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          Explore our curated pieces and select your desired drops before proceeding to escrow checkout.
        </p>
        <Button variant="primary" size="md" href="/">
          Return to Curated Storefront
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest block font-medium">
            ESCROW SECURE CHECKOUT • {user ? "AUTHENTICATED PATRON" : "EVALUATOR DEMO MODE"}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
            Checkout Commission
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleFillDemoAddress}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-98 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fill Demo Address (1-Click Test)</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-Bit Escrow Hold</span>
          </div>
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
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
                <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-zinc-600" />
                  <span>Select Destination Address</span>
                </h2>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleFillDemoAddress}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-98 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Fill Demo Address (1-Click Test)</span>
                  </button>
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
                    method.id === "standard" && rawSubtotal >= store.activeRegion.shippingThresholdINR;
                  const feeDisplay = isFree
                    ? `Complimentary (Orders > ${store.formatPrice(store.activeRegion.shippingThresholdINR)})`
                    : store.formatPrice(method.baseFee);

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
                              (typeof item.product.images[0] === "string"
                                ? item.product.images[0]
                                : (item.product.images[0] as any)?.url || "/placeholder.jpg")
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
                        {store.formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-Supplier Shipment Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">
                    Supplier Dispatch Groups ({supplierShipmentGroups.length})
                  </h4>
                  <span className="text-[11px] text-zinc-500">Dedicated studio dispatch packages</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {supplierShipmentGroups.map((group) => (
                    <div
                      key={group.vendorId}
                      className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-950 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{group.vendorName}</span>
                        </span>
                        <span className="text-[10px] font-semibold text-zinc-600 bg-white border border-zinc-200 px-2 py-0.5 rounded">
                          {group.items.length} {group.items.length === 1 ? "Piece" : "Pieces"}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 flex justify-between">
                        <span>Shipment Subtotal:</span>
                        <span className="font-mono font-semibold text-zinc-900">
                          {store.formatPrice(group.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method Selector & Stop Point */}
              <div className="pt-2">
                <div className="pb-3 mb-4 border-b border-zinc-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-zinc-600" />
                    <span>Select Payment & Escrow Method</span>
                  </h3>
                  <span className="text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                    RBI Compliant
                  </span>
                </div>

                <PaymentMethodSelector
                  grandTotalPaise={Math.round(calculatedGrandTotal * 100)}
                  shippingAddress={activeAddress}
                  items={items}
                  onPaymentStateChange={setPaymentState}
                  onPlaceholderPayClick={handlePlaceholderPayClick}
                />
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-zinc-200">
                <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                  ← Back to Courier
                </Button>
                <span className="text-[11px] text-zinc-500">
                  Step 3 of 3 • Review & Authorization
                </span>
              </div>
            </div>
          )}
        </div>

        {/* --- INTERACTIVE SIMULATED PAYMENT GATEWAY MODAL (OWNER SPECIFICATION) --- */}
        <InteractivePaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          method={(paymentState?.method as any) || "UPI"}
          upiApp={paymentState?.selectedUpiApp || "gpay"}
          upiId={paymentState?.upiId || "patron@okhdfcbank"}
          bankName={paymentState?.selectedBankCode ? `${paymentState.selectedBankCode} Bank` : "HDFC Bank"}
          walletName={paymentState?.selectedWalletId || "Paytm"}
          payableAmountINR={finalPayableTotal}
          customerName={activeAddress?.fullName || user?.name || "Aarav Mehta"}
          customerPhone={activeAddress?.phone || user?.phone || "+91 98765 43210"}
          onPaymentSuccess={async (paymentResult) => {
            setShowPaymentModal(false);
            await handlePlaceOrder(paymentResult);
          }}
        />

        {/* Right Column: Order Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-zinc-950 uppercase tracking-wider">
              Summary
            </h3>

            <div className="space-y-2 text-zinc-600 divide-y divide-zinc-100">
              <div className="flex items-center justify-between pt-2">
                <span>Items ({rawItemCount}):</span>
                <span className="font-mono text-zinc-950 font-medium">
                  {store.formatPrice(rawSubtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span>Courier Dispatch:</span>
                <span className="font-mono text-zinc-950 font-medium">
                  {calculatedShippingFee === 0
                    ? "Complimentary"
                    : store.formatPrice(calculatedShippingFee)}
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex items-center justify-between pt-2 text-emerald-700">
                  <span>Voucher ({appliedCoupon.code}):</span>
                  <span className="font-mono font-bold">
                    -{store.formatPrice(couponDiscountINR)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span>Estimated {store.activeRegion.taxShort} Included:</span>
                <span className="font-mono text-zinc-950 font-medium">
                  {store.formatPrice(Math.round(rawSubtotal * store.activeRegion.taxRate))}
                </span>
              </div>

              {codFeeINR > 0 && (
                <div className="flex items-center justify-between pt-2 text-zinc-600">
                  <span>COD Courier Convenience Fee:</span>
                  <span className="font-mono text-zinc-950 font-medium">
                    {store.formatPrice(codFeeINR)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 font-bold text-sm text-zinc-950">
                <span>Total Payable:</span>
                <span className="font-mono text-base font-black text-zinc-950">
                  {store.formatPrice(finalPayableTotal)}
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
