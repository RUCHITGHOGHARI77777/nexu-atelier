import { prisma } from "./prisma";
import { StockMovementType, RestockStatus } from "@prisma/client";

export interface InventoryOverview {
  totalProducts: number;
  totalSkus: number;
  totalAvailableStock: number;
  reservedStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  incomingStock: number;
  inventoryValueAtCost: number;
  inventoryValueAtSellingPrice: number;
  adjustmentsThisMonth: number;
}

export type InventoryStockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNPUBLISHED" | "PENDING_APPROVAL";

export interface InventoryItemView {
  id: string; // Product or Variant ID
  productId: string;
  variantId?: string | null;
  productTitle: string;
  sku: string;
  categoryName: string;
  categoryId: string;
  variantLabel: string;
  variantType: string;
  attributes: Record<string, string>;
  imageUrl: string;
  sellingPrice: number;
  costPrice: number | null;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  reorderPoint: number;
  preferredRestockQty: number;
  stockStatus: InventoryStockStatus;
  isPublished: boolean;
  approvalStatus: string;
  salesVelocity30D: number;
  daysOfStockRemaining: number | null;
  lastUpdated: string;
}

export interface StockAdjustmentInput {
  productId: string;
  variantId?: string | null;
  adjustmentType: "ADD" | "REDUCE" | "SET_EXACT" | "RECEIVE" | "DAMAGED" | "LOST" | "CORRECTION";
  quantity: number;
  reason: string;
  note?: string;
  performedBy: string;
}

export interface CreateRestockInput {
  productId: string;
  variantId?: string | null;
  quantityExpected: number;
  supplierName?: string;
  expectedDeliveryDate?: string;
  unitCostPaise?: number;
  note?: string;
  createdBy: string;
}

export interface InventoryFilterOptions {
  search?: string;
  category?: string;
  stockStatus?: InventoryStockStatus | "ALL";
  productStatus?: "ALL" | "PUBLISHED" | "UNPUBLISHED" | "PENDING_APPROVAL";
  hasVariants?: "ALL" | "YES" | "NO";
  sort?: "stock_asc" | "stock_desc" | "title_asc" | "title_desc" | "price_asc" | "price_desc" | "updated_desc";
  page?: number;
  limit?: number;
}

export class InventoryService {
  /**
   * Aggregates authoritative inventory overview metrics for the requesting seller.
   */
  public async getInventoryOverview(sellerId: string): Promise<InventoryOverview> {
    const products = await prisma.product.findMany({
      where: { vendorId: sellerId },
      include: {
        variants: true,
      },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const pendingRestocks = await prisma.restockRecord.findMany({
      where: {
        vendorId: sellerId,
        status: { in: [RestockStatus.PENDING, RestockStatus.PARTIALLY_RECEIVED] },
      },
    });

    const incomingStock = pendingRestocks.reduce(
      (acc: number, r: any) => acc + Math.max(0, r.quantityExpected - r.quantityReceived),
      0
    );

    const adjustmentsThisMonth = await prisma.stockMovement.count({
      where: {
        vendorId: sellerId,
        createdAt: { gte: startOfMonth },
      },
    });

    let totalSkus = 0;
    let totalAvailableStock = 0;
    let totalReservedStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inventoryValueAtSellingPricePaise = 0;
    let inventoryValueAtCostPaise = 0;

    for (const prod of products) {
      if (!prod.variants || prod.variants.length === 0) {
        totalSkus += 1;
        const available = Math.max(0, prod.stock - (prod.reservedStock || 0));
        totalAvailableStock += available;
        totalReservedStock += prod.reservedStock || 0;

        if (prod.stock <= 0) {
          outOfStockCount += 1;
        } else if (prod.stock <= (prod.lowStockThreshold || 5)) {
          lowStockCount += 1;
        }

        inventoryValueAtSellingPricePaise += prod.stock * prod.basePricePaise;
        const costPaise = prod.costPricePaise || Math.round(prod.basePricePaise * 0.6);
        inventoryValueAtCostPaise += prod.stock * costPaise;
      } else {
        for (const v of prod.variants) {
          totalSkus += 1;
          const available = Math.max(0, v.stock - (v.reservedStock || 0));
          totalAvailableStock += available;
          totalReservedStock += v.reservedStock || 0;

          const thresh = v.lowStockThreshold || prod.lowStockThreshold || 5;
          if (v.stock <= 0) {
            outOfStockCount += 1;
          } else if (v.stock <= thresh) {
            lowStockCount += 1;
          }

          const variantSellingPricePaise = prod.basePricePaise + (v.additionalPricePaise || 0);
          inventoryValueAtSellingPricePaise += v.stock * variantSellingPricePaise;
          const variantCostPaise = v.costPricePaise || prod.costPricePaise || Math.round(variantSellingPricePaise * 0.6);
          inventoryValueAtCostPaise += v.stock * variantCostPaise;
        }
      }
    }

    return {
      totalProducts: products.length,
      totalSkus: Math.max(products.length, totalSkus),
      totalAvailableStock,
      reservedStock: totalReservedStock,
      lowStockCount,
      outOfStockCount,
      incomingStock,
      inventoryValueAtSellingPrice: Math.round(inventoryValueAtSellingPricePaise / 100),
      inventoryValueAtCost: Math.round(inventoryValueAtCostPaise / 100),
      adjustmentsThisMonth,
    };
  }

  /**
   * Retrieves granular, flattened inventory records for the seller's catalog with filters and pagination.
   */
  public async getInventoryItems(
    sellerId: string,
    filters: InventoryFilterOptions = {}
  ): Promise<{ items: InventoryItemView[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 25));

    const products = await prisma.product.findMany({
      where: {
        vendorId: sellerId,
        ...(filters.category && {
          OR: [
            { categoryId: filters.category },
            { category: { slug: filters.category } },
            { category: { name: { equals: filters.category, mode: "insensitive" } } },
          ],
        }),
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        orderItems: {
          where: {
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
          select: {
            quantity: true,
            selectedSku: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const flattened: InventoryItemView[] = [];

    for (const prod of products) {
      const totalUnitsSold30D = prod.orderItems.reduce((acc: number, oi: any) => acc + oi.quantity, 0);
      const masterVelocity = parseFloat((totalUnitsSold30D / 30).toFixed(2));

      const hasVariants = prod.variants && prod.variants.length > 0;

      if (!hasVariants) {
        let stockStatus: InventoryStockStatus = "IN_STOCK";
        if (prod.approvalStatus !== "APPROVED") {
          stockStatus = "PENDING_APPROVAL";
        } else if (!prod.isPublished) {
          stockStatus = "UNPUBLISHED";
        } else if (prod.stock <= 0) {
          stockStatus = "OUT_OF_STOCK";
        } else if (prod.stock <= (prod.lowStockThreshold || 5)) {
          stockStatus = "LOW_STOCK";
        }

        const daysRemaining = masterVelocity > 0 ? Math.round(prod.stock / masterVelocity) : null;

        flattened.push({
          id: prod.id,
          productId: prod.id,
          variantId: null,
          productTitle: prod.title,
          sku: prod.sku || `SKU-${prod.id.slice(-6).toUpperCase()}`,
          categoryName: prod.category.name,
          categoryId: prod.categoryId,
          variantLabel: "Standard Piece",
          variantType: "MASTER",
          attributes: {},
          imageUrl: prod.images?.[0]?.url || "/images/placeholder-product.svg",
          sellingPrice: Math.round(prod.basePricePaise / 100),
          costPrice: prod.costPricePaise ? Math.round(prod.costPricePaise / 100) : null,
          currentStock: prod.stock,
          reservedStock: prod.reservedStock || 0,
          availableStock: Math.max(0, prod.stock - (prod.reservedStock || 0)),
          lowStockThreshold: prod.lowStockThreshold || 5,
          reorderPoint: prod.reorderPoint || 10,
          preferredRestockQty: prod.preferredRestockQty || 20,
          stockStatus,
          isPublished: prod.isPublished,
          approvalStatus: prod.approvalStatus,
          salesVelocity30D: masterVelocity,
          daysOfStockRemaining: daysRemaining,
          lastUpdated: prod.updatedAt.toISOString(),
        });
      } else {
        for (const v of prod.variants) {
          const variantUnitsSold = prod.orderItems
            .filter((oi: any) => oi.selectedSku === v.sku)
            .reduce((acc: number, oi: any) => acc + oi.quantity, 0);
          const vVelocity = parseFloat((variantUnitsSold / 30).toFixed(2));
          const vDays = vVelocity > 0 ? Math.round(v.stock / vVelocity) : null;

          const thresh = v.lowStockThreshold || prod.lowStockThreshold || 5;
          let stockStatus: InventoryStockStatus = "IN_STOCK";
          if (prod.approvalStatus !== "APPROVED") {
            stockStatus = "PENDING_APPROVAL";
          } else if (!prod.isPublished) {
            stockStatus = "UNPUBLISHED";
          } else if (v.stock <= 0) {
            stockStatus = "OUT_OF_STOCK";
          } else if (v.stock <= thresh) {
            stockStatus = "LOW_STOCK";
          }

          const sellingPricePaise = prod.basePricePaise + (v.additionalPricePaise || 0);

          flattened.push({
            id: v.id,
            productId: prod.id,
            variantId: v.id,
            productTitle: prod.title,
            sku: v.sku,
            categoryName: prod.category.name,
            categoryId: prod.categoryId,
            variantLabel: `${v.name}: ${v.value}`,
            variantType: v.variantType,
            attributes: { [v.name]: v.value },
            imageUrl: v.imageUrl || prod.images?.[0]?.url || "/images/placeholder-product.svg",
            sellingPrice: Math.round(sellingPricePaise / 100),
            costPrice: v.costPricePaise
              ? Math.round(v.costPricePaise / 100)
              : prod.costPricePaise
              ? Math.round(prod.costPricePaise / 100)
              : null,
            currentStock: v.stock,
            reservedStock: v.reservedStock || 0,
            availableStock: Math.max(0, v.stock - (v.reservedStock || 0)),
            lowStockThreshold: thresh,
            reorderPoint: v.reorderPoint || prod.reorderPoint || 10,
            preferredRestockQty: v.preferredRestockQty || prod.preferredRestockQty || 20,
            stockStatus,
            isPublished: prod.isPublished,
            approvalStatus: prod.approvalStatus,
            salesVelocity30D: vVelocity,
            daysOfStockRemaining: vDays,
            lastUpdated: v.updatedAt.toISOString(),
          });
        }
      }
    }

    let filtered = flattened;

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.productTitle.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.categoryName.toLowerCase().includes(q) ||
          i.variantLabel.toLowerCase().includes(q)
      );
    }

    if (filters.stockStatus && filters.stockStatus !== "ALL") {
      filtered = filtered.filter((i) => i.stockStatus === filters.stockStatus);
    }

    if (filters.productStatus && filters.productStatus !== "ALL") {
      if (filters.productStatus === "PUBLISHED") {
        filtered = filtered.filter((i) => i.isPublished && i.approvalStatus === "APPROVED");
      } else if (filters.productStatus === "UNPUBLISHED") {
        filtered = filtered.filter((i) => !i.isPublished);
      } else if (filters.productStatus === "PENDING_APPROVAL") {
        filtered = filtered.filter((i) => i.approvalStatus !== "APPROVED");
      }
    }

    if (filters.hasVariants && filters.hasVariants !== "ALL") {
      if (filters.hasVariants === "YES") {
        filtered = filtered.filter((i) => !!i.variantId);
      } else {
        filtered = filtered.filter((i) => !i.variantId);
      }
    }

    if (filters.sort) {
      switch (filters.sort) {
        case "stock_asc":
          filtered.sort((a, b) => a.currentStock - b.currentStock);
          break;
        case "stock_desc":
          filtered.sort((a, b) => b.currentStock - a.currentStock);
          break;
        case "title_asc":
          filtered.sort((a, b) => a.productTitle.localeCompare(b.productTitle));
          break;
        case "title_desc":
          filtered.sort((a, b) => b.productTitle.localeCompare(a.productTitle));
          break;
        case "price_asc":
          filtered.sort((a, b) => a.sellingPrice - b.sellingPrice);
          break;
        case "price_desc":
          filtered.sort((a, b) => b.sellingPrice - a.sellingPrice);
          break;
        case "updated_desc":
        default:
          filtered.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
          break;
      }
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return {
      items: paginated,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Applies an authoritative stock adjustment to a product or variant with an immutable audit record.
   */
  public async adjustStock(
    sellerId: string,
    input: StockAdjustmentInput
  ): Promise<{ success: boolean; updatedStock: number; movementId?: string; error?: string }> {
    if (input.quantity === undefined || isNaN(input.quantity)) {
      return { success: false, updatedStock: 0, error: "Valid quantity is required." };
    }

    try {
      const result = await prisma.$transaction(async (tx: any) => {
        const product = await tx.product.findFirst({
          where: { id: input.productId, vendorId: sellerId },
          include: { variants: true },
        });

        if (!product) {
          throw new Error("Product not found or access denied.");
        }

        let currentStock = 0;
        let previousStock = 0;
        let delta = 0;
        let targetSku = product.sku || `SKU-${product.id.slice(-6).toUpperCase()}`;

        let variant = null;
        if (input.variantId) {
          variant = product.variants.find((v: any) => v.id === input.variantId);
          if (!variant) {
            throw new Error("Specified variant not found on this product.");
          }
          previousStock = variant.stock;
          targetSku = variant.sku;
        } else {
          previousStock = product.stock;
        }

        const qty = Math.abs(Math.round(input.quantity));
        let type: StockMovementType = StockMovementType.MANUAL_ADJUSTMENT;

        switch (input.adjustmentType) {
          case "ADD":
            delta = qty;
            type = StockMovementType.MANUAL_ADJUSTMENT;
            break;
          case "RECEIVE":
            delta = qty;
            type = StockMovementType.STOCK_RECEIVED;
            break;
          case "REDUCE":
            delta = -qty;
            type = StockMovementType.MANUAL_ADJUSTMENT;
            break;
          case "DAMAGED":
            delta = -qty;
            type = StockMovementType.DAMAGED;
            break;
          case "LOST":
            delta = -qty;
            type = StockMovementType.LOST;
            break;
          case "SET_EXACT":
            delta = qty - previousStock;
            type = StockMovementType.MANUAL_ADJUSTMENT;
            break;
          case "CORRECTION":
            delta = qty - previousStock;
            type = StockMovementType.CORRECTION;
            break;
          default:
            delta = qty;
            type = StockMovementType.MANUAL_ADJUSTMENT;
            break;
        }

        currentStock = previousStock + delta;

        if (currentStock < 0) {
          throw new Error(`Insufficient inventory: Cannot reduce stock below 0 (current: ${previousStock}, adjustment: ${delta}).`);
        }

        if (variant) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: currentStock },
          });

          const allVariants = await tx.productVariant.findMany({
            where: { productId: product.id },
          });
          const totalVariantStock = allVariants.reduce(
            (acc: number, v: any) => acc + (v.id === variant.id ? currentStock : v.stock),
            0
          );
          await tx.product.update({
            where: { id: product.id },
            data: { stock: totalVariantStock },
          });
        } else {
          await tx.product.update({
            where: { id: product.id },
            data: { stock: currentStock },
          });
        }

        const movement = await tx.stockMovement.create({
          data: {
            vendorId: sellerId,
            productId: product.id,
            variantId: variant ? variant.id : null,
            sku: targetSku,
            type,
            quantityDelta: delta,
            previousStock,
            updatedStock: currentStock,
            reason: input.reason || "Manual inventory adjustment",
            note: input.note || null,
            performedBy: input.performedBy || "Artisan Seller",
            referenceId: `ADJ-${Date.now().toString(36).toUpperCase()}`,
          },
        });

        return { currentStock, movementId: movement.id };
      });

      return { success: true, updatedStock: result.currentStock, movementId: result.movementId };
    } catch (err: any) {
      return { success: false, updatedStock: 0, error: err.message || "Failed to adjust stock." };
    }
  }

  /**
   * Executes atomic bulk stock updates across multiple items.
   */
  public async bulkAdjustStock(
    sellerId: string,
    items: Array<{ productId: string; variantId?: string | null; quantity: number; adjustmentType: any; reason: string }>,
    performedBy: string
  ): Promise<{ success: boolean; updatedCount: number; errors?: string[] }> {
    if (!items || items.length === 0) {
      return { success: false, updatedCount: 0, errors: ["No items provided for bulk update."] };
    }

    const errors: string[] = [];
    let updatedCount = 0;

    for (const item of items) {
      const res = await this.adjustStock(sellerId, {
        productId: item.productId,
        variantId: item.variantId,
        adjustmentType: item.adjustmentType || "SET_EXACT",
        quantity: item.quantity,
        reason: item.reason || "Bulk batch inventory adjustment",
        performedBy,
      });

      if (res.success) {
        updatedCount += 1;
      } else {
        errors.push(`Item ${item.productId}${item.variantId ? ` (${item.variantId})` : ""}: ${res.error}`);
      }
    }

    return {
      success: updatedCount > 0,
      updatedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Creates an inbound replenishment / restock record.
   */
  public async createRestockRecord(
    sellerId: string,
    input: CreateRestockInput
  ): Promise<{ success: boolean; restockRecord?: any; error?: string }> {
    const product = await prisma.product.findFirst({
      where: { id: input.productId, vendorId: sellerId },
      include: { variants: true },
    });

    if (!product) {
      return { success: false, error: "Product not found or access denied." };
    }

    let targetSku = product.sku || `SKU-${product.id.slice(-6).toUpperCase()}`;
    if (input.variantId) {
      const variant = product.variants.find((v: any) => v.id === input.variantId);
      if (variant) targetSku = variant.sku;
    }

    try {
      const record = await prisma.restockRecord.create({
        data: {
          vendorId: sellerId,
          productId: product.id,
          variantId: input.variantId || null,
          sku: targetSku,
          quantityExpected: Math.max(1, Math.round(input.quantityExpected)),
          supplierName: input.supplierName?.trim() || null,
          expectedDeliveryDate: input.expectedDeliveryDate ? new Date(input.expectedDeliveryDate) : null,
          unitCostPaise: input.unitCostPaise || null,
          note: input.note?.trim() || null,
          createdBy: input.createdBy || "Artisan Merchant",
        },
      });

      return { success: true, restockRecord: record };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to create restock record." };
    }
  }

  /**
   * Receives incoming stock from a restock record, automatically incrementing sellable stock and logging audit.
   */
  public async receiveRestock(
    sellerId: string,
    restockId: string,
    receivedQuantity?: number,
    performedBy: string = "Artisan Merchant"
  ): Promise<{ success: boolean; error?: string }> {
    const record = await prisma.restockRecord.findFirst({
      where: { id: restockId, vendorId: sellerId },
    });

    if (!record) {
      return { success: false, error: "Restock record not found or access denied." };
    }

    if (record.status === RestockStatus.RECEIVED || record.status === RestockStatus.CANCELLED) {
      return { success: false, error: `Restock record is already ${record.status}.` };
    }

    const qtyToReceive = receivedQuantity !== undefined
      ? Math.max(1, Math.round(receivedQuantity))
      : record.quantityExpected - record.quantityReceived;

    try {
      await prisma.$transaction(async (tx: any) => {
        let prev = 0;
        let updated = 0;

        if (record.variantId) {
          const variant = await tx.productVariant.findUnique({ where: { id: record.variantId } });
          if (variant) {
            prev = variant.stock;
            updated = prev + qtyToReceive;
            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stock: updated },
            });
            await tx.product.update({
              where: { id: record.productId },
              data: { stock: { increment: qtyToReceive } },
            });
          }
        } else {
          const prod = await tx.product.findUnique({ where: { id: record.productId } });
          if (prod) {
            prev = prod.stock;
            updated = prev + qtyToReceive;
            await tx.product.update({
              where: { id: prod.id },
              data: { stock: updated },
            });
          }
        }

        const newReceivedTotal = record.quantityReceived + qtyToReceive;
        const newStatus = newReceivedTotal >= record.quantityExpected
          ? RestockStatus.RECEIVED
          : RestockStatus.PARTIALLY_RECEIVED;

        await tx.restockRecord.update({
          where: { id: record.id },
          data: {
            quantityReceived: newReceivedTotal,
            status: newStatus,
            receivedAt: new Date(),
          },
        });

        await tx.stockMovement.create({
          data: {
            vendorId: sellerId,
            productId: record.productId,
            variantId: record.variantId,
            sku: record.sku,
            type: StockMovementType.STOCK_RECEIVED,
            quantityDelta: qtyToReceive,
            previousStock: prev,
            updatedStock: updated,
            reason: `Inbound shipment received from ${record.supplierName || "Workshop"}`,
            referenceId: `RESTOCK-${record.id.slice(-6).toUpperCase()}`,
            performedBy,
          },
        });
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to receive restock consignment." };
    }
  }

  /**
   * Cancels a pending restock record.
   */
  public async cancelRestock(sellerId: string, restockId: string): Promise<{ success: boolean; error?: string }> {
    const record = await prisma.restockRecord.findFirst({
      where: { id: restockId, vendorId: sellerId },
    });

    if (!record) return { success: false, error: "Restock record not found." };
    if (record.status === RestockStatus.RECEIVED) {
      return { success: false, error: "Cannot cancel a fully received restock record." };
    }

    await prisma.restockRecord.update({
      where: { id: restockId },
      data: { status: RestockStatus.CANCELLED },
    });

    return { success: true };
  }

  /**
   * Fetches restock records for the seller.
   */
  public async getRestockRecords(sellerId: string): Promise<any[]> {
    const records = await prisma.restockRecord.findMany({
      where: { vendorId: sellerId },
      include: {
        product: { select: { title: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
        variant: { select: { name: true, value: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return records.map((r: any) => ({
      id: r.id,
      productId: r.productId,
      variantId: r.variantId,
      productTitle: r.product.title,
      variantLabel: r.variant ? `${r.variant.name}: ${r.variant.value}` : "Standard Piece",
      imageUrl: r.product.images?.[0]?.url || "/images/placeholder-product.svg",
      sku: r.sku,
      quantityExpected: r.quantityExpected,
      quantityReceived: r.quantityReceived,
      status: r.status,
      supplierName: r.supplierName,
      expectedDeliveryDate: r.expectedDeliveryDate ? r.expectedDeliveryDate.toISOString() : null,
      receivedAt: r.receivedAt ? r.receivedAt.toISOString() : null,
      unitCost: r.unitCostPaise ? r.unitCostPaise / 100 : null,
      note: r.note,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Fetches paginated stock movements audit trail.
   */
  public async getStockMovements(
    sellerId: string,
    options: { productId?: string; type?: StockMovementType; page?: number; limit?: number } = {}
  ): Promise<{ movements: any[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 25));
    const skip = (page - 1) * limit;

    const where: any = { vendorId: sellerId };
    if (options.productId) where.productId = options.productId;
    if (options.type) where.type = options.type;

    const [total, movements] = await prisma.$transaction([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { title: true } },
          variant: { select: { name: true, value: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      movements: movements.map((m: any) => ({
        id: m.id,
        productId: m.productId,
        productTitle: m.product.title,
        variantId: m.variantId,
        variantLabel: m.variant ? `${m.variant.name}: ${m.variant.value}` : "Standard Piece",
        sku: m.sku,
        type: m.type,
        quantityDelta: m.quantityDelta,
        previousStock: m.previousStock,
        updatedStock: m.updatedStock,
        referenceId: m.referenceId,
        reason: m.reason,
        note: m.note,
        performedBy: m.performedBy,
        createdAt: m.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Generates formatted CSV strings for various inventory audit and export reports.
   */
  public async generateReportCsv(sellerId: string, reportType: string): Promise<string> {
    const itemsRes = await this.getInventoryItems(sellerId, { limit: 1000 });
    const items = itemsRes.items;

    switch (reportType) {
      case "LOW_STOCK": {
        const lowItems = items.filter((i) => i.stockStatus === "LOW_STOCK" || i.stockStatus === "OUT_OF_STOCK");
        const rows = [
          ["SKU", "Product Title", "Variant", "Category", "Current Stock", "Threshold", "Reorder Point", "Suggested Restock Qty", "Status"],
          ...lowItems.map((i) => [
            `"${i.sku}"`,
            `"${i.productTitle.replace(/"/g, '""')}"`,
            `"${i.variantLabel}"`,
            `"${i.categoryName}"`,
            i.currentStock,
            i.lowStockThreshold,
            i.reorderPoint,
            Math.max(i.preferredRestockQty, i.reorderPoint - i.currentStock + 5),
            i.stockStatus,
          ]),
        ];
        return rows.map((r) => r.join(",")).join("\n");
      }

      case "VALUATION": {
        const rows = [
          ["SKU", "Product Title", "Variant", "Category", "Current Stock", "Selling Price (INR)", "Cost Price (INR)", "Total Selling Value", "Total Cost Value"],
          ...items.map((i) => {
            const cost = i.costPrice || Math.round(i.sellingPrice * 0.6);
            return [
              `"${i.sku}"`,
              `"${i.productTitle.replace(/"/g, '""')}"`,
              `"${i.variantLabel}"`,
              `"${i.categoryName}"`,
              i.currentStock,
              i.sellingPrice,
              cost,
              i.currentStock * i.sellingPrice,
              i.currentStock * cost,
            ];
          }),
        ];
        return rows.map((r) => r.join(",")).join("\n");
      }

      case "MOVEMENTS": {
        const movementsRes = await this.getStockMovements(sellerId, { limit: 1000 });
        const rows = [
          ["Date & Time", "SKU", "Product Title", "Variant", "Movement Type", "Delta", "Previous Stock", "Updated Stock", "Reference ID", "Reason", "Operator"],
          ...movementsRes.movements.map((m: any) => [
            `"${new Date(m.createdAt).toLocaleString("en-IN")}"`,
            `"${m.sku}"`,
            `"${m.productTitle.replace(/"/g, '""')}"`,
            `"${m.variantLabel}"`,
            m.type,
            m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta,
            m.previousStock,
            m.updatedStock,
            `"${m.referenceId || ""}"`,
            `"${(m.reason || "").replace(/"/g, '""')}"`,
            `"${m.performedBy}"`,
          ]),
        ];
        return rows.map((r) => r.join(",")).join("\n");
      }

      case "CURRENT_STOCK":
      default: {
        const rows = [
          ["SKU", "Product Title", "Variant", "Category", "Selling Price (INR)", "Current Stock", "Reserved", "Available", "Threshold", "Stock Status", "Sales Velocity (30D)", "Days Remaining"],
          ...items.map((i) => [
            `"${i.sku}"`,
            `"${i.productTitle.replace(/"/g, '""')}"`,
            `"${i.variantLabel}"`,
            `"${i.categoryName}"`,
            i.sellingPrice,
            i.currentStock,
            i.reservedStock,
            i.availableStock,
            i.lowStockThreshold,
            i.stockStatus,
            i.salesVelocity30D,
            i.daysOfStockRemaining !== null ? i.daysOfStockRemaining : "N/A",
          ]),
        ];
        return rows.map((r) => r.join(",")).join("\n");
      }
    }
  }
}

export const inventoryService = new InventoryService();
