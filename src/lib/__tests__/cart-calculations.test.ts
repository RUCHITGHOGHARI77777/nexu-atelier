import { describe, it, expect } from "vitest";
import {
  calculateCartTotals,
  validateQuantity,
  groupItemsByVendor,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
} from "../cart-calculations";
import { CartItem } from "@/types/marketplace";
import { SEED_PRODUCTS, SEED_VENDORS } from "@/data/seedCatalog";

describe("validateQuantity", () => {
  it("defaults invalid values to 1", () => {
    expect(validateQuantity(NaN, 10)).toBe(1);
    expect(validateQuantity(-5, 10)).toBe(1);
    expect(validateQuantity(0, 10)).toBe(1);
  });

  it("caps requested quantity at available stock", () => {
    expect(validateQuantity(15, 10)).toBe(10);
    expect(validateQuantity(8, 10)).toBe(8);
  });

  it("handles floating point inputs by flooring to integer", () => {
    expect(validateQuantity(3.7, 10)).toBe(3);
  });
});

describe("calculateCartTotals", () => {
  it("returns zeroed totals for an empty cart", () => {
    const totals = calculateCartTotals([]);
    expect(totals.itemCount).toBe(0);
    expect(totals.subtotal).toBe(0);
    expect(totals.total).toBe(0);
    expect(totals.shippingFee).toBe(0);
    expect(totals.amountNeededForFreeShipping).toBe(FREE_SHIPPING_THRESHOLD);
  });

  it("calculates accurate subtotal, savings, and standard shipping when below threshold", () => {
    const sampleItem: CartItem = {
      id: "cart_item_1",
      productId: SEED_PRODUCTS[0].id,
      product: SEED_PRODUCTS[0],
      quantity: 1,
      unitPrice: 1000,
      lineTotal: 1000,
    };

    const totals = calculateCartTotals([sampleItem]);
    expect(totals.itemCount).toBe(1);
    expect(totals.subtotal).toBe(1000);
    expect(totals.shippingFee).toBe(STANDARD_SHIPPING_FEE);
    expect(totals.total).toBe(1000 + STANDARD_SHIPPING_FEE);
    expect(totals.amountNeededForFreeShipping).toBe(FREE_SHIPPING_THRESHOLD - 1000);
  });

  it("waives shipping fee when subtotal reaches free shipping threshold", () => {
    const sampleItem: CartItem = {
      id: "cart_item_2",
      productId: SEED_PRODUCTS[0].id,
      product: SEED_PRODUCTS[0],
      quantity: 3,
      unitPrice: 1000, // 3000 total > 2500 threshold
      lineTotal: 3000,
    };

    const totals = calculateCartTotals([sampleItem]);
    expect(totals.subtotal).toBe(3000);
    expect(totals.shippingFee).toBe(0);
    expect(totals.amountNeededForFreeShipping).toBe(0);
    expect(totals.total).toBe(3000);
  });
});

describe("groupItemsByVendor", () => {
  it("groups items strictly by vendor ID", () => {
    const item1: CartItem = {
      id: "item_1",
      productId: SEED_PRODUCTS[0].id,
      product: SEED_PRODUCTS[0], // vendor: solTextiles
      quantity: 2,
      unitPrice: 2000,
      lineTotal: 4000,
    };
    const item2: CartItem = {
      id: "item_2",
      productId: SEED_PRODUCTS[1].id,
      product: SEED_PRODUCTS[1], // vendor: voxelAudio
      quantity: 1,
      unitPrice: 4000,
      lineTotal: 4000,
    };

    const groups = groupItemsByVendor([item1, item2]);
    expect(groups.length).toBe(2);
    expect(groups.find((g) => g.vendor.id === SEED_VENDORS.solTextiles.id)?.items.length).toBe(1);
    expect(groups.find((g) => g.vendor.id === SEED_VENDORS.voxelAudio.id)?.items.length).toBe(1);
  });
});
