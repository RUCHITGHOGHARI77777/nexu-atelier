import { db, auth, isLiveFirebase } from "./firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

export interface SellerBrandStore {
  id: string;
  slug: string;
  brandName: string;
  tagline: string;
  ownerName: string;
  phoneWhatsapp: string;
  pickupAddress: string;
  directUpiId: string;
  gstin?: string;
  metaPixelId?: string;
  accentColor?: string;
  logoUrl?: string;
  heroBannerUrl?: string;
  catalogCategory?: string;
  activeProductsCount?: number;
  totalOrdersCount?: number;
  grossSalesINR?: number;
  createdAt: string;
  verified: boolean;
}

const LOCAL_STORAGE_STORES_KEY = "nexu_firebase_seller_stores";

// Helper for local storage reads
function getLocalStores(): SellerBrandStore[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_STORES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Helper for local storage writes
function saveLocalStores(stores: SellerBrandStore[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_STORES_KEY, JSON.stringify(stores));
  } catch {}
}

// Seed default verified seller store if empty
export const DEFAULT_DEMO_SELLER_STORE: SellerBrandStore = {
  id: "store_jaipur_loom",
  slug: "jaipur-heritage-handlooms",
  brandName: "Jaipur Heritage Handlooms",
  tagline: "Authentic Hand-Spun Ahimsa Silk & Natural Dyed Textiles",
  ownerName: "Devendra Rathore",
  phoneWhatsapp: "+91 98290 12345",
  pickupAddress: "Plot 42, Handloom Cluster Phase 2, Sanganer, Jaipur, Rajasthan - 302029",
  directUpiId: "jaipurloom@okhdfcbank",
  gstin: "08AABCR1294F1Z3",
  metaPixelId: "PIXEL_982140510",
  accentColor: "#059669",
  catalogCategory: "Fashion & Apparel",
  activeProductsCount: 18,
  totalOrdersCount: 142,
  grossSalesINR: 489500,
  createdAt: "2026-10-15T10:00:00.000Z",
  verified: true,
};

/**
 * 60-Second Brand Store Creation (Firebase Firestore + Instant Local Fallback)
 */
export async function createOrUpdateSellerStore(
  storeData: Omit<SellerBrandStore, "id" | "createdAt" | "verified" | "activeProductsCount" | "totalOrdersCount" | "grossSalesINR">
): Promise<SellerBrandStore> {
  const storeId = `store_${storeData.slug || Date.now()}`;
  const now = new Date().toISOString();

  const fullStore: SellerBrandStore = {
    ...storeData,
    id: storeId,
    createdAt: now,
    verified: true,
    activeProductsCount: 12,
    totalOrdersCount: 3,
    grossSalesINR: 76970,
  };

  // 1. Try Firebase Firestore
  if (db && isLiveFirebase) {
    try {
      const storeRef = doc(db, "seller_stores", storeId);
      await setDoc(storeRef, fullStore, { merge: true });
    } catch {
      // Gracefully fall back to local mirror
    }
  }

  // 2. Always update local mirror for zero-latency instant offline/demo testing
  const existing = getLocalStores();
  const index = existing.findIndex((s) => s.slug === storeData.slug || s.id === storeId);
  if (index >= 0) {
    existing[index] = { ...existing[index], ...fullStore };
  } else {
    existing.unshift(fullStore);
  }
  saveLocalStores(existing);

  return fullStore;
}

/**
 * Fetch a store by slug (e.g. /store/jaipur-heritage-handlooms)
 */
export async function getSellerStoreBySlug(slug: string): Promise<SellerBrandStore | null> {
  // Check local mirror first for instant response
  const localList = getLocalStores();
  const matched = localList.find((s) => s.slug === slug);
  if (matched) return matched;

  if (slug === DEFAULT_DEMO_SELLER_STORE.slug) {
    return DEFAULT_DEMO_SELLER_STORE;
  }

  // Check Firestore if live
  if (db && isLiveFirebase) {
    try {
      const q = query(collection(db, "seller_stores"), where("slug", "==", slug));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        return querySnap.docs[0].data() as SellerBrandStore;
      }
    } catch {}
  }

  return null;
}

/**
 * List all active brand stores
 */
export async function getAllSellerBrandStores(): Promise<SellerBrandStore[]> {
  const local = getLocalStores();
  if (local.length > 0) return local;

  if (db && isLiveFirebase) {
    try {
      const querySnap = await getDocs(collection(db, "seller_stores"));
      const list: SellerBrandStore[] = [];
      querySnap.forEach((docSnap) => {
        list.push(docSnap.data() as SellerBrandStore);
      });
      if (list.length > 0) {
        saveLocalStores(list);
        return list;
      }
    } catch {}
  }

  // Return default seeded demo store
  return [DEFAULT_DEMO_SELLER_STORE];
}

