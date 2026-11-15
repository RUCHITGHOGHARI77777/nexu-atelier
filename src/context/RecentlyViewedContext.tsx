"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface ViewedProductItem {
  id: string;
  slug: string;
  title: string;
  pricePaise: number;
  image: string;
  category: string;
  vendorName: string;
  rating?: number;
  viewedAt: number;
}

interface RecentlyViewedContextType {
  recentlyViewed: ViewedProductItem[];
  recordView: (product: {
    id: string;
    slug: string;
    title: string;
    pricePaise: number;
    image: string;
    category: string;
    vendorName: string;
    rating?: number;
  }) => void;
  clearHistory: () => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

const STORAGE_KEY = "nexu_recently_viewed_v1";
const MAX_ITEMS = 8;

export const RecentlyViewedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recentlyViewed, setRecentlyViewed] = useState<ViewedProductItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentlyViewed(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load recently viewed products:", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const recordView = useCallback((product: {
    id: string;
    slug: string;
    title: string;
    pricePaise: number;
    image: string;
    category: string;
    vendorName: string;
    rating?: number;
  }) => {
    setRecentlyViewed((prev) => {
      if (prev.length > 0 && prev[0].id === product.id) {
        return prev;
      }
      const filtered = prev.filter((p) => p.id !== product.id && p.slug !== product.slug);
      const updated = [
        {
          ...product,
          viewedAt: Date.now(),
        },
        ...filtered,
      ].slice(0, MAX_ITEMS);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to persist recently viewed products:", err);
      }

      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setRecentlyViewed([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error("Failed to clear recently viewed history:", err);
    }
  }, []);

  return (
    <RecentlyViewedContext.Provider value={{ recentlyViewed, recordView, clearHistory }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};

export const useRecentlyViewed = () => {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error("useRecentlyViewed must be used within a RecentlyViewedProvider");
  }
  return context;
};
