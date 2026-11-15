import { prisma } from "./prisma";
import { mapDbProductToFrontend } from "./product-repository";
import { Product } from "@/types/marketplace";

export interface WishlistResult {
  items: Array<{
    id: string;
    productId: string;
    product: Product;
    createdAt: string;
  }>;
  total: number;
}

export async function getCustomerWishlist(customerId: string): Promise<WishlistResult> {
  const dbItems = await prisma.wishlistItem.findMany({
    where: { customerId },
    include: {
      product: {
        include: {
          category: true,
          vendor: true,
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const validItems = dbItems
    .filter(
      (item) =>
        item.product &&
        item.product.isPublished &&
        (item.product.approvalStatus === "APPROVED" || item.product.approvalStatus === "PENDING_REVIEW")
    )
    .map((item) => ({
      id: item.id,
      productId: item.productId,
      product: mapDbProductToFrontend(item.product),
      createdAt: item.createdAt.toISOString(),
    }));

  return {
    items: validItems,
    total: validItems.length,
  };
}

export async function addToWishlist(customerId: string, productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, isPublished: true, approvalStatus: true },
  });

  if (
    !product ||
    !product.isPublished ||
    (product.approvalStatus !== "APPROVED" && product.approvalStatus !== "PENDING_REVIEW")
  ) {
    throw new Error("Product not available or does not exist");
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      customerId_productId: {
        customerId,
        productId,
      },
    },
  });

  if (existing) {
    return { success: true, item: existing, added: false };
  }

  const item = await prisma.wishlistItem.create({
    data: {
      customerId,
      productId,
    },
  });

  return { success: true, item, added: true };
}

export async function removeFromWishlist(customerId: string, productId: string) {
  const item = await prisma.wishlistItem.findUnique({
    where: {
      customerId_productId: {
        customerId,
        productId,
      },
    },
  });

  if (item) {
    await prisma.wishlistItem.delete({
      where: { id: item.id },
    });
  }

  return { success: true };
}

export async function mergeGuestWishlist(customerId: string, guestProductIds: string[]) {
  if (!guestProductIds || guestProductIds.length === 0) {
    return { success: true, addedCount: 0 };
  }

  const validProducts = await prisma.product.findMany({
    where: {
      id: { in: guestProductIds },
      isPublished: true,
      approvalStatus: { in: ["APPROVED", "PENDING_REVIEW"] },
    },
    select: { id: true },
  });

  const validIds = validProducts.map((p) => p.id);

  const existing = await prisma.wishlistItem.findMany({
    where: {
      customerId,
      productId: { in: validIds },
    },
    select: { productId: true },
  });

  const existingSet = new Set(existing.map((e) => e.productId));
  const toAdd = validIds.filter((id) => !existingSet.has(id));

  if (toAdd.length > 0) {
    await prisma.wishlistItem.createMany({
      data: toAdd.map((productId) => ({
        customerId,
        productId,
      })),
      skipDuplicates: true,
    });
  }

  return { success: true, addedCount: toAdd.length };
}

export async function checkInWishlist(customerId: string, productId: string): Promise<boolean> {
  const item = await prisma.wishlistItem.findUnique({
    where: {
      customerId_productId: {
        customerId,
        productId,
      },
    },
    select: { id: true },
  });
  return !!item;
}
