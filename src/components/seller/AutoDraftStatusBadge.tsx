"use client";

import React from "react";
import { AutoDraftStatus } from "@/lib/client/auto-draft-manager";
import { Check, CloudOff, AlertCircle, RefreshCw, Trash2 } from "lucide-react";

interface AutoDraftStatusBadgeProps {
  status: AutoDraftStatus;
  lastSavedAt: Date | null;
  onDiscard?: () => void;
  onRetrySync?: () => void;
}

export function AutoDraftStatusBadge({
  status,
  lastSavedAt,
  onDiscard,
  onRetrySync,
}: AutoDraftStatusBadgeProps) {
  const formatTime = (d: Date | null) => {
    if (!d) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full text-xs font-medium border bg-white shadow-xs">
      {status === "SAVING" && (
        <span className="flex items-center gap-1.5 text-zinc-600">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
          <span>Saving draft...</span>
        </span>
      )}

      {status === "SAVED" && (
        <span className="flex items-center gap-1.5 text-emerald-700">
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          <span>Autosaved {lastSavedAt ? `at ${formatTime(lastSavedAt)}` : "locally & server"}</span>
        </span>
      )}

      {status === "OFFLINE" && (
        <span className="flex items-center gap-1.5 text-amber-700">
          <CloudOff className="w-3.5 h-3.5 text-amber-500" />
          <span>Offline — draft preserved locally</span>
        </span>
      )}

      {status === "SYNC_FAILED" && (
        <span className="flex items-center gap-1.5 text-rose-700">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          <span>Sync failed (draft preserved locally)</span>
          {onRetrySync && (
            <button
              type="button"
              onClick={onRetrySync}
              className="underline hover:text-rose-900 ml-1 font-semibold"
            >
              Retry
            </button>
          )}
        </span>
      )}

      {status === "CONFLICT" && (
        <span className="flex items-center gap-1.5 text-amber-700">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          <span>Newer draft found on server</span>
        </span>
      )}

      {status === "IDLE" && (
        <span className="text-zinc-400">Autosave active</span>
      )}

      {onDiscard && (
        <button
          type="button"
          onClick={onDiscard}
          title="Discard stored draft"
          className="text-zinc-400 hover:text-rose-600 transition-colors ml-1 p-0.5"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
