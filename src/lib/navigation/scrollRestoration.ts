/**
 * NEXU ATELIER — Precision Scroll Restoration & Navigation State Store
 *
 * Implements authoritative session-based scroll position recording,
 * history popstate detection, content-ready polling, and smooth position recovery.
 */

const STORAGE_PREFIX = "nexu_scroll_pos_";
const POPSTATE_FLAG = "nexu_is_popstate_nav";

export class ScrollRestorationEngine {
  private static isInitialized = false;
  private static lastRecordedPath = "";
  private static scrollDebounceTimer: NodeJS.Timeout | null = null;
  private static isRestoringScroll = false;
  private static restoreReleaseTimer: NodeJS.Timeout | null = null;

  /**
   * Initialize global listeners for scroll, link navigation, and popstate.
   */
  public static init(): () => void {
    if (typeof window === "undefined" || this.isInitialized) {
      return () => {};
    }

    this.isInitialized = true;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const handleScroll = () => {
      if (this.isRestoringScroll) return;

      if (this.scrollDebounceTimer) {
        clearTimeout(this.scrollDebounceTimer);
      }
      this.scrollDebounceTimer = setTimeout(() => {
        if (this.isRestoringScroll) return;
        const key = this.getStorageKey(window.location.pathname + window.location.search);
        try {
          sessionStorage.setItem(key, Math.round(window.scrollY).toString());
        } catch {}
      }, 50);
    };

    const handleBeforeUnload = () => {
      if (this.isRestoringScroll) return;
      const key = this.getStorageKey(window.location.pathname + window.location.search);
      try {
        sessionStorage.setItem(key, Math.round(window.scrollY).toString());
      } catch {}
    };

    const handlePopState = () => {
      try {
        sessionStorage.setItem(POPSTATE_FLAG, "1");
      } catch {}

      const fullPath = window.location.pathname + window.location.search;
      const key = this.getStorageKey(fullPath);
      let savedY = 0;
      try {
        const val = sessionStorage.getItem(key);
        if (val) savedY = parseInt(val, 10);
      } catch {}

      if (savedY > 0) {
        this.restoreScrollPosition(savedY);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (target && target.href && !target.target && target.origin === window.location.origin) {
        const key = this.getStorageKey(window.location.pathname + window.location.search);
        try {
          sessionStorage.setItem(key, Math.round(window.scrollY).toString());
          sessionStorage.removeItem(POPSTATE_FLAG); // User-initiated click -> Not popstate
        } catch {}
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleClick, { capture: true });
      this.isInitialized = false;
    };
  }

  /**
   * Called by router/layout when a new route mounts or pathname changes.
   */
  public static handleRouteChange(pathname: string, search: string): void {
    if (typeof window === "undefined") return;

    const fullPath = pathname + search;
    const key = this.getStorageKey(fullPath);

    let isPopstate = false;
    try {
      isPopstate = sessionStorage.getItem(POPSTATE_FLAG) === "1";
    } catch {}

    if (isPopstate) {
      try {
        sessionStorage.removeItem(POPSTATE_FLAG);
      } catch {}

      let savedY = 0;
      try {
        const val = sessionStorage.getItem(key);
        if (val) savedY = parseInt(val, 10);
      } catch {}

      if (savedY > 0) {
        this.restoreScrollPosition(savedY);
        return;
      }
    }

    if (fullPath !== this.lastRecordedPath) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }

    this.lastRecordedPath = fullPath;
  }

  /**
   * Intelligently waits for DOM elements / layout height to be available before scrolling.
   * Locks out scroll recording during restoration so transient 0 values don't overwrite saved position.
   */
  public static restoreScrollPosition(targetY: number): void {
    if (typeof window === "undefined" || targetY <= 0) return;

    this.isRestoringScroll = true;
    if (this.restoreReleaseTimer) clearTimeout(this.restoreReleaseTimer);

    const startTime = performance.now();
    const MAX_WAIT_MS = 2000;

    let attempts = 0;
    const maxAttempts = 5;

    const attemptRestore = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const maxScrollY = Math.max(0, scrollHeight - windowHeight);
      const effectiveY = Math.min(targetY, maxScrollY);

      window.scrollTo({
        top: effectiveY,
        left: 0,
        behavior: "instant",
      });

      attempts++;
      if (Math.abs(window.scrollY - targetY) > 50 && attempts < maxAttempts && performance.now() - startTime < 400) {
        requestAnimationFrame(attemptRestore);
      }
    };

    window.scrollTo({ top: targetY, left: 0, behavior: "instant" });
    requestAnimationFrame(attemptRestore);

    [50, 150, 300, 600].forEach((delay) => {
      setTimeout(() => {
        const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        window.scrollTo({
          top: Math.min(targetY, maxScrollY),
          left: 0,
          behavior: "instant",
        });
      }, delay);
    });

    this.restoreReleaseTimer = setTimeout(() => {
      this.isRestoringScroll = false;
    }, 700);
  }

  private static getStorageKey(pathAndSearch: string): string {
    return `${STORAGE_PREFIX}${pathAndSearch}`;
  }
}
