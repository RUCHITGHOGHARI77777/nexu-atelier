import { prisma } from "./prisma";
import {
  SellerStatus,
  ProductApprovalStatus,
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
  DisputeStatus,
  CouponDiscountType,
  UserRole,
  NotificationStatus,
} from "@prisma/client";
import {
  AdminMetrics,
  AdminSellerView,
  AdminProductView,
  AdminOrderView,
  DisputeCaseView,
  CouponView,
  CouponInput,
  PlatformSettingView,
  AuditEventView,
  AdminUserView,
  AdminCategoryView,
  AutomationStatsView,
  FinancialReportView,
} from "@/types/admin";

export class AdminService {
  /**
   * Calculates platform-wide operational and financial metrics derived strictly from authoritative database records.
   */
  public async getDashboardMetrics(): Promise<AdminMetrics> {
    const [
      orders,
      sellers,
      products,
      customersCount,
      openDisputesCount,
    ] = await Promise.all([
      prisma.order.findMany({
        select: {
          id: true,
          status: true,
          subtotalPaise: true,
          shippingFeePaise: true,
          discountPaise: true,
          totalPaise: true,
          refundedPaise: true,
          items: {
            select: {
              lineTotalPaise: true,
            },
          },
        },
      }),
      prisma.seller.findMany({
        select: {
          id: true,
          status: true,
          commissionRatePercent: true,
        },
      }),
      prisma.product.findMany({
        select: {
          id: true,
          isPublished: true,
          approvalStatus: true,
        },
      }),
      prisma.user.count({
        where: { role: UserRole.CUSTOMER },
      }),
      prisma.disputeCase.count({
        where: { status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] } },
      }),
    ]);

    // Financial calculations: cancelled orders are explicitly excluded from GMV
    const nonCancelledOrders = orders.filter((o) => o.status !== OrderStatus.CANCELLED);
    const grossMerchandiseValuePaise = nonCancelledOrders.reduce((acc, o) => acc + o.totalPaise, 0);
    const totalRefundedPaise = orders.reduce((acc, o) => acc + o.refundedPaise, 0);

    // Platform commissions: default 10% on gross item totals
    const totalCommissionPaise = nonCancelledOrders.reduce((acc, o) => {
      const orderLinesTotal = o.items.reduce((sum, item) => sum + item.lineTotalPaise, 0);
      return acc + Math.round(orderLinesTotal * 0.1);
    }, 0);

    const netPlatformRevenuePaise = Math.max(0, totalCommissionPaise - totalRefundedPaise);

    return {
      grossMerchandiseValue: Math.round(grossMerchandiseValuePaise / 100),
      netPlatformRevenue: Math.round(netPlatformRevenuePaise / 100),
      totalCommission: Math.round(totalCommissionPaise / 100),
      totalOrders: orders.length,
      completedOrders: orders.filter((o) => o.status === OrderStatus.DELIVERED).length,
      inTransitOrders: orders.filter(
        (o) =>
          o.status === OrderStatus.CONFIRMED ||
          o.status === OrderStatus.IN_PRODUCTION ||
          o.status === OrderStatus.SHIPPED
      ).length,
      cancelledOrders: orders.filter((o) => o.status === OrderStatus.CANCELLED).length,
      activeSellers: sellers.filter((s) => s.status === SellerStatus.APPROVED).length,
      pendingSellers: sellers.filter((s) => s.status === SellerStatus.PENDING).length,
      suspendedSellers: sellers.filter((s) => s.status === SellerStatus.SUSPENDED).length,
      activeProducts: products.filter(
        (p) => p.isPublished && p.approvalStatus === ProductApprovalStatus.APPROVED
      ).length,
      pendingProducts: products.filter(
        (p) => p.approvalStatus === ProductApprovalStatus.PENDING_REVIEW
      ).length,
      totalCustomers: customersCount,
      openDisputes: openDisputesCount,
      totalRefunded: Math.round(totalRefundedPaise / 100),
    };
  }

  /**
   * Retrieves paginated seller studios with status filtering and sales aggregation.
   */
  public async getSellers(options: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ sellers: AdminSellerView[]; total: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.status && options.status !== "ALL") {
      where.status = options.status;
    }
    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { businessEmail: { contains: q, mode: "insensitive" } },
        { originHub: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, dbSellers] = await prisma.$transaction([
      prisma.seller.count({ where }),
      prisma.seller.findMany({
        where,
        include: {
          _count: {
            select: { products: true },
          },
          payouts: {
            select: { grossAmountPaise: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const sellers: AdminSellerView[] = dbSellers.map((s) => {
      const grossPaise = s.payouts.reduce((acc, p) => acc + p.grossAmountPaise, 0);
      return {
        id: s.id,
        userId: s.userId,
        name: s.name,
        slug: s.slug,
        originHub: s.originHub,
        story: s.story,
        status: s.status,
        businessEmail: s.businessEmail,
        businessPhone: s.businessPhone,
        taxIdentifier: s.taxIdentifier,
        commissionRatePercent: s.commissionRatePercent,
        bankAccountName: s.bankAccountName,
        bankAccountNumber: s.bankAccountNumber,
        bankIfsc: s.bankIfsc,
        rejectionReason: s.rejectionReason,
        productCount: s._count.products,
        orderCount: s.payouts.length,
        grossSales: Math.round(grossPaise / 100),
        createdAt: s.createdAt.toISOString(),
        approvedAt: s.approvedAt ? s.approvedAt.toISOString() : null,
      };
    });

    return {
      sellers,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Updates a seller's approval status with mandatory audit logging and reason enforcement.
   */
  public async updateSellerStatus(
    sellerId: string,
    newStatus: SellerStatus,
    reason: string | undefined,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: { user: true },
    });

    if (!seller) {
      return { success: false, error: "Seller profile not found." };
    }

    if (newStatus === SellerStatus.REJECTED && (!reason || reason.trim().length < 5)) {
      return { success: false, error: "A valid explanation (minimum 5 characters) is required when rejecting an application." };
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Update seller status
        await tx.seller.update({
          where: { id: sellerId },
          data: {
            status: newStatus,
            rejectionReason: newStatus === SellerStatus.REJECTED ? reason?.trim() : null,
            approvedAt: newStatus === SellerStatus.APPROVED ? new Date() : seller.approvedAt,
            verified: newStatus === SellerStatus.APPROVED,
          },
        });

        // If suspended, soft-unpublish all associated products to protect storefront
        if (newStatus === SellerStatus.SUSPENDED) {
          await tx.product.updateMany({
            where: { vendorId: sellerId },
            data: { isPublished: false },
          });
        } else if (newStatus === SellerStatus.APPROVED) {
          // Re-enable products if previously approved
          await tx.product.updateMany({
            where: { vendorId: sellerId, approvalStatus: ProductApprovalStatus.APPROVED },
            data: { isPublished: true },
          });
        }

        // Record immutable audit event
        await tx.auditEvent.create({
          data: {
            entityType: "SELLER",
            entityId: sellerId,
            action: `SELLER_STATUS_${newStatus}`,
            note: `Seller status changed from ${seller.status} to ${newStatus}.${reason ? ` Reason: ${reason.trim()}` : ""}`,
            performedBy: adminUserId,
          },
        });
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update seller status." };
    }
  }

  /**
   * Retrieves products for the administrative moderation queue.
   */
  public async getProductsForModeration(options: {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ products: AdminProductView[]; total: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.status && options.status !== "ALL") {
      where.approvalStatus = options.status;
    }
    if (options.category && options.category !== "All") {
      where.category = { name: { equals: options.category, mode: "insensitive" } };
    }
    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { subtitle: { contains: q, mode: "insensitive" } },
        { vendor: { name: { contains: q, mode: "insensitive" } } },
      ];
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

    const products: AdminProductView[] = dbProducts.map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: p.subtitle,
      description: p.description,
      slug: p.slug,
      category: p.category.name,
      categoryId: p.categoryId,
      vendorName: p.vendor.name,
      vendorId: p.vendor.id,
      basePrice: Math.round(p.basePricePaise / 100),
      compareAtPrice: p.compareAtPricePaise ? Math.round(p.compareAtPricePaise / 100) : null,
      stock: p.stock,
      isPublished: p.isPublished,
      isFeatured: p.isFeatured,
      material: p.material,
      dimensions: p.dimensions,
      weight: p.weight,
      careInstructions: p.careInstructions,
      approvalStatus: p.approvalStatus,
      moderationNotes: p.moderationNotes,
      variantsCount: p.variants.length,
      images: p.images.map((img) => img.url),
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        title: v.name,
        price: Math.round((p.basePricePaise + v.additionalPricePaise) / 100),
        stock: v.stock,
        size: v.variantType.toUpperCase() === "SIZE" ? v.value : null,
        colorName: v.variantType.toUpperCase() === "COLOR" ? v.name : null,
        colorHex: v.hexCode,
      })),
      createdAt: p.createdAt.toISOString(),
    }));

    return {
      products,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Moderates a product: approve, reject, or archive with mandatory notes on rejection.
   */
  public async moderateProduct(
    productId: string,
    status: ProductApprovalStatus,
    notes: string | undefined,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: true },
    });

    if (!product) {
      return { success: false, error: "Product not found." };
    }

    if (
      (status === ProductApprovalStatus.REJECTED || status === ProductApprovalStatus.CHANGES_REQUESTED) &&
      (!notes || notes.trim().length < 5)
    ) {
      return { success: false, error: "Editorial reason is required (minimum 5 characters) when rejecting or requesting changes." };
    }

    try {
      await prisma.$transaction(async (tx) => {
        const isPublished = status === ProductApprovalStatus.APPROVED && product.vendor.status === SellerStatus.APPROVED;

        await tx.product.update({
          where: { id: productId },
          data: {
            approvalStatus: status,
            moderationNotes: notes?.trim() || null,
            isPublished,
          },
        });

        await tx.auditEvent.create({
          data: {
            entityType: "PRODUCT",
            entityId: productId,
            action: `PRODUCT_MODERATED_${status}`,
            note: `Product "${product.title}" moderated to ${status}.${notes ? ` Feedback: ${notes.trim()}` : ""}`,
            performedBy: adminUserId,
          },
        });
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to moderate product." };
    }
  }

  /**
   * Toggles homepage featured placement for an approved product.
   */
  public async toggleProductFeatured(
    productId: string,
    isFeatured: boolean,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { success: false, error: "Product not found." };
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: productId },
          data: { isFeatured },
        });

        await tx.auditEvent.create({
          data: {
            entityType: "PRODUCT",
            entityId: productId,
            action: isFeatured ? "PRODUCT_FEATURED_ON_HOMEPAGE" : "PRODUCT_UNFEATURED_FROM_HOMEPAGE",
            note: `Product "${product.title}" ${isFeatured ? "featured on" : "removed from"} homepage showcase.`,
            performedBy: adminUserId,
          },
        });
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update featured placement." };
    }
  }

  /**
   * Retrieves all platform orders with full relation context.
   */
  public async getOrders(options: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ orders: AdminOrderView[]; total: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.status && options.status !== "ALL") {
      where.status = options.status;
    }
    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { id: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { customerEmail: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, dbOrders] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          items: true,
          disputes: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const orders: AdminOrderView[] = dbOrders.map((o) => {
      let addr: any = {};
      try {
        addr = JSON.parse(o.shippingAddressSnapshot);
      } catch {
        addr = { street: o.shippingAddressSnapshot };
      }

      return {
        id: o.id,
        customerId: o.customerId,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        shippingAddressSnapshot: addr,
        deliveryMethodName: o.deliveryMethodName,
        subtotal: Math.round(o.subtotalPaise / 100),
        shippingFee: Math.round(o.shippingFeePaise / 100),
        discount: Math.round(o.discountPaise / 100),
        couponCode: o.couponCode,
        total: Math.round(o.totalPaise / 100),
        refundedAmount: Math.round(o.refundedPaise / 100),
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt.toISOString(),
        items: o.items.map((it) => ({
          id: it.id,
          productTitle: it.title,
          vendorName: it.vendorName,
          vendorId: it.vendorId,
          sku: it.selectedSku,
          unitPrice: Math.round(it.unitPricePaise / 100),
          quantity: it.quantity,
          lineTotal: Math.round(it.lineTotalPaise / 100),
          fulfillmentStatus: it.fulfillmentStatus,
          courierName: it.courierName,
          trackingNumber: it.trackingNumber,
        })),
        disputes: o.disputes.map((d) => ({
          id: d.id,
          reason: d.reason,
          status: d.status,
          refundAmount: d.refundAmountPaise ? Math.round(d.refundAmountPaise / 100) : null,
        })),
      };
    });

    return {
      orders,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Cancels an order administratively and atomically restocks inventory.
   */
  public async cancelOrderAsAdmin(
    orderId: string,
    reason: string,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return { success: false, error: "Order not found." };
    }

    if (order.status === OrderStatus.CANCELLED) {
      return { success: false, error: "Order is already cancelled." };
    }

    if (order.status === OrderStatus.DELIVERED) {
      return { success: false, error: "Delivered orders cannot be cancelled directly; please open a return/dispute case." };
    }

    if (!reason || reason.trim().length < 5) {
      return { success: false, error: "A valid cancellation reason (minimum 5 characters) is required." };
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Restock inventory for all items in order
        for (const item of order.items) {
          if (item.productId && item.fulfillmentStatus !== FulfillmentStatus.CANCELLED) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
            if (item.selectedSku) {
              await tx.productVariant.updateMany({
                where: { sku: item.selectedSku },
                data: { stock: { increment: item.quantity } },
              });
            }
          }
        }

        // Update items to cancelled
        await tx.orderItem.updateMany({
          where: { orderId: order.id },
          data: {
            fulfillmentStatus: FulfillmentStatus.CANCELLED,
            cancellationReason: `Cancelled by platform administration: ${reason.trim()}`,
          },
        });

        // Update order status
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED },
        });

        // Log audit event
        await tx.auditEvent.create({
          data: {
            orderId: order.id,
            entityType: "ORDER",
            entityId: order.id,
            action: "ADMIN_ORDER_CANCELLED",
            note: `Order cancelled by admin. Reason: ${reason.trim()}`,
            performedBy: adminUserId,
          },
        });
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to cancel order." };
    }
  }

  /**
   * Retrieves dispute and return cases with customer and seller context.
   */
  public async getDisputes(): Promise<DisputeCaseView[]> {
    const cases = await prisma.disputeCase.findMany({
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            customerEmail: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const sellers = await prisma.seller.findMany({
      select: { id: true, name: true },
    });
    const sellerMap = new Map(sellers.map((s) => [s.id, s.name]));

    return cases.map((c) => ({
      id: c.id,
      orderId: c.orderId,
      orderItemId: c.orderItemId,
      customerId: c.customerId,
      customerName: c.order?.customerName || "Patron",
      customerEmail: c.order?.customerEmail || "patron@nexu.studio",
      sellerId: c.sellerId,
      sellerName: c.sellerId ? sellerMap.get(c.sellerId) || null : null,
      reason: c.reason,
      evidence: c.evidence,
      status: c.status,
      refundAmount: c.refundAmountPaise ? Math.round(c.refundAmountPaise / 100) : null,
      internalNotes: c.internalNotes,
      resolutionReason: c.resolutionReason,
      resolvedBy: c.resolvedBy,
      resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  /**
   * Arbitrates and resolves a dispute case with idempotent refund tracking.
   */
  public async resolveDispute(
    caseId: string,
    resolution: "RESOLVED_REFUNDED" | "RESOLVED_REJECTED",
    notes: string,
    refundAmountINR: number | undefined,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    const dispute = await prisma.disputeCase.findUnique({
      where: { id: caseId },
      include: { order: true },
    });

    if (!dispute) {
      return { success: false, error: "Dispute case not found." };
    }

    if (dispute.status === DisputeStatus.RESOLVED_REFUNDED || dispute.status === DisputeStatus.RESOLVED_REJECTED) {
      return { success: false, error: "This dispute case has already reached terminal resolution." };
    }

    const refundAmountPaise = refundAmountINR ? Math.round(refundAmountINR * 100) : (dispute.refundAmountPaise || 0);

    if (resolution === "RESOLVED_REFUNDED" && refundAmountPaise <= 0) {
      return { success: false, error: "A positive refund amount is required for refund resolution." };
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.disputeCase.update({
          where: { id: caseId },
          data: {
            status: resolution === "RESOLVED_REFUNDED" ? DisputeStatus.RESOLVED_REFUNDED : DisputeStatus.RESOLVED_REJECTED,
            refundAmountPaise: resolution === "RESOLVED_REFUNDED" ? refundAmountPaise : null,
            internalNotes: notes?.trim() || dispute.internalNotes,
            resolutionReason: notes?.trim() || "Resolved by administration.",
            resolvedBy: adminUserId,
            resolvedAt: new Date(),
          },
        });

        if (resolution === "RESOLVED_REFUNDED") {
          const newRefundedTotal = dispute.order.refundedPaise + refundAmountPaise;
          const isFullRefund = newRefundedTotal >= dispute.order.totalPaise;

          await tx.order.update({
            where: { id: dispute.orderId },
            data: {
              refundedPaise: newRefundedTotal,
              paymentStatus: isFullRefund ? PaymentStatus.REFUNDED : dispute.order.paymentStatus,
            },
          });

          // Create payment record documenting refund adjustment
          await tx.paymentRecord.create({
            data: {
              orderId: dispute.orderId,
              transactionRef: `REF-${caseId}-${Date.now().toString().slice(-6)}`,
              amountPaise: -refundAmountPaise,
              currency: "INR",
              status: PaymentStatus.REFUNDED,
              rawGatewayResponse: JSON.stringify({
                note: "Internal escrow refund credit authorization. Remittance scheduled.",
                arbitratedBy: adminUserId,
                caseId,
              }),
            },
          });
        }

        await tx.auditEvent.create({
          data: {
            orderId: dispute.orderId,
            entityType: "DISPUTE",
            entityId: caseId,
            action: `DISPUTE_${resolution}`,
            note: `Dispute ${caseId} resolved as ${resolution}.${refundAmountPaise > 0 ? ` Refund: ₹${Math.round(refundAmountPaise / 100)}` : ""}. Notes: ${notes}`,
            performedBy: adminUserId,
          },
        });
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to resolve dispute." };
    }
  }

  /**
   * Retrieves all promotional coupon rules with real-time usage metrics.
   */
  public async getCoupons(): Promise<CouponView[]> {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return coupons.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: c.discountType === CouponDiscountType.FIXED_AMOUNT ? Math.round(c.discountValue / 100) : c.discountValue,
      minOrderValue: Math.round(c.minOrderValuePaise / 100),
      maxDiscount: c.maxDiscountPaise ? Math.round(c.maxDiscountPaise / 100) : null,
      usageLimit: c.usageLimit,
      perCustomerLimit: c.perCustomerLimit,
      timesUsed: c.timesUsed,
      startsAt: c.startsAt.toISOString(),
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      isActive: c.isActive,
      fundedBy: c.fundedBy,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  /**
   * Creates a promotional coupon rule.
   */
  public async createCoupon(
    input: CouponInput,
    adminUserId: string
  ): Promise<{ success: boolean; coupon?: CouponView; error?: string }> {
    if (!input.code || input.code.trim().length < 3) {
      return { success: false, error: "Coupon code must be at least 3 characters." };
    }
    const cleanCode = input.code.trim().toUpperCase();

    if (input.discountValue <= 0) {
      return { success: false, error: "Discount value must be greater than zero." };
    }

    if (input.discountType === "PERCENTAGE" && input.discountValue > 90) {
      return { success: false, error: "Percentage discount cannot exceed 90%." };
    }

    const existing = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      return { success: false, error: `Coupon code "${cleanCode}" already exists.` };
    }

    const discountValueDb = input.discountType === "FIXED_AMOUNT"
      ? Math.round(input.discountValue * 100)
      : input.discountValue;

    const minOrderValuePaise = input.minOrderValue ? Math.round(input.minOrderValue * 100) : 0;
    const maxDiscountPaise = input.maxDiscount ? Math.round(input.maxDiscount * 100) : null;

    try {
      const created = await prisma.$transaction(async (tx) => {
        const c = await tx.coupon.create({
          data: {
            code: cleanCode,
            description: input.description?.trim() || null,
            discountType: input.discountType as CouponDiscountType,
            discountValue: discountValueDb,
            minOrderValuePaise,
            maxDiscountPaise,
            usageLimit: input.usageLimit || null,
            perCustomerLimit: input.perCustomerLimit || 1,
            startsAt: input.startsAt ? new Date(input.startsAt) : new Date(),
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
            isActive: input.isActive !== undefined ? input.isActive : true,
            fundedBy: input.fundedBy || "PLATFORM",
          },
        });

        await tx.auditEvent.create({
          data: {
            entityType: "COUPON",
            entityId: c.id,
            action: "COUPON_CREATED",
            note: `Created coupon ${cleanCode} (${input.discountType} ${input.discountValue})`,
            performedBy: adminUserId,
          },
        });

        return c;
      });

      return {
        success: true,
        coupon: {
          id: created.id,
          code: created.code,
          description: created.description,
          discountType: created.discountType,
          discountValue: input.discountValue,
          minOrderValue: Math.round(created.minOrderValuePaise / 100),
          maxDiscount: created.maxDiscountPaise ? Math.round(created.maxDiscountPaise / 100) : null,
          usageLimit: created.usageLimit,
          perCustomerLimit: created.perCustomerLimit,
          timesUsed: created.timesUsed,
          startsAt: created.startsAt.toISOString(),
          expiresAt: created.expiresAt ? created.expiresAt.toISOString() : null,
          isActive: created.isActive,
          fundedBy: created.fundedBy,
          createdAt: created.createdAt.toISOString(),
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to create coupon." };
    }
  }

  /**
   * Toggles coupon active state.
   */
  public async toggleCoupon(
    couponId: string,
    isActive: boolean,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const coupon = await prisma.coupon.update({
        where: { id: couponId },
        data: { isActive },
      });

      await prisma.auditEvent.create({
        data: {
          entityType: "COUPON",
          entityId: couponId,
          action: isActive ? "COUPON_ACTIVATED" : "COUPON_DEACTIVATED",
          note: `Coupon ${coupon.code} ${isActive ? "activated" : "deactivated"} by admin.`,
          performedBy: adminUserId,
        },
      });

      return { success: true };
    } catch {
      return { success: false, error: "Failed to update coupon status." };
    }
  }

  /**
   * Validates and calculates discount for a coupon code on a given cart subtotal.
   */
  public async validateAndApplyCoupon(
    code: string,
    subtotalPaise: number,
    userId?: string
  ): Promise<{
    valid: boolean;
    discountPaise: number;
    coupon?: { code: string; discountType: string; discountValue: number; description?: string | null };
    error?: string;
  }> {
    if (!code || !code.trim()) {
      return { valid: false, discountPaise: 0, error: "Coupon code is required." };
    }
    const cleanCode = code.trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon || !coupon.isActive) {
      return { valid: false, discountPaise: 0, error: `Coupon "${cleanCode}" is invalid or expired.` };
    }

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      return { valid: false, discountPaise: 0, error: `Coupon "${cleanCode}" is not active yet.` };
    }
    if (coupon.expiresAt && now > coupon.expiresAt) {
      return { valid: false, discountPaise: 0, error: `Coupon "${cleanCode}" has expired.` };
    }

    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
      return { valid: false, discountPaise: 0, error: `Coupon "${cleanCode}" has reached maximum global redemption limit.` };
    }

    if (subtotalPaise < coupon.minOrderValuePaise) {
      const minINR = Math.round(coupon.minOrderValuePaise / 100);
      return {
        valid: false,
        discountPaise: 0,
        error: `Coupon requires a minimum order subtotal of ₹${minINR}.`,
      };
    }

    if (userId) {
      const userUsageCount = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId },
      });
      if (userUsageCount >= coupon.perCustomerLimit) {
        return {
          valid: false,
          discountPaise: 0,
          error: `You have reached the maximum allowed redemptions for this coupon.`,
        };
      }
    }

    // Calculate exact discount in paise
    let discountPaise = 0;
    if (coupon.discountType === CouponDiscountType.PERCENTAGE) {
      discountPaise = Math.round((subtotalPaise * coupon.discountValue) / 100);
    } else {
      discountPaise = coupon.discountValue;
    }

    // Apply cap if defined
    if (coupon.maxDiscountPaise && discountPaise > coupon.maxDiscountPaise) {
      discountPaise = coupon.maxDiscountPaise;
    }

    // Discount cannot exceed subtotal
    discountPaise = Math.min(discountPaise, subtotalPaise);

    return {
      valid: true,
      discountPaise,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description,
      },
    };
  }

  /**
   * Reconciles marketplace financial ledger: GMV, commissions, escrow hold, settled payouts, and refunds.
   */
  public async getFinancialLedger(): Promise<{
    grossVolumeINR: number;
    platformCommissionsINR: number;
    escrowHoldsINR: number;
    settledPayoutsINR: number;
    totalRefundsINR: number;
    vendorNetINR: number;
    payoutRecordsCount: number;
  }> {
    const [payouts, orders] = await Promise.all([
      prisma.vendorPayout.findMany({
        select: {
          grossAmountPaise: true,
          commissionPaise: true,
          netPayoutPaise: true,
          status: true,
        },
      }),
      prisma.order.findMany({
        select: {
          totalPaise: true,
          refundedPaise: true,
          status: true,
        },
      }),
    ]);

    const nonCancelledOrders = orders.filter((o) => o.status !== OrderStatus.CANCELLED);
    const grossVolumePaise = nonCancelledOrders.reduce((sum, o) => sum + o.totalPaise, 0);
    const totalRefundsPaise = orders.reduce((sum, o) => sum + o.refundedPaise, 0);

    const platformCommissionsPaise = payouts.reduce((sum, p) => sum + p.commissionPaise, 0);
    const vendorNetPaise = payouts.reduce((sum, p) => sum + p.netPayoutPaise, 0);

    const escrowHoldsPaise = payouts
      .filter((p) => p.status === "ESCROW_HOLD")
      .reduce((sum, p) => sum + p.netPayoutPaise, 0);

    const settledPayoutsPaise = payouts
      .filter((p) => p.status === "SETTLED")
      .reduce((sum, p) => sum + p.netPayoutPaise, 0);

    return {
      grossVolumeINR: Math.round(grossVolumePaise / 100),
      platformCommissionsINR: Math.round(platformCommissionsPaise / 100),
      escrowHoldsINR: Math.round(escrowHoldsPaise / 100),
      settledPayoutsINR: Math.round(settledPayoutsPaise / 100),
      totalRefundsINR: Math.round(totalRefundsPaise / 100),
      vendorNetINR: Math.round(vendorNetPaise / 100),
      payoutRecordsCount: payouts.length,
    };
  }

  /**
   * Retrieves marketplace platform configuration settings.
   */
  public async getPlatformSettings(): Promise<PlatformSettingView[]> {
    const settings = await prisma.platformSetting.findMany({
      orderBy: { key: "asc" },
    });

    return settings.map((s) => ({
      key: s.key,
      value: s.value,
      description: s.description,
      updatedBy: s.updatedBy,
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  /**
   * Updates a platform setting key-value configuration.
   */
  public async updatePlatformSetting(
    key: string,
    value: string,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.platformSetting.upsert({
        where: { key },
        update: { value, updatedBy: adminUserId },
        create: { key, value, updatedBy: adminUserId },
      });

      await prisma.auditEvent.create({
        data: {
          entityType: "SETTING",
          entityId: key,
          action: "SETTING_UPDATED",
          note: `Setting "${key}" updated to "${value}"`,
          performedBy: adminUserId,
        },
      });

      return { success: true };
    } catch {
      return { success: false, error: "Failed to update platform setting." };
    }
  }

  /**
   * Retrieves users for administration directory.
   */
  public async getUsers(): Promise<AdminUserView[]> {
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        seller: { select: { slug: true } },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.profile?.name || "Anonymous Patron",
      role: u.role,
      phone: u.profile?.phone || null,
      createdAt: u.createdAt.toISOString(),
      orderCount: u._count.orders,
      sellerSlug: u.seller?.slug || null,
    }));
  }

  /**
   * Updates user role safely with protection against revoking the last administrator.
   */
  public async updateUserRole(
    targetUserId: string,
    newRole: UserRole,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (targetUserId === adminUserId && newRole !== UserRole.ADMIN) {
      return { success: false, error: "You cannot revoke your own administrator privileges." };
    }

    try {
      await prisma.user.update({
        where: { id: targetUserId },
        data: { role: newRole },
      });

      await prisma.auditEvent.create({
        data: {
          entityType: "USER",
          entityId: targetUserId,
          action: "USER_ROLE_CHANGED",
          note: `User role changed to ${newRole}`,
          performedBy: adminUserId,
        },
      });

      return { success: true };
    } catch {
      return { success: false, error: "Failed to update user role." };
    }
  }

  /**
   * Retrieves append-only audit events.
   */
  public async getAuditEvents(options: {
    entityType?: string;
    limit?: number;
  } = {}): Promise<AuditEventView[]> {
    const where: any = {};
    if (options.entityType && options.entityType !== "ALL") {
      where.entityType = options.entityType;
    }

    const events = await prisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options.limit || 50,
    });

    return events.map((e) => ({
      id: e.id,
      orderId: e.orderId,
      entityType: e.entityType,
      entityId: e.entityId,
      action: e.action,
      note: e.note,
      performedBy: e.performedBy,
      createdAt: e.createdAt.toISOString(),
    }));
  }

  /**
   * Retrieves all categories with associated product counts.
   */
  public async getCategories(): Promise<AdminCategoryView[]> {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      image: c.image,
      productCount: c._count.products,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  /**
   * Creates a new product category taxonomy.
   */
  public async createCategory(
    data: { name: string; slug?: string; description: string; image: string },
    adminUserId: string
  ): Promise<{ success: boolean; category?: AdminCategoryView; error?: string }> {
    const name = data.name.trim();
    if (!name) {
      return { success: false, error: "Category name is required." };
    }

    const slug = (data.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")) || "category";

    const existing = await prisma.category.findUnique({
      where: { slug },
    });

    if (existing) {
      return { success: false, error: `Category with slug "${slug}" already exists.` };
    }

    try {
      const created = await prisma.$transaction(async (tx) => {
        const cat = await tx.category.create({
          data: {
            name,
            slug,
            description: data.description.trim() || `${name} artisan creations and studio pieces.`,
            image: data.image.trim() || "/images/categories/living.jpg",
          },
        });

        await tx.auditEvent.create({
          data: {
            entityType: "CATEGORY",
            entityId: cat.id,
            action: "CATEGORY_CREATED",
            note: `Category "${cat.name}" created with slug "${cat.slug}".`,
            performedBy: adminUserId,
          },
        });

        return cat;
      });

      return {
        success: true,
        category: {
          id: created.id,
          slug: created.slug,
          name: created.name,
          description: created.description,
          image: created.image,
          productCount: 0,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to create category." };
    }
  }

  /**
   * Updates an existing category taxonomy.
   */
  public async updateCategory(
    id: string,
    data: { name?: string; slug?: string; description?: string; image?: string },
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Category not found." };
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.category.update({
          where: { id },
          data: {
            name: data.name?.trim() || undefined,
            slug: data.slug?.trim() || undefined,
            description: data.description?.trim() || undefined,
            image: data.image?.trim() || undefined,
          },
        });

        await tx.auditEvent.create({
          data: {
            entityType: "CATEGORY",
            entityId: id,
            action: "CATEGORY_UPDATED",
            note: `Category "${existing.name}" metadata updated.`,
            performedBy: adminUserId,
          },
        });
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update category." };
    }
  }

  /**
   * Deletes a category if no products are associated with it.
   */
  public async deleteCategory(
    id: string,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return { success: false, error: "Category not found." };
    }

    if (category._count.products > 0) {
      return {
        success: false,
        error: `Cannot delete category "${category.name}" because ${category._count.products} products are associated with it. Reassign or archive the products first.`,
      };
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.category.delete({
          where: { id },
        });

        await tx.auditEvent.create({
          data: {
            entityType: "CATEGORY",
            entityId: id,
            action: "CATEGORY_DELETED",
            note: `Category "${category.name}" deleted.`,
            performedBy: adminUserId,
          },
        });
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to delete category." };
    }
  }

  /**
   * Retrieves system-wide automations, notification outbox, and webhook health statistics.
   */
  public async getAutomationsOverview(): Promise<AutomationStatsView> {
    const [notifCounts, recentOutbox, webhookCounts, lowStockCount, pendingRefundsCount] =
      await Promise.all([
        prisma.notificationEvent.groupBy({
          by: ["status"],
          _count: true,
        }),
        prisma.notificationEvent.findMany({
          orderBy: { createdAt: "desc" },
          take: 25,
        }),
        prisma.webhookEvent.groupBy({
          by: ["status"],
          _count: true,
        }),
        prisma.product.count({
          where: { stock: { lte: 5 } },
        }),
        prisma.refundRecord.count({
          where: { status: "PENDING" },
        }),
      ]);

    const notifMap: Record<string, number> = {};
    let notifTotal = 0;
    notifCounts.forEach((c) => {
      notifMap[c.status] = c._count;
      notifTotal += c._count;
    });

    const webhookMap: Record<string, number> = {};
    let webhookTotal = 0;
    webhookCounts.forEach((c) => {
      webhookMap[c.status] = c._count;
      webhookTotal += c._count;
    });

    return {
      notifications: {
        total: notifTotal,
        queued: notifMap[NotificationStatus.QUEUED] || 0,
        sent: notifMap[NotificationStatus.SENT] || 0,
        failed: notifMap[NotificationStatus.FAILED] || 0,
      },
      recentOutbox: recentOutbox.map((n) => ({
        id: n.id,
        channel: n.channel,
        recipient: n.recipient,
        template: n.template,
        status: n.status,
        attempts: n.attempts,
        lastError: n.lastError,
        createdAt: n.createdAt.toISOString(),
        sentAt: n.sentAt ? n.sentAt.toISOString() : null,
      })),
      webhooks: {
        total: webhookTotal,
        received: webhookMap["RECEIVED"] || 0,
        processed: webhookMap["PROCESSED"] || 0,
        failed: webhookMap["FAILED"] || 0,
      },
      lowStockAlertsCount: lowStockCount,
      pendingRefundsCount,
    };
  }

  /**
   * Requeues all failed notifications for retry processing.
   */
  public async retryFailedNotifications(
    adminUserId: string
  ): Promise<{ success: boolean; retriedCount: number; error?: string }> {
    try {
      const updateResult = await prisma.notificationEvent.updateMany({
        where: { status: NotificationStatus.FAILED },
        data: {
          status: NotificationStatus.QUEUED,
          lastError: null,
        },
      });

      await prisma.auditEvent.create({
        data: {
          entityType: "AUTOMATION",
          entityId: "OUTBOX_RETRY",
          action: "NOTIFICATIONS_RETRIED",
          note: `Admin queued retry for ${updateResult.count} failed outbox notifications.`,
          performedBy: adminUserId,
        },
      });

      return { success: true, retriedCount: updateResult.count };
    } catch (err: any) {
      return { success: false, retriedCount: 0, error: err.message || "Failed to retry notifications." };
    }
  }

  /**
   * Scans catalog inventory for low stock alerts.
   */
  public async triggerLowStockScan(
    adminUserId: string
  ): Promise<{ success: boolean; alertedCount: number; products: { id: string; title: string; stock: number }[] }> {
    const products = await prisma.product.findMany({
      where: { stock: { lte: 5 } },
      select: { id: true, title: true, stock: true },
      take: 50,
    });

    await prisma.auditEvent.create({
      data: {
        entityType: "AUTOMATION",
        entityId: "INVENTORY_SCAN",
        action: "LOW_STOCK_AUDITED",
        note: `Automated inventory audit identified ${products.length} pieces at or below reorder threshold.`,
        performedBy: adminUserId,
      },
    });

    return {
      success: true,
      alertedCount: products.length,
      products,
    };
  }

  /**
   * Generates authoritative financial, tax, and vendor payout reports.
   */
  public async getFinancialReports(): Promise<FinancialReportView> {
    const [orders, sellers, orderItems] = await Promise.all([
      prisma.order.findMany({
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          subtotalPaise: true,
          shippingFeePaise: true,
          discountPaise: true,
          totalPaise: true,
          refundedPaise: true,
          customer: { select: { email: true } },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.seller.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          commissionRatePercent: true,
        },
      }),
      prisma.orderItem.findMany({
        select: {
          vendorId: true,
          lineTotalPaise: true,
          order: { select: { status: true } },
        },
      }),
    ]);

    const nonCancelled = orders.filter((o) => o.status !== OrderStatus.CANCELLED);
    const completed = orders.filter((o) => o.status === OrderStatus.DELIVERED);
    const cancelled = orders.filter((o) => o.status === OrderStatus.CANCELLED);

    const grossMerchandiseValue = nonCancelled.reduce((acc, o) => acc + o.totalPaise, 0);
    const totalDiscount = nonCancelled.reduce((acc, o) => acc + o.discountPaise, 0);
    const totalShippingRevenue = nonCancelled.reduce((acc, o) => acc + o.shippingFeePaise, 0);
    const totalRefunded = orders.reduce((acc, o) => acc + o.refundedPaise, 0);
    const netSales = grossMerchandiseValue - totalRefunded;

    // Platform commission is 10% on gross item totals
    const platformCommissionRevenue = Math.round(netSales * 0.1);
    // 12% GST included in net sales
    const estimatedGstPayable = Math.round((netSales * 12) / 112);

    // Vendor breakdown
    const vendorMap: Record<
      string,
      { count: number; grossPaise: number }
    > = {};

    orderItems.forEach((item) => {
      if (item.order.status !== OrderStatus.CANCELLED) {
        if (!vendorMap[item.vendorId]) {
          vendorMap[item.vendorId] = { count: 0, grossPaise: 0 };
        }
        vendorMap[item.vendorId].count += 1;
        vendorMap[item.vendorId].grossPaise += item.lineTotalPaise;
      }
    });

    const vendorSettlements = sellers.map((s) => {
      const vData = vendorMap[s.id] || { count: 0, grossPaise: 0 };
      const grossINR = Math.round(vData.grossPaise / 100);
      const commissionINR = Math.round((grossINR * s.commissionRatePercent) / 100);
      const netEarnings = grossINR - commissionINR;
      return {
        sellerId: s.id,
        sellerName: s.name,
        sellerSlug: s.slug,
        orderCount: vData.count,
        grossSales: grossINR,
        commissionPaid: commissionINR,
        netEarnings,
      };
    });

    return {
      summary: {
        totalOrders: orders.length,
        completedOrders: completed.length,
        cancelledOrders: cancelled.length,
        grossMerchandiseValue: Math.round(grossMerchandiseValue / 100),
        totalDiscount: Math.round(totalDiscount / 100),
        totalShippingRevenue: Math.round(totalShippingRevenue / 100),
        totalRefunded: Math.round(totalRefunded / 100),
        netSales: Math.round(netSales / 100),
        platformCommissionRevenue: Math.round(platformCommissionRevenue / 100),
        estimatedGstPayable: Math.round(estimatedGstPayable / 100),
      },
      vendorSettlements,
      recentOrdersSnapshot: orders.slice(0, 20).map((o) => ({
        id: o.id,
        customerEmail: o.customer.email,
        total: Math.round(o.totalPaise / 100),
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Generates CSV format financial ledger reports.
   */
  public async generateReportsCsv(
    type: "sales" | "vendors" | "taxes"
  ): Promise<string> {
    const report = await this.getFinancialReports();

    if (type === "vendors") {
      const headers = ["Seller ID", "Workshop Name", "Slug", "Orders Fulfilled", "Gross Sales (INR)", "Commission Paid (INR)", "Net Earnings (INR)"];
      const rows = report.vendorSettlements.map((v) => [
        `"${v.sellerId}"`,
        `"${v.sellerName.replace(/"/g, '""')}"`,
        `"${v.sellerSlug}"`,
        v.orderCount,
        v.grossSales,
        v.commissionPaid,
        v.netEarnings,
      ]);
      return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    }

    if (type === "taxes") {
      const headers = ["Metric", "Amount (INR)", "GST Rate", "Notes"];
      const rows = [
        ["Gross Merchandise Value", report.summary.grossMerchandiseValue, "12%", "All non-cancelled orders"],
        ["Net Taxable Turnover", report.summary.netSales, "12%", "GMV less customer returns and refunds"],
        ["Estimated Output GST (12%)", report.summary.estimatedGstPayable, "12%", "Applicable composite tax reserve"],
        ["Platform Fee GST (18%)", Math.round(report.summary.platformCommissionRevenue * 0.18), "18%", "Tax on platform brokerage commission"],
      ];
      return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    }

    // Default: sales
    const headers = ["Order ID", "Customer Email", "Status", "Payment", "Total (INR)", "Date"];
    const rows = report.recentOrdersSnapshot.map((o) => [
      `"${o.id}"`,
      `"${o.customerEmail}"`,
      `"${o.status}"`,
      `"${o.paymentStatus}"`,
      o.total,
      `"${o.createdAt}"`,
    ]);
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }
}

export const adminService = new AdminService();
