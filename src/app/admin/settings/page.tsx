"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Save,
  Globe,
  Layout,
  Megaphone,
  Shield,
  Layers,
  FileText,
  Phone,
  Palette,
  Eye,
} from "lucide-react";
import { PlatformSettingView } from "@/types/admin";
import { formatDateTime } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface SettingGroup {
  id: string;
  label: string;
  icon: any;
  keys: string[];
}

const SETTING_GROUPS: SettingGroup[] = [
  {
    id: "branding",
    label: "Branding & Identity",
    icon: Globe,
    keys: ["site_title", "site_logo", "site_favicon", "theme_preset"],
  },
  {
    id: "homepage_hero",
    label: "Hero Masthead",
    icon: Layout,
    keys: ["homepage_hero_headline", "homepage_hero_subtitle", "homepage_hero_image"],
  },
  {
    id: "banners",
    label: "Storefront Banners",
    icon: Megaphone,
    keys: ["homepage_banner_text", "homepage_banner_enabled"],
  },
  {
    id: "sections",
    label: "Section Visibility",
    icon: Layers,
    keys: ["homepage_show_trending", "homepage_show_curated_categories", "homepage_show_artisan_studios"],
  },
  {
    id: "policies",
    label: "Marketplace Rules",
    icon: Shield,
    keys: [
      "marketplace_commission_percent",
      "free_shipping_threshold_inr",
      "patron_return_window_days",
      "escrow_clearance_hold_days",
      "support_email",
    ],
  },
  {
    id: "footer",
    label: "Footer & Support",
    icon: Phone,
    keys: ["footer_tagline", "footer_support_phone"],
  },
  {
    id: "legal",
    label: "Legal Policies",
    icon: FileText,
    keys: ["policy_returns_content", "policy_shipping_content", "policy_privacy_content"],
  },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettingView[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("branding");
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

  const currentGroup = SETTING_GROUPS.find((g) => g.id === activeTab) || SETTING_GROUPS[0];
  const groupSettings = settings.filter((s) => currentGroup.keys.includes(s.key));

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Storefront & Platform Governance
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Website Content & System Configuration
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage public storefront branding, hero masthead copy, notification banners, section visibility, and policies.
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

      {/* Group Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800">
        {SETTING_GROUPS.map((grp) => {
          const Icon = grp.icon;
          const isActive = activeTab === grp.id;
          return (
            <button
              key={grp.id}
              onClick={() => setActiveTab(grp.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded text-xs whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-zinc-100 text-zinc-950 font-medium"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{grp.label}</span>
            </button>
          );
        })}
      </div>

      {/* Settings Panel */}
      {isLoading ? (
        <div className="p-16 border border-zinc-800/80 rounded bg-zinc-900/20 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-500 mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading settings...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupSettings.map((s) => {
            const currentVal = editedValues[s.key] ?? s.value;
            const isChanged = currentVal !== s.value;
            const isTextarea = s.key.startsWith("policy_") || s.key === "footer_tagline" || s.key === "homepage_hero_subtitle";
            const isBoolean = s.key.endsWith("_enabled") || s.key.startsWith("homepage_show_");

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
                    Last updated {formatDateTime(s.updatedAt)}
                  </span>
                </div>

                <div className="pt-1">
                  {isBoolean ? (
                    <div className="flex items-center gap-3">
                      <select
                        value={currentVal}
                        onChange={(e) => handleValueChange(s.key, e.target.value)}
                        className="p-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono focus:outline-none"
                      >
                        <option value="true">Enabled (true)</option>
                        <option value="false">Disabled (false)</option>
                      </select>

                      {isChanged && (
                        <Button
                          size="sm"
                          onClick={() => handleSaveSetting(s.key)}
                          disabled={isSavingKey === s.key}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Save
                        </Button>
                      )}
                    </div>
                  ) : isTextarea ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={currentVal}
                        onChange={(e) => handleValueChange(s.key, e.target.value)}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 font-sans"
                      />
                      {isChanged && (
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleSaveSetting(s.key)}
                            disabled={isSavingKey === s.key}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 flex items-center gap-1.5"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Save Setting
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
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
