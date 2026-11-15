"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/types/marketplace";
import { SEED_PRODUCTS } from "@/data/seedCatalog";

interface CompareContextType {
  compareProducts: Product[];
  addToCompare: (product: Product) => boolean;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "nexu_compare_items";

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareProducts, setCompareProducts] = useState<Product[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        if (Array.isArray(ids)) {
          const matched = ids
            .map((id) => SEED_PRODUCTS.find((p) => p.id === id))
            .filter((p): p is Product => Boolean(p));
          setCompareProducts(matched);
        }
      }
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      const ids = compareProducts.map((p) => p.id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ids));
    } catch {
    }
  }, [compareProducts, isHydrated]);

  const addToCompare = (product: Product): boolean => {
    if (compareProducts.some((p) => p.id === product.id)) {
      return false; // already in compare
    }
    if (compareProducts.length >= 4) {
      return false;
    }
    setCompareProducts((prev) => [...prev, product]);
    return true;
  };

  const removeFromCompare = (productId: string) => {
    setCompareProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const clearCompare = () => {
    setCompareProducts([]);
  };

  const isInCompare = (productId: string): boolean => {
    return compareProducts.some((p) => p.id === productId);
  };

  return (
    <CompareContext.Provider
      value={{
        compareProducts,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
