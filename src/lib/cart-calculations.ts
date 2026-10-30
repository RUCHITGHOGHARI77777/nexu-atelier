import { CartItem, CartTotals, VendorCartGroup } from "@/types/marketplace";

export const FREE_SHIPPING_THRESHOLD = 2500;
export const STANDARD_SHIPPING_FEE = 150;
export const ESTIMATED_TAX_RATE = 0.12; // 12% blended GST rate on artisan/technical goods

/**
 * Validates requested quantity against available stock and minimum constraints.
 * Ensures an order quantity is an integer >= 1 and <= stock.
 */
export function validateQuantity(
  requestedQuantity: number,
  availableStock: number
): number {
  if (isNaN(requestedQuantity) || requestedQuantity < 1) {
    return 1;
  }
  const cleanInt = Math.floor(requestedQuantity);
  if (cleanInt > availableStock) {
    return Math.max(1, availableStock);
  }
  return cleanInt;
}

/**
 * Calculates accurate item counts, subtotals, savings, taxes, and shipping fees.
 */
export function calculateCartTotals(items: CartItem[]): CartTotals {
  if (!items || items.length === 0) {
    return {
      itemCount: 0,
      subtotal: 0,
      savingsTotal: 0,
      estimatedTax: 0,
      shippingFee: 0,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      amountNeededForFreeShipping: FREE_SHIPPING_THRESHOLD,
      total: 0,
    };
  }

  let itemCount = 0;
  let subtotal = 0;
  let savingsTotal = 0;

  for (const item of items) {
    const qty = Math.max(1, item.quantity);
    itemCount += qty;

    const lineTotal = item.unitPrice * qty;
    subtotal += lineTotal;

    if (item.product.compareAtPrice && item.product.compareAtPrice > item.unitPrice) {
      savingsTotal += (item.product.compareAtPrice - item.unitPrice) * qty;
    }
  }

  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const estimatedTax = Math.round(subtotal * ESTIMATED_TAX_RATE);
  const total = subtotal + shippingFee; // Taxes are included in MRP/price as per Indian retail standard, itemized transparently

  return {
    itemCount,
    subtotal,
    savingsTotal,
    estimatedTax,
    shippingFee,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    amountNeededForFreeShipping,
    total,
  };
}

/**
 * Groups items by independent vendor for clear multi-vendor shipment clarity.
 */
export function groupItemsByVendor(items: CartItem[]): VendorCartGroup[] {
  const map = new Map<string, { vendor: CartItem["product"]["vendor"]; items: CartItem[] }>();

  for (const item of items) {
    const v = item.product.vendor;
    if (!map.has(v.id)) {
      map.set(v.id, { vendor: v, items: [] });
    }
    map.get(v.id)!.items.push(item);
  }

  return Array.from(map.values()).map((group) => ({
    vendor: group.vendor,
    items: group.items,
    subtotal: group.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
  }));
}
