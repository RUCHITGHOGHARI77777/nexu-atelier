"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import {
  CartItem,
  CartTotals,
  ColorVariant,
  Product,
  VendorCartGroup,
} from "@/types/marketplace";
import {
  calculateCartTotals,
  groupItemsByVendor,
  validateQuantity,
} from "@/lib/cart-calculations";

interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "warning";
}

interface CartContextType {
  items: CartItem[];
  savedForLater: CartItem[];
  totals: CartTotals;
  vendorGroups: VendorCartGroup[];
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  toggleCartDrawer: () => void;
  addToCart: (
    product: Product,
    options?: {
      color?: ColorVariant;
      size?: string;
      quantity?: number;
    }
  ) => boolean;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  saveForLater: (cartItemId: string) => void;
  moveToCart: (savedItemId: string) => void;
  removeFromSaved: (savedItemId: string) => void;
  clearCart: () => void;
  toasts: Toast[];
  dismissToast: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_CART_KEY = "nexu_marketplace_cart_v1";
const LOCAL_STORAGE_SAVED_KEY = "nexu_marketplace_saved_v1";

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedForLater, setSavedForLater] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "info" | "success" | "warning" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Safe recovery and load from LocalStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const validated: CartItem[] = parsed.filter(
            (item) =>
              item &&
              typeof item.id === "string" &&
              item.product &&
              typeof item.product.id === "string" &&
              typeof item.quantity === "number" &&
              item.quantity > 0 &&
              typeof item.unitPrice === "number"
          );
          setItems(validated);
        } else {
          localStorage.removeItem(LOCAL_STORAGE_CART_KEY);
        }
      }

      const rawSaved = localStorage.getItem(LOCAL_STORAGE_SAVED_KEY);
      if (rawSaved) {
        const parsedSaved = JSON.parse(rawSaved);
        if (Array.isArray(parsedSaved)) {
          const validatedSaved: CartItem[] = parsedSaved.filter(
            (item) =>
              item &&
              typeof item.id === "string" &&
              item.product &&
              typeof item.product.id === "string" &&
              typeof item.unitPrice === "number"
          );
          setSavedForLater(validatedSaved);
        } else {
          localStorage.removeItem(LOCAL_STORAGE_SAVED_KEY);
        }
      }
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_CART_KEY);
      localStorage.removeItem(LOCAL_STORAGE_SAVED_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync to LocalStorage on item changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(items));
    } catch {
      // ignore storage quota errors
    }
  }, [items, isHydrated]);

  // Sync savedForLater to LocalStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(savedForLater));
    } catch {
      // ignore storage quota errors
    }
  }, [savedForLater, isHydrated]);

  const addToCart = (
    product: Product,
    options?: {
      color?: ColorVariant;
      size?: string;
      quantity?: number;
    }
  ): boolean => {
    if (product.stock <= 0) {
      showToast(`"${product.title}" is currently out of stock`, "warning");
      return false;
    }

    const selectedColor = options?.color || product.availableColors?.[0];
    const selectedSize = options?.size || product.availableSizes?.[0];
    const requestedQty = options?.quantity !== undefined ? options.quantity : 1;
    const validatedQty = validateQuantity(requestedQty, product.stock);

    const itemId = `${product.id}_${selectedColor?.name || "def"}_${selectedSize || "std"}`;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === itemId);

      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        const newQty = validateQuantity(existing.quantity + validatedQty, product.stock);
        const updated = [...prev];
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          lineTotal: newQty * existing.unitPrice,
        };
        return updated;
      }

      const newItem: CartItem = {
        id: itemId,
        productId: product.id,
        product,
        selectedColor,
        selectedSize,
        quantity: validatedQty,
        unitPrice: product.basePrice,
        lineTotal: validatedQty * product.basePrice,
      };
      return [...prev, newItem];
    });

    showToast(`Added to your bag: ${product.title.slice(0, 32)}...`, "success");
    return true;
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
    showToast("Item removed from your bag", "info");
  };

  const updateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const valid = validateQuantity(newQty, item.product.stock);
          if (newQty > item.product.stock) {
            showToast(`Maximum available stock is ${item.product.stock} units`, "warning");
          }
          return {
            ...item,
            quantity: valid,
            lineTotal: valid * item.unitPrice,
          };
        }
        return item;
      })
    );
  };

  const saveForLater = (cartItemId: string) => {
    const itemToSave = items.find((i) => i.id === cartItemId);
    if (!itemToSave) return;

    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
    setSavedForLater((prev) => {
      const existing = prev.find((i) => i.id === cartItemId);
      if (existing) return prev;
      return [...prev, itemToSave];
    });
    showToast(`Saved for later: ${itemToSave.product.title.slice(0, 28)}...`, "info");
  };

  const moveToCart = (savedItemId: string) => {
    const itemToMove = savedForLater.find((i) => i.id === savedItemId);
    if (!itemToMove) return;

    setSavedForLater((prev) => prev.filter((i) => i.id !== savedItemId));
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === savedItemId);
      if (existingIndex > -1) {
        return prev;
      }
      return [...prev, itemToMove];
    });
    showToast(`Moved to bag: ${itemToMove.product.title.slice(0, 28)}...`, "success");
  };

  const removeFromSaved = (savedItemId: string) => {
    setSavedForLater((prev) => prev.filter((i) => i.id !== savedItemId));
    showToast("Removed from saved items", "info");
  };

  const clearCart = () => {
    setItems([]);
    showToast("Your shopping bag was cleared", "info");
  };

  const totals = useMemo(() => calculateCartTotals(items), [items]);
  const vendorGroups = useMemo(() => groupItemsByVendor(items), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        savedForLater,
        totals,
        vendorGroups,
        isCartDrawerOpen,
        openCartDrawer: () => setIsCartDrawerOpen(true),
        closeCartDrawer: () => setIsCartDrawerOpen(false),
        toggleCartDrawer: () => setIsCartDrawerOpen((p) => !p),
        addToCart,
        removeFromCart,
        updateQuantity,
        saveForLater,
        moveToCart,
        removeFromSaved,
        clearCart,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside a CartProvider");
  return ctx;
};
