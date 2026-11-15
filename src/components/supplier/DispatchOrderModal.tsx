"use client";

import React, { useState } from "react";
import { X, Truck, User, Phone, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { StoreOrder, useStore } from "@/context/StoreContext";

interface DispatchOrderModalProps {
  order: StoreOrder | null;
  onClose: () => void;
}

export function DispatchOrderModal({ order, onClose }: DispatchOrderModalProps) {
  const { dispatchSellerOrder, showToast } = useStore();

  const [mode, setMode] = useState<"self" | "courier">("self");
  const [deliveryBoyName, setDeliveryBoyName] = useState("Ramesh Kumar (Staff Delivery)");
  const [deliveryBoyPhone, setDeliveryBoyPhone] = useState("+91 98200 12345");
  const [courierPartner, setCourierPartner] = useState("Blue Dart Express Priority");
  const [trackingAwb, setTrackingAwb] = useState(`BD-${Math.floor(10000000 + Math.random() * 90000000)}IN`);

  if (!order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const partner = mode === "self" ? `${deliveryBoyName} (${deliveryBoyPhone})` : courierPartner;
    const ref = mode === "self" ? `LOCAL-DEL-${order.id.slice(-4)}` : trackingAwb;

    dispatchSellerOrder(order.id, {
      mode,
      partner,
      trackingRef: ref,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/90 ring-1 ring-slate-900/10 bg-white/95 backdrop-blur-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1.5 pr-8">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-mono font-bold uppercase tracking-wider">
              DISPATCH CONSIGNMENT
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-950">
            Dispatch Order #{order.id}
          </h2>
          <p className="text-xs text-slate-500">
            Consign this packed parcel for doorstep delivery to <strong>{order.customerName}</strong> ({order.shippingAddress?.city}).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Select Dispatch Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("self")}
                className={`p-3.5 rounded-xl border text-left space-y-1 transition-all cursor-pointer ${
                  mode === "self"
                    ? "border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-950">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Self / Local Boy</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Your own shop staff or local bike courier (0% courier cuts).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode("courier")}
                className={`p-3.5 rounded-xl border text-left space-y-1 transition-all cursor-pointer ${
                  mode === "courier"
                    ? "border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-500/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-950">
                  <Truck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>3rd-Party Courier</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Blue Dart, Delhivery, XpressBees with AWB tracking link.
                </p>
              </button>
            </div>
          </div>

          {mode === "self" ? (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  Delivery Associate / Staff Name
                </label>
                <input
                  type="text"
                  required
                  value={deliveryBoyName}
                  onChange={(e) => setDeliveryBoyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Delivery Boy Phone Number (Sent to Customer)</span>
                </label>
                <input
                  type="text"
                  required
                  value={deliveryBoyPhone}
                  onChange={(e) => setDeliveryBoyPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  Select Courier Carrier
                </label>
                <select
                  value={courierPartner}
                  onChange={(e) => setCourierPartner(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Blue Dart Express Air Priority">Blue Dart Express (Air Priority)</option>
                  <option value="Delhivery Surface Express">Delhivery Surface Express</option>
                  <option value="XpressBees Priority Cargo">XpressBees Priority Cargo</option>
                  <option value="India Post Speed Post">India Post Speed Post</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  Tracking AWB Number
                </label>
                <input
                  type="text"
                  required
                  value={trackingAwb}
                  onChange={(e) => setTrackingAwb(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-98 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Confirm & Dispatch Consignment 🚚</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

