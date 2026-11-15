import { prisma } from "./prisma";
import { mapDbProductToFrontend } from "./product-repository";
import { Product } from "@/types/marketplace";

export async function recordProductView(customerId: string, productId: string) {
  try {
    return await prisma.recentlyViewedItem.upsert({
      where: {
        customerId_productId: {
          customerId,
          productId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        customerId,
        productId,
        viewedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("Error recording product view:", err);
    return null;
  }
}

export async function getRecentlyViewed(customerId: string, limit = 10): Promise<Product[]> {
  const items = await prisma.recentlyViewedItem.findMany({
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
    orderBy: { viewedAt: "desc" },
    take: limit,
  });

  return items
    .filter((item) => item.product && item.product.isPublished && item.product.approvalStatus === "APPROVED")
    .map((item) => mapDbProductToFrontend(item.product));
}

export async function recordSearchQuery(customerId: string, query: string) {
  const clean = query.trim();
  if (!clean || clean.length < 2) return null;

  try {
    return await prisma.searchHistoryItem.create({
      data: {
        customerId,
        query: clean,
      },
    });
  } catch (err) {
    console.error("Error recording search query:", err);
    return null;
  }
}

export async function getRecentSearchQueries(customerId: string, limit = 8): Promise<string[]> {
  const searches = await prisma.searchHistoryItem.findMany({
    where: { customerId },
    orderBy: { searchedAt: "desc" },
    take: 30,
    select: { query: true },
  });

  const unique = Array.from(new Set(searches.map((s) => s.query))).slice(0, limit);
  return unique;
}

export async function clearSearchHistory(customerId: string) {
  return await prisma.searchHistoryItem.deleteMany({
    where: { customerId },
  });
}
