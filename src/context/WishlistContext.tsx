"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { Product } from "@/types/marketplace";
import { useAuth } from "@/context/AuthContext";

interface WishlistContextType {
  wishlistIds: string[];
  wishlistProducts: Product[];
  wishlistCount: number;
  isLoading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string, product?: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const LOCAL_STORAGE_WISHLIST_KEY = "nexu_marketplace_wishlist_v1";

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_WISHLIST_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
          setWishlistIds(parsed);
        }
      }
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_WISHLIST_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_WISHLIST_KEY, JSON.stringify(wishlistIds));
    } catch {
      // ignore
    }
  }, [wishlistIds, isHydrated]);

  // When user logs in, merge local storage wishlist with database
  const syncWithBackend = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      // If we have local guest wishlist IDs, merge them
      const localRaw = localStorage.getItem(LOCAL_STORAGE_WISHLIST_KEY);
      const localIds: string[] = localRaw ? JSON.parse(localRaw) : [];

      if (localIds.length > 0) {
        const mergeRes = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "merge", productIds: localIds }),
        });
        if (mergeRes.ok) {
          const data = await mergeRes.json();
          if (Array.isArray(data.items)) {
            const products = data.items.map((it: any) => it.product);
            const ids = data.items.map((it: any) => it.productId);
            setWishlistProducts(products);
            setWishlistIds(ids);
            localStorage.setItem(LOCAL_STORAGE_WISHLIST_KEY, JSON.stringify(ids));
            setIsLoading(false);
            return;
          }
        }
      }

      // Fetch user's wishlist from DB
      const res = await fetch("/api/wishlist");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) {
          const products = data.items.map((it: any) => it.product);
          const ids = data.items.map((it: any) => it.productId);
          setWishlistProducts(products);
          setWishlistIds(ids);
          localStorage.setItem(LOCAL_STORAGE_WISHLIST_KEY, JSON.stringify(ids));
        }
      }
    } catch (err) {
      console.error("Failed to sync wishlist with server:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      syncWithBackend();
    }
  }, [isAuthenticated, syncWithBackend]);

  const isWishlisted = (productId: string) => wishlistIds.includes(productId);

  const toggleWishlist = async (productId: string, product?: Product) => {
    const isCurrentlyWishlisted = wishlistIds.includes(productId);

    if (isCurrentlyWishlisted) {
      // Remove
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
      setWishlistProducts((prev) => prev.filter((p) => p.id !== productId));

      if (isAuthenticated) {
        try {
          await fetch("/api/wishlist", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          });
        } catch (e) {
          console.error("Wishlist remove error:", e);
        }
      }
    } else {
      // Add
      setWishlistIds((prev) => [...prev, productId]);
      if (product) {
        setWishlistProducts((prev) => [...prev.filter((p) => p.id !== productId), product]);
      }

      if (isAuthenticated) {
        try {
          const res = await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.items)) {
              setWishlistProducts(data.items.map((it: any) => it.product));
            }
          }
        } catch (e) {
          console.error("Wishlist add error:", e);
        }
      }
    }
  };

  const removeFromWishlist = async (productId: string) => {
    setWishlistIds((prev) => prev.filter((id) => id !== productId));
    setWishlistProducts((prev) => prev.filter((p) => p.id !== productId));

    if (isAuthenticated) {
      try {
        await fetch("/api/wishlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
      } catch (e) {
        console.error("Wishlist remove error:", e);
      }
    }
  };

  const clearWishlist = () => {
    setWishlistIds([]);
    setWishlistProducts([]);
    localStorage.removeItem(LOCAL_STORAGE_WISHLIST_KEY);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistProducts,
        wishlistCount: wishlistIds.length,
        isLoading,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};
