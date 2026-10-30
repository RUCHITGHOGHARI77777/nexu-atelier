import { prisma } from "./prisma";
import { ProductRevisionRecord } from "@/types/listing-engine";

export class ProductRevisionService {
  /**
   * Captures an immutable snapshot of the product and its variants upon submission or change request.
   */
  public async createRevision(
    productId: string,
    submittedBy: string,
    options?: {
      adminFeedback?: string | null;
      changedFields?: string[];
    }
  ): Promise<ProductRevisionRecord | null> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
    });

    if (!product) return null;

    // Count existing revisions
    const count = await (prisma as any).productRevision.count({
      where: { productId },
    });
    const revisionNumber = count + 1;

    let attributes: any = {};
    if (product.attributesJson) {
      try {
        attributes = JSON.parse(product.attributesJson);
      } catch {
        attributes = {};
      }
    }

    const snapshot = {
      id: product.id,
      slug: product.slug,
      title: product.title,
      subtitle: product.subtitle,
      description: product.description,
      categoryId: product.categoryId,
      categoryName: product.category?.name,
      basePricePaise: product.basePricePaise,
      compareAtPricePaise: product.compareAtPricePaise,
      stock: product.stock,
      sku: product.sku,
      brand: product.brand,
      material: product.material,
      dimensions: product.dimensions,
      weight: product.weight,
      careInstructions: product.careInstructions,
      dispatchEstimate: product.dispatchEstimate,
      taxRatePercent: product.taxRatePercent,
      attributes,
      images: product.images.map((img) => ({ url: img.url, sortOrder: img.sortOrder })),
      variants: product.variants.map((v) => ({
        sku: v.sku,
        variantType: v.variantType,
        name: v.name,
        value: v.value,
        stock: v.stock,
        additionalPricePaise: v.additionalPricePaise,
      })),
      approvalStatus: product.approvalStatus,
      isPublished: product.isPublished,
      timestamp: new Date().toISOString(),
    };

    const created = await (prisma as any).productRevision.create({
      data: {
        productId,
        revisionNumber,
        snapshotJson: JSON.stringify(snapshot),
        changedFieldsJson: options?.changedFields ? JSON.stringify(options.changedFields) : null,
        adminFeedback: options?.adminFeedback || null,
        submittedBy,
      },
    });

    return {
      id: created.id,
      productId: created.productId,
      revisionNumber: created.revisionNumber,
      snapshot,
      changedFields: options?.changedFields || [],
      adminFeedback: created.adminFeedback,
      submittedBy: created.submittedBy,
      createdAt: created.createdAt.toISOString(),
    };
  }

  /**
   * Retrieves all revisions for a product, ordered by revisionNumber descending.
   */
  public async getRevisions(productId: string): Promise<ProductRevisionRecord[]> {
    const rawList = await (prisma as any).productRevision.findMany({
      where: { productId },
      orderBy: { revisionNumber: "desc" },
    });

    return rawList.map((r: any) => {
      let snapshot = {};
      let changedFields = [];
      try {
        snapshot = JSON.parse(r.snapshotJson);
      } catch {}
      try {
        changedFields = r.changedFieldsJson ? JSON.parse(r.changedFieldsJson) : [];
      } catch {}

      return {
        id: r.id,
        productId: r.productId,
        revisionNumber: r.revisionNumber,
        snapshot,
        changedFields,
        adminFeedback: r.adminFeedback,
        submittedBy: r.submittedBy,
        createdAt: r.createdAt.toISOString(),
      };
    });
  }
}

export const productRevisionService = new ProductRevisionService();
