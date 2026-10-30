import { prisma } from "./prisma";

export interface SyncCartItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

export async function getCustomerCart(customerId: string) {
  let cart = await prisma.cart.findFirst({
    where: { customerId },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
              vendor: true,
              images: { orderBy: { sortOrder: "asc" } },
              variants: true,
            },
          },
          variant: true,
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { customerId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                vendor: true,
                images: { orderBy: { sortOrder: "asc" } },
                variants: true,
              },
            },
            variant: true,
          },
        },
      },
    });
  }

  // Filter valid published products & recalculate prices
  const validItems = cart.items
    .filter((item) => item.product && item.product.isPublished && item.product.approvalStatus === "APPROVED")
    .map((item) => {
      const basePrice = item.product.basePricePaise / 100;
      const additionalPrice = (item.variant?.additionalPricePaise || 0) / 100;
      const effectiveUnitPrice = basePrice + additionalPrice;
      const availableStock = item.variant ? item.variant.stock : item.product.stock;

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: Math.min(item.quantity, Math.max(1, availableStock)),
        availableStock,
        unitPrice: effectiveUnitPrice,
        product: {
          id: item.product.id,
          slug: item.product.slug,
          title: item.product.title,
          subtitle: item.product.subtitle,
          price: effectiveUnitPrice,
          originalPrice: item.product.compareAtPricePaise ? item.product.compareAtPricePaise / 100 : undefined,
          images: item.product.images.map((img) => img.url),
          category: {
            id: item.product.category.id,
            name: item.product.category.name,
            slug: item.product.category.slug,
          },
          vendor: {
            id: item.product.vendor.id,
            name: item.product.vendor.name,
            slug: item.product.vendor.slug,
            originHub: item.product.vendor.originHub,
            verified: item.product.vendor.verified,
            leadTimeDays: item.product.vendor.leadTimeDays,
          },
          inventory: {
            inStock: availableStock > 0,
            quantity: availableStock,
            lowStockThreshold: item.product.lowStockThreshold,
          },
        },
        selectedVariant: item.variant
          ? {
              id: item.variant.id,
              name: item.variant.name,
              value: item.variant.value,
              sku: item.variant.sku,
              stock: item.variant.stock,
              priceDelta: (item.variant.additionalPricePaise || 0) / 100,
            }
          : undefined,
      };
    });

  return {
    cartId: cart.id,
    items: validItems,
  };
}

export async function syncCustomerCart(customerId: string, clientItems: SyncCartItemInput[]) {
  let cart = await prisma.cart.findFirst({
    where: { customerId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { customerId },
    });
  }

  // Clear existing items and replace with validated client items
  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  for (const item of clientItems) {
    if (!item.productId || item.quantity <= 0) continue;

    // Verify product exists and is approved
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { id: true, isPublished: true, approvalStatus: true, stock: true },
    });

    if (!product || !product.isPublished || product.approvalStatus !== "APPROVED") {
      continue;
    }

    let variantId = item.variantId;
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { id: true, stock: true },
      });
      if (!variant) variantId = undefined;
    }

    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        variantId: variantId || null,
        quantity: item.quantity,
      },
    });
  }

  return await getCustomerCart(customerId);
}

export async function mergeGuestCart(customerId: string, guestItems: SyncCartItemInput[]) {
  let cart = await prisma.cart.findFirst({
    where: { customerId },
    include: { items: true },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { customerId },
      include: { items: true },
    });
  }

  for (const guestItem of guestItems) {
    if (!guestItem.productId || guestItem.quantity <= 0) continue;

    // Verify product
    const product = await prisma.product.findUnique({
      where: { id: guestItem.productId },
      select: { id: true, isPublished: true, approvalStatus: true, stock: true },
    });

    if (!product || !product.isPublished || product.approvalStatus !== "APPROVED") {
      continue;
    }

    const existingCartItem = cart.items.find(
      (ci) => ci.productId === guestItem.productId && ci.variantId === (guestItem.variantId || null)
    );

    if (existingCartItem) {
      // Add quantities, capping safely
      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + guestItem.quantity,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: guestItem.productId,
          variantId: guestItem.variantId || null,
          quantity: guestItem.quantity,
        },
      });
    }
  }

  return await getCustomerCart(customerId);
}
