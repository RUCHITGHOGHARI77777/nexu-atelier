/**
 * Client-Side Auto-Draft Manager with Local + Server Synchronization
 * Never stores payment credentials, CVV, or identity documents.
 */

import { SupplierDraftData } from "@/types/listing-engine";

export type AutoDraftStatus = "IDLE" | "SAVING" | "SAVED" | "OFFLINE" | "SYNC_FAILED" | "CONFLICT";

export interface AutoDraftState {
  status: AutoDraftStatus;
  lastSavedAt: Date | null;
  serverVersion: number;
  clientVersion: number;
  hasConflict: boolean;
  conflictData?: SupplierDraftData | null;
  error?: string | null;
}

export class AutoDraftManager {
  private draftKey: string;
  private productId: string | null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private state: AutoDraftState;
  private onStateChange?: (state: AutoDraftState) => void;

  constructor(
    draftKey: string,
    productId: string | null = null,
    onStateChange?: (state: AutoDraftState) => void
  ) {
    this.draftKey = draftKey;
    this.productId = productId;
    this.onStateChange = onStateChange;

    this.state = {
      status: "IDLE",
      lastSavedAt: null,
      serverVersion: 1,
      clientVersion: 1,
      hasConflict: false,
      conflictData: null,
      error: null,
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleNetworkChange(true));
      window.addEventListener("offline", () => this.handleNetworkChange(false));
    }
  }

  private updateState(partial: Partial<AutoDraftState>) {
    this.state = { ...this.state, ...partial };
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  private handleNetworkChange(isOnline: boolean) {
    if (!isOnline) {
      this.updateState({ status: "OFFLINE" });
    } else if (this.state.status === "OFFLINE") {
      this.updateState({ status: "SAVED" });
    }
  }

  /**
   * Immediately saves draft payload to LocalStorage.
   */
  public saveLocal(data: SupplierDraftData): void {
    if (typeof window === "undefined") return;

    try {
      const storageKey = `nexu_draft_${this.draftKey}`;
      const payload = {
        draftKey: this.draftKey,
        productId: this.productId,
        data,
        clientVersion: this.state.clientVersion,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      this.updateState({
        status: navigator.onLine ? "SAVING" : "OFFLINE",
        lastSavedAt: new Date(),
      });
    } catch (err: any) {
      console.warn("Failed to write draft to LocalStorage:", err);
    }
  }

  /**
   * Retrieves locally stored draft if one exists.
   */
  public loadLocal(): { data: SupplierDraftData; savedAt: Date; clientVersion: number } | null {
    if (typeof window === "undefined") return null;

    try {
      const raw = localStorage.getItem(`nexu_draft_${this.draftKey}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        data: parsed.data,
        savedAt: new Date(parsed.savedAt),
        clientVersion: parsed.clientVersion || 1,
      };
    } catch {
      return null;
    }
  }

  /**
   * Schedules a debounced background sync to PostgreSQL via /api/seller/drafts.
   */
  public scheduleServerSync(data: SupplierDraftData, delayMs: number = 1000): void {
    this.saveLocal(data);

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.updateState({ status: "OFFLINE" });
      return;
    }

    this.debounceTimer = setTimeout(() => {
      this.syncServer(data);
    }, delayMs);
  }

  /**
   * Executes immediate background sync to server.
   */
  public async syncServer(data: SupplierDraftData): Promise<boolean> {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.updateState({ status: "OFFLINE" });
      return false;
    }

    this.updateState({ status: "SAVING", error: null });

    try {
      const res = await fetch("/api/seller/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftKey: this.draftKey,
          productId: this.productId,
          title: data.title,
          categoryId: data.categoryId,
          draftData: data,
          clientVersion: this.state.clientVersion,
        }),
      });

      if (res.status === 409) {
        const body = await res.json();
        this.updateState({
          status: "CONFLICT",
          hasConflict: true,
          conflictData: body.serverDraft?.draftData,
          error: "A newer draft version exists on the server.",
        });
        return false;
      }

      if (!res.ok) {
        throw new Error(`Sync HTTP error ${res.status}`);
      }

      const body = await res.json();
      const serverVer = body.draft?.version || this.state.clientVersion + 1;

      this.updateState({
        status: "SAVED",
        lastSavedAt: new Date(),
        serverVersion: serverVer,
        clientVersion: serverVer,
        hasConflict: false,
        error: null,
      });

      return true;
    } catch (err: any) {
      this.updateState({
        status: "SYNC_FAILED",
        error: err.message || "Failed to sync draft with server.",
      });
      return false;
    }
  }

  /**
   * Fetches latest draft from PostgreSQL server.
   */
  public async loadServer(): Promise<SupplierDraftData | null> {
    try {
      const res = await fetch(`/api/seller/drafts?draftKey=${encodeURIComponent(this.draftKey)}`);
      if (!res.ok) return null;
      const body = await res.json();
      if (body.draft) {
        this.updateState({
          serverVersion: body.draft.version,
          clientVersion: body.draft.version,
          lastSavedAt: new Date(body.draft.updatedAt),
        });
        return body.draft.draftData;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Discards the draft both locally and on the server.
   */
  public async discard(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`nexu_draft_${this.draftKey}`);
    }

    try {
      await fetch(`/api/seller/drafts?draftKey=${encodeURIComponent(this.draftKey)}`, {
        method: "DELETE",
      });
    } catch {}

    this.updateState({
      status: "IDLE",
      lastSavedAt: null,
      clientVersion: 1,
      serverVersion: 1,
      hasConflict: false,
      conflictData: null,
      error: null,
    });
  }
}
