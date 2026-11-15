import { prisma } from "./prisma";
import {
  SellerProfile,
  SellerMetrics,
  SellerProductInput,
  SellerProductDetailView,
  SellerProductListItem,
  SellerOrderLine,
  SellerPayoutRecord,
  InventoryBatchUpdateItem,
  CsvImportResult,
} from "@/types/seller";
import { Product } from "@/types/marketplace";
import { mapDbProductToFrontend } from "./product-repository";
import { productRevisionService } from "./product-revision-service";
import { notificationService } from "./notification-service";
import { supplierDraftService } from "./supplier-draft-service";
import { slugRedirectService } from "./slug-redirect-service";
import {
  OrderStatus,
  SellerStatus,
  ProductApprovalStatus,
  FulfillmentStatus,
  PayoutStatus,
} from "@prisma/client";
import { platformAuditService } from "./platform-audit-service";

export class SellerService {
  /**
   * Registers a new seller application for an authenticated user.
   */
  public async applyForSeller(
    userId: string,
    data: {
      name: string;
      originHub: string;
      story: string;
      businessEmail: string;
      businessPhone: string;
      taxIdentifier?: string;
      leadTimeDays?: number;
      heroImage?: string;
    }
  ): Promise<{ success: boolean; seller?: SellerProfile; error?: string }> {
    if (!data.name || data.name.trim().length < 2) {
      return { success: false, error: "Studio/business name must be at least 2 characters." };
    }
    if (!data.originHub || data.originHub.trim().length < 2) {
      return { success: false, error: "Origin hub / workshop location is required." };
    }
    if (!data.story || data.story.trim().length < 10) {
      return { success: false, error: "Craft story must be at least 10 characters." };
    }
    if (!data.businessEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.businessEmail)) {
      return { success: false, error: "Valid business email address is required." };
    }

    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { seller: true },
      });

      if (!existingUser) {
        return { success: false, error: "User not found." };
      }

      if (existingUser.seller) {
        return {
          success: false,
          error: `An application or studio profile already exists for this account (status: ${existingUser.seller.status}).`,
        };
      }

      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const createdSeller = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { role: "SELLER" },
        });

        return tx.seller.create({
          data: {
            userId,
            slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
            name: data.name.trim(),
            originHub: data.originHub.trim(),
            story: data.story.trim(),
            heroImage:
              data.heroImage ||
              "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80",
            status: SellerStatus.PENDING,
            businessEmail: data.businessEmail.trim().toLowerCase(),
            businessPhone: data.businessPhone.trim(),
            taxIdentifier: data.taxIdentifier ? data.taxIdentifier.trim() : null,
            leadTimeDays: data.leadTimeDays || 3,
            verified: false,
            rating: 0.0,
            commissionRatePercent: 10.0,
          },
        });
      });

      const responsePayload = {
        success: true,
        seller: {
          id: createdSeller.id,
          userId: createdSeller.userId,
          slug: createdSeller.slug,
          name: createdSeller.name,
          originHub: createdSeller.originHub,
          story: createdSeller.story,
          heroImage: createdSeller.heroImage,
          verified: createdSeller.verified,
          rating: createdSeller.rating,
          leadTimeDays: createdSeller.leadTimeDays,
          status: createdSeller.status as any,
          businessEmail: createdSeller.businessEmail,
          businessPhone: createdSeller.businessPhone,
          taxIdentifier: createdSeller.taxIdentifier,
          commissionRatePercent: createdSeller.commissionRatePercent,
          createdAt: createdSeller.createdAt.toISOString(),
        },
      };

      try {
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@nexuatelier.com";
        await notificationService.queueNotification({
          channel: "EMAIL",
          recipient: adminEmail,
          template: "ADMIN_SUPPLIER_APPLICATION",
          payload: {
            studioName: createdSeller.name,
            ownerName: data.name,
            email: createdSeller.businessEmail || data.businessEmail || "applicant@studio.com",
            city: createdSeller.originHub || "India",
            state: "India",
          },
        });
      } catch {}

      return responsePayload;
    } catch {
      return { success: false, error: "Failed to submit seller application." };
    }
  }

  /**
   * Updates seller profile, bank account, and tax information with immutable audit logging.
   */
  public async updateSellerProfile(
    sellerId: string,
    updates: {
      taxIdentifier?: string;
      bankAccountName?: string;
      bankAccountNumber?: string;
      bankIfsc?: string;
      story?: string;
      leadTimeDays?: number;
      originHub?: string;
    },
    performedByEmail: string
  ): Promise<{ success: boolean; seller?: any; error?: string }> {
    try {
      const existing = await prisma.seller.findUnique({
        where: { id: sellerId },
      });
      if (!existing) {
        return { success: false, error: "Seller profile not found." };
      }

      if (
        updates.bankAccountNumber &&
        updates.bankAccountNumber.trim() !== (existing.bankAccountNumber || "").trim()
      ) {
        await platformAuditService.recordAudit({
          action: "Payout Handle Change",
          entityType: "PAYMENT",
          entityId: sellerId,
          storeId: sellerId,
          performedBy: performedByEmail,
          details: {
            previousBankLast4: existing.bankAccountNumber ? existing.bankAccountNumber.slice(-4) : "NONE",
            newBankLast4: updates.bankAccountNumber.trim().slice(-4),
            bankIfsc: updates.bankIfsc || existing.bankIfsc,
          },
        });
      }

      if (
        updates.taxIdentifier &&
        updates.taxIdentifier.trim() !== (existing.taxIdentifier || "").trim()
      ) {
        await platformAuditService.recordAudit({
          action: "Tax ID Update",
          entityType: "STORE",
          entityId: sellerId,
          storeId: sellerId,
          performedBy: performedByEmail,
          details: {
            previousTaxId: existing.taxIdentifier || "NONE",
            newTaxId: updates.taxIdentifier.trim(),
          },
        });
      }

      const updated = await prisma.seller.update({
        where: { id: sellerId },
        data: {
          taxIdentifier: updates.taxIdentifier !== undefined ? updates.taxIdentifier.trim() : undefined,
          bankAccountName: updates.bankAccountName !== undefined ? updates.bankAccountName.trim() : undefined,
          bankAccountNumber: updates.bankAccountNumber !== undefined ? updates.bankAccountNumber.trim() : undefined,
          bankIfsc: updates.bankIfsc !== undefined ? updates.bankIfsc.trim().toUpperCase() : undefined,
          story: updates.story !== undefined ? updates.story.trim() : undefined,
          leadTimeDays: updates.leadTimeDays !== undefined ? updates.leadTimeDays : undefined,
          originHub: updates.originHub !== undefined ? updates.originHub.trim() : undefined,
        },
      });

      return { success: true, seller: updated };
    } catch {
      return { success: false, error: "Failed to update seller profile." };
    }
  }

  /**
   * Aggregates authoritative metrics for a specific seller.
   */
  public async getSellerMetrics(sellerId: string): Promise<SellerMetrics> {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        products: true,
      },
    });

    if (!seller) {
      return {
        grossSales: 0,
        todaySales: 0,
        weeklySales: 0,
        monthlySales: 0,
        netProceeds: 0,
        commissionDeducted: 0,
        totalOrders: 0,
        newOrders: 0,
        pendingOrders: 0,
        acceptedOrders: 0,
        processingOrders: 0,
        packedOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        returnedOrders: 0,
        refundedOrders: 0,
        totalProducts: 0,
        activeProducts: 0,
        outOfStockCount: 0,
        lowStockCount: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        eligiblePayout: 0,
        settledPayouts: 0,
        recentDaysSales: [],
        topProducts: [],
      };
    }

    const [allOrderItems, payouts, returnRequests] = await Promise.all([
      prisma.orderItem.findMany({
        where: { vendorId: sellerId },
        include: { order: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vendorPayout.findMany({
        where: { sellerId },
      }),
      prisma.returnRequest.findMany({
        where: { orderItem: { vendorId: sellerId } },
      }),
    ]);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const nonCancelledItems = allOrderItems.filter((i) => i.fulfillmentStatus !== "CANCELLED");

    const grossSalesPaise = nonCancelledItems.reduce((acc, item) => acc + item.lineTotalPaise, 0);
    const todaySalesPaise = nonCancelledItems
      .filter((i) => new Date(i.createdAt) >= startOfToday)
      .reduce((acc, item) => acc + item.lineTotalPaise, 0);
    const weeklySalesPaise = nonCancelledItems
      .filter((i) => new Date(i.createdAt) >= sevenDaysAgo)
      .reduce((acc, item) => acc + item.lineTotalPaise, 0);
    const monthlySalesPaise = nonCancelledItems
      .filter((i) => new Date(i.createdAt) >= thirtyDaysAgo)
      .reduce((acc, item) => acc + item.lineTotalPaise, 0);

    const commissionRate = seller.commissionRatePercent / 100;
    const commissionPaise = Math.round(grossSalesPaise * commissionRate);
    const netProceedsPaise = grossSalesPaise - commissionPaise;

    const allUniqueOrderIds = new Set(allOrderItems.map((i) => i.orderId));

    const newOrders = allOrderItems.filter((i) => i.fulfillmentStatus === "NEW").length;
    const processingOrders = allOrderItems.filter((i) => i.fulfillmentStatus === "PROCESSING").length;
    const packedOrders = allOrderItems.filter((i) => i.fulfillmentStatus === "PACKED").length;
    const shippedOrders = allOrderItems.filter((i) => i.fulfillmentStatus === "SHIPPED").length;
    const deliveredOrders = allOrderItems.filter((i) => i.fulfillmentStatus === "DELIVERED").length;
    const cancelledOrders = allOrderItems.filter((i) => i.fulfillmentStatus === "CANCELLED").length;

    const pendingOrders = newOrders + processingOrders;
    const acceptedOrders = processingOrders + packedOrders + shippedOrders + deliveredOrders;

    const returnedOrders = returnRequests.filter(
      (r) => r.status !== "REJECTED" && r.status !== "REFUNDED"
    ).length;
    const refundedOrders = returnRequests.filter((r) => r.status === "REFUNDED").length;

    const totalProducts = seller.products.length;
    const activeProducts = seller.products.filter(
      (p) => p.isPublished && p.approvalStatus === "APPROVED" && p.stock > 0
    ).length;
    const outOfStockCount = seller.products.filter((p) => p.stock <= 0).length;
    const lowStockCount = seller.products.filter(
      (p) => p.stock > 0 && p.stock <= p.lowStockThreshold
    ).length;

    const pendingEarningsPaise = payouts
      .filter((p) => p.status === "ESCROW_HOLD")
      .reduce((acc, p) => acc + p.netPayoutPaise, 0);

    const eligiblePayoutPaise = payouts
      .filter((p) => p.status === "ELIGIBLE_FOR_PAYOUT")
      .reduce((acc, p) => acc + p.netPayoutPaise, 0);

    const settledPayoutsPaise = payouts
      .filter((p) => p.status === "SETTLED")
      .reduce((acc, p) => acc + p.netPayoutPaise, 0);

    const recentDaysMap = new Map<string, { salesPaise: number; orders: Set<string> }>();
    for (let d = 6; d >= 0; d--) {
      const dt = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
      const dateKey = dt.toISOString().split("T")[0];
      recentDaysMap.set(dateKey, { salesPaise: 0, orders: new Set() });
    }

    nonCancelledItems.forEach((item) => {
      const dateKey = new Date(item.createdAt).toISOString().split("T")[0];
      if (recentDaysMap.has(dateKey)) {
        const entry = recentDaysMap.get(dateKey)!;
        entry.salesPaise += item.lineTotalPaise;
        entry.orders.add(item.orderId);
      }
    });

    const recentDaysSales = Array.from(recentDaysMap.entries()).map(([date, data]) => ({
      date,
      sales: data.salesPaise / 100,
      orders: data.orders.size,
    }));

    const productStatsMap = new Map<string, { id: string; title: string; unitsSold: number; revenuePaise: number }>();
    nonCancelledItems.forEach((item) => {
      const prodId = item.productId || item.title;
      if (!productStatsMap.has(prodId)) {
        productStatsMap.set(prodId, { id: prodId, title: item.title, unitsSold: 0, revenuePaise: 0 });
      }
      const p = productStatsMap.get(prodId)!;
      p.unitsSold += item.quantity;
      p.revenuePaise += item.lineTotalPaise;
    });

    const topProducts = Array.from(productStatsMap.values())
      .sort((a, b) => b.revenuePaise - a.revenuePaise)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        title: p.title,
        unitsSold: p.unitsSold,
        revenue: p.revenuePaise / 100,
      }));

    return {
      grossSales: grossSalesPaise / 100,
      todaySales: todaySalesPaise / 100,
      weeklySales: weeklySalesPaise / 100,
      monthlySales: monthlySalesPaise / 100,
      netProceeds: netProceedsPaise / 100,
      commissionDeducted: commissionPaise / 100,
      totalOrders: allUniqueOrderIds.size,
      newOrders,
      pendingOrders,
      acceptedOrders,
      processingOrders,
      packedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      returnedOrders,
      refundedOrders,
      totalProducts,
      activeProducts,
      outOfStockCount,
      lowStockCount,
      totalEarnings: netProceedsPaise / 100,
      pendingEarnings: pendingEarningsPaise / 100,
      eligiblePayout: eligiblePayoutPaise / 100,
      settledPayouts: settledPayoutsPaise / 100,
      recentDaysSales,
      topProducts,
    };
  }

  /**
   * Retrieves products belonging strictly to the authenticated seller.
   */
  public async getSellerProducts(
    sellerId: string,
    options: {
      search?: string;
      category?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      vendorId: sellerId,
    };

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { subtitle: { contains: q, mode: "insensitive" } },
      ];
    }

    if (options.category && options.category !== "All") {
      where.category = { name: { equals: options.category, mode: "insensitive" } };
    }

    if (options.status && options.status !== "ALL") {
      where.approvalStatus = options.status;
    }

    const [total, dbProducts] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: true,
          vendor: true,
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      products: dbProducts.map((p) => {
        const base = mapDbProductToFrontend(p);
        return {
          ...base,
          approvalStatus: p.approvalStatus,
          isPublished: p.isPublished,
          moderationNotes: p.moderationNotes,
          createdAt: p.createdAt.toISOString(),
        };
      }) as any,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Creates a new product for an approved seller.
   * New products default to PENDING_REVIEW (or DRAFT if action is DRAFT) and are NEVER automatically published.
   */
  public async createProduct(
    sellerId: string,
    input: SellerProductInput
  ): Promise<{ success: boolean; product?: Product; error?: string }> {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      return { success: false, error: "Seller profile not found." };
    }

    if (seller.status !== "APPROVED") {
      return {
        success: false,
        error: `Only approved studios can publish new pieces. Your current status is ${seller.status}.`,
      };
    }

    if (!input.title || input.title.trim().length < 3) {
      return { success: false, error: "Product title must be at least 3 characters long." };
    }
    if (!input.basePrice || input.basePrice <= 0) {
      return { success: false, error: "Base price must be greater than zero." };
    }
    if (input.stock < 0) {
      return { success: false, error: "Stock cannot be negative." };
    }

    if (input.variants && input.variants.length > 0) {
      const seenSkus = new Set<string>();
      for (const v of input.variants) {
        if (!v.sku || !v.sku.trim()) {
          return { success: false, error: "Variant SKU is required." };
        }
        const normalizedSku = v.sku.trim().toUpperCase();
        if (seenSkus.has(normalizedSku)) {
          return { success: false, error: `Duplicate variant SKU detected: ${v.sku}` };
        }
        seenSkus.add(normalizedSku);
      }
    }

    const catIdentifier = (input.categoryId || (input as any).category || "").trim();
    let category = null;
    if (catIdentifier) {
      category = await prisma.category.findFirst({
        where: {
          OR: [
            { id: catIdentifier },
            { name: { equals: catIdentifier, mode: "insensitive" } },
            { slug: { equals: catIdentifier, mode: "insensitive" } },
          ],
        },
      });
    }
    if (!category) {
      return { success: false, error: "Please select a valid marketplace category." };
    }

    const baseSlug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    const basePricePaise = Math.round(input.basePrice * 100);
    const compareAtPricePaise = input.compareAtPrice ? Math.round(input.compareAtPrice * 100) : null;

    const isDraft = input.action === "DRAFT";
    const approvalStatus = isDraft
      ? ProductApprovalStatus.DRAFT
      : ProductApprovalStatus.PENDING_REVIEW;
    const isPublished = false; // Submissions require explicit Admin approval before becoming live

    try {
      const created = await prisma.$transaction(async (tx) => {
        const prod = await tx.product.create({
          data: {
            slug,
            title: input.title.trim(),
            subtitle: input.subtitle?.trim() || "Handcrafted studio piece",
            description: input.description?.trim() || input.title.trim(),
            categoryId: category.id,
            vendorId: seller.id,
            basePricePaise,
            compareAtPricePaise,
            stock: input.stock,
            lowStockThreshold: input.lowStockThreshold || 5,
            isPublished,
            approvalStatus,
            material: input.material,
            dimensions: input.dimensions,
            weight: input.weight,
            careInstructions: input.careInstructions,
            brand: input.brand?.trim() || null,
            sku: input.sku?.trim() || null,
            productType: input.productType?.trim() || null,
            subcategory: input.subcategory?.trim() || null,
            searchKeywords: input.searchKeywords?.trim() || null,
            dispatchEstimate: input.dispatchEstimate?.trim() || null,
            packageDimensions: input.packageDimensions?.trim() || null,
            taxRatePercent: input.taxRatePercent !== undefined ? input.taxRatePercent : 12.0,
            attributesJson: input.attributes ? JSON.stringify(input.attributes) : null,
            submittedForReviewAt: approvalStatus === ProductApprovalStatus.PENDING_REVIEW ? new Date() : null,
            metaTitle: input.metaTitle?.trim() || null,
            metaDescription: input.metaDescription?.trim() || null,
            canonicalUrl: input.canonicalUrl?.trim() || null,
            ogImage: input.ogImage?.trim() || null,
            highlightsJson: input.highlights ? JSON.stringify(input.highlights) : null,
            mpn: input.mpn?.trim() || null,
            gtin: input.gtin?.trim() || null,
            countryOfOrigin: input.countryOfOrigin?.trim() || "India",
            googleProductCategory: input.googleProductCategory?.trim() || null,
            condition: input.condition || "NEW",
            targetGender: input.targetGender || "unisex",
            targetAgeGroup: input.targetAgeGroup || "adult",
            images: {
              create: (input.images || []).map((url, idx) => ({
                url,
                alt: `${input.title} - View ${idx + 1}`,
                sortOrder: idx,
              })),
            },
          },
          include: {
            category: true,
            vendor: true,
            images: true,
            variants: true,
          },
        });

        if (input.variants && input.variants.length > 0) {
          for (const v of input.variants) {
            await tx.productVariant.create({
              data: {
                productId: prod.id,
                sku: v.sku.trim(),
                variantType: v.variantType,
                name: v.name,
                value: v.value,
                hexCode: v.hexCode,
                imageUrl: v.imageUrl,
                stock: Math.max(0, v.stock || 0),
                additionalPricePaise: v.additionalPrice ? Math.round(v.additionalPrice * 100) : 0,
              },
            });
          }
        }

        await tx.auditEvent.create({
          data: {
            entityType: "PRODUCT",
            entityId: prod.id,
            action: isDraft ? "PRODUCT_CREATED_AS_DRAFT" : "PRODUCT_SUBMITTED_FOR_REVIEW",
            note: `Product "${prod.title}" created by seller "${seller.name}" (${isDraft ? "Saved as Draft" : "Submitted for Review"}). Initial status: ${approvalStatus}.`,
            performedBy: seller.businessEmail || seller.name,
          },
        });

        return tx.product.findUnique({
          where: { id: prod.id },
          include: {
            category: true,
            vendor: true,
            images: { orderBy: { sortOrder: "asc" } },
            variants: true,
          },
        });
      });

      if (!created) throw new Error("Product creation failed.");

      if (input.draftKey) {
        await supplierDraftService.markDraftSubmitted(seller.id, input.draftKey);
      }
      await productRevisionService.createRevision(created.id, seller.businessEmail || seller.name);

      return { success: true, product: mapDbProductToFrontend(created) };
    } catch (err: any) {
      if (err.code === "P2002") {
        return { success: false, error: "A variant with this SKU already exists. SKUs must be unique." };
      }
      return { success: false, error: err.message || "Failed to create product." };
    }
  }

  /**
   * Updates an existing product with strict seller ownership verification.
   */
  /**
   * Retrieves full details for a product belonging strictly to the requesting seller.
   */
  public async getProductById(
    sellerId: string,
    productId: string
  ): Promise<{ success: boolean; product?: SellerProductDetailView; error?: string }> {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        vendorId: sellerId,
      },
      include: {
        category: true,
        vendor: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
    });

    if (!product) {
      return { success: false, error: "Product not found or access denied." };
    }

    return {
      success: true,
      product: {
        id: product.id,
        slug: product.slug,
        title: product.title,
        subtitle: product.subtitle,
        description: product.description,
        categoryId: product.categoryId,
        categoryName: product.category.name,
        vendorId: product.vendorId,
        basePrice: Math.round(product.basePricePaise / 100),
        compareAtPrice: product.compareAtPricePaise ? Math.round(product.compareAtPricePaise / 100) : null,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        isPublished: product.isPublished,
        approvalStatus: product.approvalStatus,
        moderationNotes: product.moderationNotes,
        material: product.material,
        dimensions: product.dimensions,
        weight: product.weight,
        careInstructions: product.careInstructions,
        brand: product.brand,
        sku: product.sku,
        productType: product.productType,
        subcategory: product.subcategory,
        searchKeywords: product.searchKeywords,
        dispatchEstimate: product.dispatchEstimate,
        packageDimensions: product.packageDimensions,
        taxRatePercent: product.taxRatePercent,
        images: product.images.map((img) => img.url),
        variants: product.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          variantType: v.variantType as "COLOR" | "SIZE",
          name: v.name,
          value: v.value,
          hexCode: v.hexCode,
          imageUrl: v.imageUrl,
          stock: v.stock,
          additionalPrice: Math.round(v.additionalPricePaise / 100),
        })),
        attributes: product.attributesJson ? JSON.parse(product.attributesJson) : undefined,
        submittedForReviewAt: product.submittedForReviewAt ? product.submittedForReviewAt.toISOString() : null,
        isReviewOverdue: product.isReviewOverdue,
        reviewOverdueAt: product.reviewOverdueAt ? product.reviewOverdueAt.toISOString() : null,
        rejectedFields: product.rejectedFieldsJson ? JSON.parse(product.rejectedFieldsJson) : undefined,
        suggestedCorrections: product.suggestedCorrectionsJson || null,
        metaTitle: product.metaTitle || null,
        metaDescription: product.metaDescription || null,
        canonicalUrl: product.canonicalUrl || null,
        highlights: product.highlightsJson ? JSON.parse(product.highlightsJson) : undefined,
        mpn: product.mpn || null,
        gtin: product.gtin || null,
        countryOfOrigin: product.countryOfOrigin || "India",
        googleProductCategory: product.googleProductCategory || null,
        condition: product.condition || "NEW",
        targetGender: product.targetGender || "unisex",
        targetAgeGroup: product.targetAgeGroup || "adult",
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Updates an existing product with strict seller ownership verification.
   * Material changes on approved pieces automatically re-enter the moderation queue and unpublish.
   */
  public async updateProduct(
    sellerId: string,
    productId: string,
    input: Partial<SellerProductInput>
  ): Promise<{ success: boolean; product?: Product; error?: string }> {
    const existing = await prisma.product.findFirst({
      where: { id: productId, vendorId: sellerId },
      include: { vendor: true },
    });

    if (!existing) {
      return { success: false, error: "Product not found or access denied." };
    }

    if (input.stock !== undefined && input.stock < 0) {
      return { success: false, error: "Stock cannot be negative." };
    }

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const updateData: any = {};
        if (input.title) updateData.title = input.title.trim();
        if (input.subtitle) updateData.subtitle = input.subtitle.trim();
        if (input.description) updateData.description = input.description.trim();
        if (input.categoryId) {
          const cat = await tx.category.findUnique({ where: { id: input.categoryId } });
          if (cat) updateData.categoryId = cat.id;
        }
        if (input.basePrice) updateData.basePricePaise = Math.round(input.basePrice * 100);
        if (input.compareAtPrice !== undefined) {
          updateData.compareAtPricePaise = input.compareAtPrice ? Math.round(input.compareAtPrice * 100) : null;
        }
        if (input.stock !== undefined) updateData.stock = input.stock;
        if (input.lowStockThreshold !== undefined) updateData.lowStockThreshold = input.lowStockThreshold;
        if (input.material !== undefined) updateData.material = input.material;
        if (input.dimensions !== undefined) updateData.dimensions = input.dimensions;
        if (input.weight !== undefined) updateData.weight = input.weight;
        if (input.careInstructions !== undefined) updateData.careInstructions = input.careInstructions;
        if (input.brand !== undefined) updateData.brand = input.brand ? input.brand.trim() : null;
        if (input.sku !== undefined) updateData.sku = input.sku ? input.sku.trim() : null;
        if (input.productType !== undefined) updateData.productType = input.productType ? input.productType.trim() : null;
        if (input.subcategory !== undefined) updateData.subcategory = input.subcategory ? input.subcategory.trim() : null;
        if (input.searchKeywords !== undefined) updateData.searchKeywords = input.searchKeywords ? input.searchKeywords.trim() : null;
        if (input.dispatchEstimate !== undefined) updateData.dispatchEstimate = input.dispatchEstimate ? input.dispatchEstimate.trim() : null;
        if (input.packageDimensions !== undefined) updateData.packageDimensions = input.packageDimensions ? input.packageDimensions.trim() : null;
        if (input.taxRatePercent !== undefined) updateData.taxRatePercent = input.taxRatePercent;
        if (input.attributes !== undefined) updateData.attributesJson = JSON.stringify(input.attributes);

        if (input.metaTitle !== undefined) updateData.metaTitle = input.metaTitle ? input.metaTitle.trim() : null;
        if (input.metaDescription !== undefined) updateData.metaDescription = input.metaDescription ? input.metaDescription.trim() : null;
        if (input.canonicalUrl !== undefined) updateData.canonicalUrl = input.canonicalUrl ? input.canonicalUrl.trim() : null;
        if (input.ogImage !== undefined) updateData.ogImage = input.ogImage ? input.ogImage.trim() : null;
        if (input.highlights !== undefined) updateData.highlightsJson = input.highlights ? JSON.stringify(input.highlights) : null;
        if (input.mpn !== undefined) updateData.mpn = input.mpn ? input.mpn.trim() : null;
        if (input.gtin !== undefined) updateData.gtin = input.gtin ? input.gtin.trim() : null;
        if (input.countryOfOrigin !== undefined) updateData.countryOfOrigin = input.countryOfOrigin ? input.countryOfOrigin.trim() : "India";
        if (input.googleProductCategory !== undefined) updateData.googleProductCategory = input.googleProductCategory ? input.googleProductCategory.trim() : null;
        if (input.condition !== undefined) updateData.condition = input.condition;
        if (input.targetGender !== undefined) updateData.targetGender = input.targetGender;
        if (input.targetAgeGroup !== undefined) updateData.targetAgeGroup = input.targetAgeGroup;

        if (input.slug && input.slug.trim() && input.slug.trim() !== existing.slug) {
          const newSlug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/\s+/g, "-");
          await slugRedirectService.recordSlugChange(existing.id, existing.slug, newSlug);
          updateData.slug = newSlug;
        }

        let auditAction = "PRODUCT_UPDATED";
        let auditNote = `Product "${existing.title}" updated by seller.`;

        if (existing.approvalStatus === ProductApprovalStatus.APPROVED) {
          updateData.approvalStatus = ProductApprovalStatus.PENDING_REVIEW;
          updateData.isPublished = true; // Existing public product version remains visible to patrons until re-approval
          updateData.submittedForReviewAt = new Date();
          updateData.isReviewOverdue = false;
          updateData.reviewOverdueAt = null;
          updateData.slaReminderCount = 0;
          auditAction = "PRODUCT_EDITED_REMODERATION_TRIGGERED";
          auditNote = `Approved piece "${existing.title}" edited by seller; queued for Admin review while existing public version remains visible.`;
        } else if (input.action === "SUBMIT" || existing.approvalStatus === ProductApprovalStatus.CHANGES_REQUESTED) {
          updateData.approvalStatus = ProductApprovalStatus.PENDING_REVIEW;
          updateData.isPublished = false;
          updateData.submittedForReviewAt = new Date();
          updateData.isReviewOverdue = false;
          updateData.reviewOverdueAt = null;
          updateData.slaReminderCount = 0;
          updateData.rejectedFieldsJson = null;
          updateData.suggestedCorrectionsJson = null;
          auditAction = "PRODUCT_RESUBMITTED_FOR_REVIEW";
          auditNote = `Product "${existing.title}" submitted for Admin review.`;
        } else if (input.action === "DRAFT") {
          updateData.approvalStatus = ProductApprovalStatus.DRAFT;
          updateData.isPublished = false;
          auditAction = "PRODUCT_SAVED_AS_DRAFT";
          auditNote = `Product "${existing.title}" saved as draft.`;
        }

        if (input.images && input.images.length > 0) {
          await tx.productImage.deleteMany({ where: { productId } });
          await tx.productImage.createMany({
            data: input.images.map((url, idx) => ({
              productId,
              url,
              alt: `${input.title || existing.title} view ${idx + 1}`,
              sortOrder: idx,
            })),
          });
        }

        if (input.variants !== undefined) {
          const seenSkus = new Set<string>();
          for (const v of input.variants) {
            if (!v.sku || !v.sku.trim()) {
              throw new Error("Variant SKU is required.");
            }
            const normalizedSku = v.sku.trim().toUpperCase();
            if (seenSkus.has(normalizedSku)) {
              throw new Error(`Duplicate variant SKU detected: ${v.sku}`);
            }
            seenSkus.add(normalizedSku);
          }

          await tx.productVariant.deleteMany({ where: { productId } });
          for (const v of input.variants) {
            await tx.productVariant.create({
              data: {
                productId,
                sku: v.sku.trim(),
                variantType: v.variantType,
                name: v.name,
                value: v.value,
                hexCode: v.hexCode,
                imageUrl: v.imageUrl,
                stock: Math.max(0, v.stock || 0),
                additionalPricePaise: v.additionalPrice ? Math.round(v.additionalPrice * 100) : 0,
              },
            });
          }
        }

        await tx.auditEvent.create({
          data: {
            entityType: "PRODUCT",
            entityId: productId,
            action: auditAction,
            note: auditNote,
            performedBy: existing.vendor.businessEmail || existing.vendor.name,
          },
        });

        return tx.product.update({
          where: { id: productId },
          data: updateData,
          include: {
            category: true,
            vendor: true,
            images: { orderBy: { sortOrder: "asc" } },
            variants: true,
          },
        });
      });

      if (!updated) throw new Error("Product update failed.");

      if (input.draftKey) {
        await supplierDraftService.markDraftSubmitted(sellerId, input.draftKey);
      }
      await productRevisionService.createRevision(productId, existing.vendor.businessEmail || existing.vendor.name, {
        changedFields: Object.keys(input),
      });

      return { success: true, product: mapDbProductToFrontend(updated) };
    } catch (err: any) {
      if (err.code === "P2002") {
        return { success: false, error: "A variant with this SKU already exists. SKUs must be unique." };
      }
      return { success: false, error: err.message || "Failed to update product." };
    }
  }

  /**
   * Unpublishes or archives a product belonging to the seller.
   */
  public async unpublishProduct(
    sellerId: string,
    productId: string
  ): Promise<{ success: boolean; error?: string }> {
    const existing = await prisma.product.findFirst({
      where: { id: productId, vendorId: sellerId },
    });

    if (!existing) {
      return { success: false, error: "Product not found or access denied." };
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        isPublished: false,
        approvalStatus: ProductApprovalStatus.ARCHIVED,
      },
    });

    return { success: true };
  }

  /**
   * Batch updates inventory levels atomically with negative stock prevention.
   */
  public async updateInventoryBatch(
    sellerId: string,
    items: InventoryBatchUpdateItem[]
  ): Promise<{ success: boolean; updatedCount: number; error?: string }> {
    if (!items || items.length === 0) {
      return { success: false, updatedCount: 0, error: "No inventory items provided for update." };
    }

    try {
      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          const product = await tx.product.findFirst({
            where: { id: item.productId, vendorId: sellerId },
          });

          if (!product) {
            throw new Error(`Product ${item.productId} not found or access denied.`);
          }

          let newStock = product.stock;
          if (item.newStock !== undefined) {
            newStock = item.newStock;
          } else if (item.stockDelta !== undefined) {
            newStock += item.stockDelta;
          }

          if (newStock < 0) {
            throw new Error(`Stock for "${product.title}" cannot be negative (${newStock}).`);
          }

          await tx.product.update({
            where: { id: product.id },
            data: { stock: newStock },
          });

          if (item.variantSku) {
            await tx.productVariant.updateMany({
              where: { productId: product.id, sku: item.variantSku },
              data: { stock: newStock },
            });
          }
        }
      });

      return { success: true, updatedCount: items.length };
    } catch (err: any) {
      return { success: false, updatedCount: 0, error: err.message || "Failed to update inventory batch." };
    }
  }

  /**
   * Imports inventory adjustments from CSV with schema validation and row-level error reporting.
   */
  public async importInventoryCsv(
    sellerId: string,
    csvContent: string
  ): Promise<CsvImportResult> {
    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const result: CsvImportResult = {
      totalRows: 0,
      successfulRows: 0,
      failedRows: 0,
      errors: [],
      appliedChanges: [],
    };

    if (lines.length <= 1) {
      result.errors.push({ row: 0, error: "CSV file is empty or missing data rows." });
      return result;
    }

    const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
    const skuIdx = header.indexOf("sku");
    const qtyIdx = header.indexOf("quantity") !== -1 ? header.indexOf("quantity") : header.indexOf("stock");
    const modeIdx = header.indexOf("mode"); // 'set' or 'adjust'

    if (skuIdx === -1 || qtyIdx === -1) {
      result.errors.push({
        row: 0,
        error: "Missing required columns: CSV must include 'sku' and 'quantity' (or 'stock').",
      });
      return result;
    }

    const seenSkusInFile = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      result.totalRows++;
      const rowParts = lines[i].split(",").map((p) => p.trim());
      const sku = rowParts[skuIdx];
      const rawQty = rowParts[qtyIdx];
      const mode = modeIdx !== -1 ? (rowParts[modeIdx] || "set").toLowerCase() : "set";

      if (!sku) {
        result.failedRows++;
        result.errors.push({ row: i + 1, error: "Empty SKU in row." });
        continue;
      }

      if (seenSkusInFile.has(sku)) {
        result.failedRows++;
        result.errors.push({ row: i + 1, sku, error: `Duplicate SKU "${sku}" within the same CSV file.` });
        continue;
      }
      seenSkusInFile.add(sku);

      const qty = parseInt(rawQty, 10);
      if (isNaN(qty)) {
        result.failedRows++;
        result.errors.push({ row: i + 1, sku, error: `Invalid numeric quantity "${rawQty}".` });
        continue;
      }

      try {
        const variant = await prisma.productVariant.findFirst({
          where: { sku },
          include: { product: true },
        });

        if (!variant || variant.product.vendorId !== sellerId) {
          result.failedRows++;
          result.errors.push({
            row: i + 1,
            sku,
            error: `SKU "${sku}" does not exist or does not belong to your studio.`,
          });
          continue;
        }

        const prevStock = variant.stock;
        const targetStock = mode === "adjust" ? prevStock + qty : qty;

        if (targetStock < 0) {
          result.failedRows++;
          result.errors.push({
            row: i + 1,
            sku,
            error: `Target stock cannot be negative (current: ${prevStock}, calculated: ${targetStock}).`,
          });
          continue;
        }

        await prisma.$transaction([
          prisma.productVariant.update({
            where: { id: variant.id },
            data: { stock: targetStock },
          }),
          prisma.product.update({
            where: { id: variant.productId },
            data: { stock: targetStock },
          }),
          prisma.stockMovement.create({
            data: {
              vendorId: sellerId,
              productId: variant.productId,
              variantId: variant.id,
              sku: variant.sku,
              type: "CORRECTION",
              quantityDelta: targetStock - prevStock,
              previousStock: prevStock,
              updatedStock: targetStock,
              reason: "Bulk CSV inventory import",
              performedBy: "Merchant CSV Import",
              referenceId: "CSV-IMPORT",
            },
          }),
        ]);

        result.successfulRows++;
        result.appliedChanges.push({
          sku,
          previousStock: prevStock,
          updatedStock: targetStock,
        });
      } catch {
        result.failedRows++;
        result.errors.push({ row: i + 1, sku, error: "Database transaction failure updating SKU." });
      }
    }

    return result;
  }

  /**
   * Retrieves order items assigned strictly to the authenticated seller.
   */
  public async getSellerOrderLines(
    sellerId: string,
    options: {
      status?: FulfillmentStatus;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ orderLines: SellerOrderLine[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      vendorId: sellerId,
    };

    if (options.status) {
      where.fulfillmentStatus = options.status;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { orderId: { contains: q, mode: "insensitive" } },
        { trackingNumber: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await prisma.$transaction([
      prisma.orderItem.count({ where }),
      prisma.orderItem.findMany({
        where,
        include: {
          order: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const orderLines: SellerOrderLine[] = items.map((item) => {
      let shippingAddress = {
        fullName: item.order.customerName,
        street: "Studio Address",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      };
      try {
        shippingAddress = JSON.parse(item.order.shippingAddressSnapshot);
      } catch {}

      return {
        id: item.id,
        orderId: item.orderId,
        customerName: item.order.customerName,
        shippingAddress,
        deliveryMethodName: item.order.deliveryMethodName,
        orderedAt: item.order.createdAt.toISOString(),
        productId: item.productId,
        productSlug: item.productSlug,
        title: item.title,
        sku: item.selectedSku,
        selectedColorName: item.selectedColorName,
        selectedSize: item.selectedSize,
        quantity: item.quantity,
        unitPrice: item.unitPricePaise / 100,
        lineTotal: item.lineTotalPaise / 100,
        imageSnapshot: item.imageSnapshot,
        fulfillmentStatus: item.fulfillmentStatus as any,
        courierName: item.courierName,
        trackingNumber: item.trackingNumber,
        dispatchedAt: item.dispatchedAt ? item.dispatchedAt.toISOString() : null,
        deliveredAt: item.deliveredAt ? item.deliveredAt.toISOString() : null,
        cancellationReason: item.cancellationReason,
      };
    });

    return {
      orderLines,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Updates fulfillment state on a seller's specific order item.
   * Validates permitted state transitions and updates parent order if all items dispatched.
   */
  public async updateFulfillmentStatus(
    sellerId: string,
    orderItemId: string,
    newStatus: FulfillmentStatus,
    tracking?: { courierName?: string; trackingNumber?: string; cancellationReason?: string }
  ): Promise<{ success: boolean; orderLine?: SellerOrderLine; error?: string }> {
    const item = await prisma.orderItem.findFirst({
      where: { id: orderItemId, vendorId: sellerId },
      include: { order: true },
    });

    if (!item) {
      return { success: false, error: "Order item not found or access denied." };
    }

    const currentStatus = item.fulfillmentStatus;

    if (currentStatus === "CANCELLED") {
      return { success: false, error: "Cancelled items cannot be updated." };
    }
    if (currentStatus === "DELIVERED") {
      return { success: false, error: "Delivered items have reached terminal fulfillment status." };
    }

    if (newStatus === "SHIPPED") {
      if (!tracking?.courierName || !tracking?.trackingNumber) {
        return {
          success: false,
          error: "Courier name and tracking number are mandatory to mark an item shipped.",
        };
      }
    }

    const allowedTransitions: Record<string, string[]> = {
      NEW: ["PROCESSING", "PACKED", "CANCELLED"],
      PROCESSING: ["PACKED", "SHIPPED", "CANCELLED"],
      PACKED: ["SHIPPED", "CANCELLED"],
      SHIPPED: ["DELIVERED"],
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      return {
        success: false,
        error: `Invalid status transition from ${currentStatus} to ${newStatus}.`,
      };
    }

    try {
      const updatedItem = await prisma.$transaction(async (tx) => {
        const updateData: any = {
          fulfillmentStatus: newStatus,
        };

        if (newStatus === "SHIPPED") {
          updateData.courierName = tracking?.courierName?.trim();
          updateData.trackingNumber = tracking?.trackingNumber?.trim();
          updateData.dispatchedAt = new Date();
        } else if (newStatus === "DELIVERED") {
          updateData.deliveredAt = new Date();
        } else if (newStatus === "CANCELLED") {
          updateData.cancellationReason = tracking?.cancellationReason || "Cancelled by vendor prior to dispatch.";
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }

        const res = await tx.orderItem.update({
          where: { id: orderItemId },
          data: updateData,
          include: { order: true },
        });

        await tx.auditEvent.create({
          data: {
            orderId: item.orderId,
            entityType: "ORDER_ITEM",
            entityId: orderItemId,
            action: `FULFILLMENT_${newStatus}`,
            note: `Vendor updated item "${item.title}" status to ${newStatus}.${
              tracking?.trackingNumber ? ` Tracking: ${tracking.courierName} #${tracking.trackingNumber}` : ""
            }`,
            performedBy: `seller:${sellerId}`,
          },
        });

        if (newStatus === "SHIPPED") {
          await tx.vendorPayout.updateMany({
            where: { orderItemId: item.id, status: PayoutStatus.ESCROW_HOLD },
            data: { status: PayoutStatus.ESCROW_HOLD },
          });
        } else if (newStatus === "DELIVERED") {
          await tx.vendorPayout.updateMany({
            where: { orderItemId: item.id },
            data: { status: PayoutStatus.ELIGIBLE_FOR_PAYOUT },
          });
        }

        const allItemsInOrder = await tx.orderItem.findMany({
          where: { orderId: item.orderId },
        });

        const allDelivered = allItemsInOrder.every(
          (i) => i.id === item.id ? newStatus === "DELIVERED" : i.fulfillmentStatus === "DELIVERED"
        );

        const allShippedOrDelivered = allItemsInOrder.every(
          (i) => i.id === item.id ? newStatus === "SHIPPED" || newStatus === "DELIVERED" : i.fulfillmentStatus === "SHIPPED" || i.fulfillmentStatus === "DELIVERED"
        );

        if (allDelivered) {
          await tx.order.update({
            where: { id: item.orderId },
            data: { status: OrderStatus.DELIVERED },
          });
        } else if (allShippedOrDelivered && item.order.status !== "DELIVERED") {
          await tx.order.update({
            where: { id: item.orderId },
            data: { status: OrderStatus.SHIPPED },
          });
        }

        return res;
      });

      let shippingAddress = {
        fullName: updatedItem.order.customerName,
        street: "Studio Address",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      };
      try {
        shippingAddress = JSON.parse(updatedItem.order.shippingAddressSnapshot);
      } catch {}

      return {
        success: true,
        orderLine: {
          id: updatedItem.id,
          orderId: updatedItem.orderId,
          customerName: updatedItem.order.customerName,
          shippingAddress,
          deliveryMethodName: updatedItem.order.deliveryMethodName,
          orderedAt: updatedItem.order.createdAt.toISOString(),
          productId: updatedItem.productId,
          productSlug: updatedItem.productSlug,
          title: updatedItem.title,
          sku: updatedItem.selectedSku,
          selectedColorName: updatedItem.selectedColorName,
          selectedSize: updatedItem.selectedSize,
          quantity: updatedItem.quantity,
          unitPrice: updatedItem.unitPricePaise / 100,
          lineTotal: updatedItem.lineTotalPaise / 100,
          imageSnapshot: updatedItem.imageSnapshot,
          fulfillmentStatus: updatedItem.fulfillmentStatus as any,
          courierName: updatedItem.courierName,
          trackingNumber: updatedItem.trackingNumber,
          dispatchedAt: updatedItem.dispatchedAt ? updatedItem.dispatchedAt.toISOString() : null,
          deliveredAt: updatedItem.deliveredAt ? updatedItem.deliveredAt.toISOString() : null,
          cancellationReason: updatedItem.cancellationReason,
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update fulfillment status." };
    }
  }

  /**
   * Retrieves vendor payouts and settlements ledger for an authenticated seller.
   */
  public async getSellerPayouts(sellerId: string): Promise<SellerPayoutRecord[]> {
    const payouts = await prisma.vendorPayout.findMany({
      where: { sellerId },
      include: {
        orderItem: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return payouts.map((p) => ({
      id: p.id,
      orderItemId: p.orderItemId,
      productTitle: p.orderItem?.title || "Handcrafted Artifact",
      grossAmount: p.grossAmountPaise / 100,
      commission: p.commissionPaise / 100,
      netPayout: p.netPayoutPaise / 100,
      status: p.status as any,
      settledAt: p.settledAt ? p.settledAt.toISOString() : null,
      transactionRef: p.transactionRef,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  /**
   * Admin-only: Updates a seller's onboarding approval status.
   */
  public async adminUpdateSellerStatus(
    adminUserId: string,
    sellerId: string,
    newStatus: SellerStatus,
    rejectionReason?: string
  ): Promise<{ success: boolean; seller?: SellerProfile; error?: string }> {
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return { success: false, error: "Administrative privilege required." };
    }

    try {
      const updated = await prisma.seller.update({
        where: { id: sellerId },
        data: {
          status: newStatus,
          rejectionReason: newStatus === "REJECTED" ? rejectionReason : null,
          approvedAt: newStatus === "APPROVED" ? new Date() : undefined,
          verified: newStatus === "APPROVED",
        },
      });

      return {
        success: true,
        seller: {
          id: updated.id,
          userId: updated.userId,
          slug: updated.slug,
          name: updated.name,
          originHub: updated.originHub,
          story: updated.story,
          heroImage: updated.heroImage,
          verified: updated.verified,
          rating: updated.rating,
          leadTimeDays: updated.leadTimeDays,
          status: updated.status as any,
          businessEmail: updated.businessEmail,
          businessPhone: updated.businessPhone,
          taxIdentifier: updated.taxIdentifier,
          commissionRatePercent: updated.commissionRatePercent,
          rejectionReason: updated.rejectionReason,
          approvedAt: updated.approvedAt ? updated.approvedAt.toISOString() : null,
          createdAt: updated.createdAt.toISOString(),
        },
      };
    } catch {
      return { success: false, error: "Failed to update seller status." };
    }
  }

  public getProducts = this.getSellerProducts.bind(this);
  public getOrderLines = this.getSellerOrderLines.bind(this);
  public getPayouts = this.getSellerPayouts.bind(this);
  public getMetrics = this.getSellerMetrics.bind(this);
  public archiveProduct = this.unpublishProduct.bind(this);
}

export const sellerService = new SellerService();
