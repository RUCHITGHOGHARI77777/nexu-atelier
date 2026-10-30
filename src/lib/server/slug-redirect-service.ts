import { prisma } from "./prisma";

export class SlugRedirectService {
  /**
   * Records a product slug rename to preserve incoming search links and external bookmarks.
   */
  public async recordSlugChange(
    productId: string,
    oldSlug: string,
    newSlug: string
  ): Promise<void> {
    if (oldSlug === newSlug) return;

    try {
      // Upsert: if oldSlug was already pointing somewhere, point it to the newest slug
      await prisma.productSlugRedirect.upsert({
        where: { oldSlug },
        create: {
          productId,
          oldSlug,
          newSlug,
        },
        update: {
          newSlug,
          productId,
        },
      });

      // Chain resolution: if any earlier old slugs were pointing to this oldSlug, update them to newSlug
      await prisma.productSlugRedirect.updateMany({
        where: { newSlug: oldSlug },
        data: { newSlug },
      });
    } catch (err: any) {
      console.error("Failed to record slug redirect:", err.message);
    }
  }

  /**
   * Resolves whether an incoming slug corresponds to an updated target.
   */
  public async getRedirectForSlug(slug: string): Promise<string | null> {
    try {
      const redirect = await prisma.productSlugRedirect.findUnique({
        where: { oldSlug: slug },
      });
      return redirect ? redirect.newSlug : null;
    } catch {
      return null;
    }
  }

  /**
   * Returns all active slug redirects for Admin inspection.
   */
  public async getAllRedirects() {
    return prisma.productSlugRedirect.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}

export const slugRedirectService = new SlugRedirectService();
