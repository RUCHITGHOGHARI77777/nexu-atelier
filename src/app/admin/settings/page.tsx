"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Save,
  Sliders,
  ShieldAlert,
} from "lucide-react";
import { PlatformSettingView } from "@/types/admin";
import { formatDateTime } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettingView[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingKey, setIsSavingKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        const list: PlatformSettingView[] = data.settings || [];
        setSettings(list);
        const map: Record<string, string> = {};
        list.forEach((s) => {
          map[s.key] = s.value;
        });
        setEditedValues(map);
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to load platform settings.");
      }
    } catch {
      setActionError("Network error while loading platform configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleValueChange = (key: string, val: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveSetting = async (key: string) => {
    const val = editedValues[key];
    if (val === undefined) return;

    setIsSavingKey(key);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: val }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Configuration key "${key}" saved.`);
        fetchSettings();
      } else {
        setActionError(data.error || "Failed to update setting.");
      }
    } catch {
      setActionError("Network error while updating configuration.");
    } finally {
      setIsSavingKey(null);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Platform Configuration
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Global Marketplace Policies
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Configure system-wide commissions, shipping thresholds, customer return policies, and concierge contacts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
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

      {/* Settings Grid */}
      {isLoading ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-500 mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading platform configuration...</p>
        </div>
      ) : settings.length === 0 ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center text-xs text-zinc-500">
          No platform settings defined.
        </div>
      ) : (
        <div className="space-y-4">
          {settings.map((s) => {
            const currentVal = editedValues[s.key] ?? s.value;
            const isChanged = currentVal !== s.value;

            return (
              <div
                key={s.key}
                className="p-5 bg-zinc-950/60 border border-zinc-800 rounded space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-semibold text-zinc-200">
                      {s.key}
                    </span>
                    {s.description && (
                      <p className="text-xs text-zinc-400 mt-0.5">{s.description}</p>
                    )}
                  </div>

                  <span className="text-[10px] text-zinc-500 font-mono">
                    Last altered {formatDateTime(s.updatedAt)}
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Input
                    value={currentVal}
                    onChange={(e) => handleValueChange(s.key, e.target.value)}
                    className="font-mono text-xs"
                  />

                  {isChanged && (
                    <Button
                      size="sm"
                      onClick={() => handleSaveSetting(s.key)}
                      disabled={isSavingKey === s.key}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Key
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
