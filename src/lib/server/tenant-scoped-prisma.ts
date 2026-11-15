/**
 * NEXU PLATFORM — Scoped Multi-Tenant Prisma Engine
 * 
 * Enforces:
 * "Scoped Prisma Middleware: Every database read/write on StoreProduct, StoreOrder, StoreCustomer, StoreInvoice, and StoreReturn appends WHERE storeId = verifiedSessionStoreId."
 */

import { prisma } from "./prisma";
import { assertZeroClientTrust, AntiIdorSecurityViolationError } from "./zero-client-trust";

export interface ScopedProductInput {
  title: string;
  slug: string;
  description: string;
  basePricePaise: number;
  stock: number;
  sku?: string;
  images?: string[];
  categorySlug?: string;
  isPublished?: boolean;
}

export class TenantScopedPrismaClient {
  private readonly storeId: string;

  constructor(verifiedSessionStoreId: string) {
    if (!verifiedSessionStoreId || verifiedSessionStoreId.trim().length === 0) {
      throw new AntiIdorSecurityViolationError(
        "Cannot instantiate TenantScopedPrismaClient without a verified session storeId."
      );
    }
    this.storeId = verifiedSessionStoreId;
  }

  public get activeStoreId(): string {
    return this.storeId;
  }

  /**
   * 1. StoreProduct Scoped Operations (maps to prisma.product with WHERE vendorId = storeId)
   */
  public readonly StoreProduct = {
    findMany: async (args: { where?: any; orderBy?: any; take?: number; skip?: number } = {}) => {
      const scopedWhere = {
        ...(args.where || {}),
        vendorId: this.storeId,
      };
      return prisma.product.findMany({
        ...args,
        where: scopedWhere,
      });
    },

    findFirst: async (args: { where?: any; include?: any } = {}) => {
      const scopedWhere = {
        ...(args.where || {}),
        vendorId: this.storeId,
      };
      return prisma.product.findFirst({
        ...args,
        where: scopedWhere,
      });
    },

    findUniqueOrThrow: async (id: string) => {
      const product = await prisma.product.findFirst({
        where: { id, vendorId: this.storeId },
      });
      if (!product) {
        throw new AntiIdorSecurityViolationError(
          `StoreProduct [${id}] not found or access denied for tenant [${this.storeId}].`
        );
      }
      return product;
    },

    create: async (data: any) => {
      assertZeroClientTrust({
        claimedStoreId: data.vendorId || data.storeId,
        authenticatedStoreId: this.storeId,
        actionContext: "StoreProduct.create",
      });

      return prisma.product.create({
        data: {
          ...data,
          vendorId: this.storeId,
        },
      });
    },

    update: async (id: string, data: any) => {
      await this.StoreProduct.findUniqueOrThrow(id);

      if (data.vendorId || data.storeId) {
        assertZeroClientTrust({
          claimedStoreId: data.vendorId || data.storeId,
          authenticatedStoreId: this.storeId,
          actionContext: "StoreProduct.update",
        });
      }

      return prisma.product.update({
        where: { id },
        data: {
          ...data,
          vendorId: this.storeId,
        },
      });
    },

    delete: async (id: string) => {
      await this.StoreProduct.findUniqueOrThrow(id);
      return prisma.product.delete({
        where: { id },
      });
    },

    count: async (where: any = {}) => {
      return prisma.product.count({
        where: {
          ...where,
          vendorId: this.storeId,
        },
      });
    },
  };

  /**
   * 2. StoreOrder Scoped Operations (maps to prisma.orderItem & prisma.order with WHERE vendorId = storeId)
   */
  public readonly StoreOrder = {
    findManyOrderLines: async (args: { where?: any; take?: number; skip?: number } = {}) => {
      const scopedWhere = {
        ...(args.where || {}),
        vendorId: this.storeId,
      };
      return prisma.orderItem.findMany({
        ...args,
        where: scopedWhere,
        include: {
          order: true,
          product: true,
        },
      });
    },

    findOrderLineById: async (orderLineId: string) => {
      const item = await prisma.orderItem.findFirst({
        where: { id: orderLineId, vendorId: this.storeId },
        include: { order: true, product: true },
      });
      if (!item) {
        throw new AntiIdorSecurityViolationError(
          `StoreOrder Line [${orderLineId}] not found or access denied for tenant [${this.storeId}].`
        );
      }
      return item;
    },

    updateFulfillmentStatus: async (
      orderLineId: string,
      status: any,
      trackingData?: { courierName?: string; trackingNumber?: string }
    ) => {
      await this.StoreOrder.findOrderLineById(orderLineId);

      return prisma.orderItem.update({
        where: { id: orderLineId },
        data: {
          fulfillmentStatus: status,
          courierName: trackingData?.courierName,
          trackingNumber: trackingData?.trackingNumber,
        },
      });
    },
  };

  /**
   * 3. StoreCustomer Scoped Operations (maps to customers who have transacted with this storeId)
   */
  public readonly StoreCustomer = {
    findMany: async (args: { take?: number; skip?: number } = {}) => {
      const customers = await prisma.user.findMany({
        take: args.take || 50,
        skip: args.skip || 0,
        where: {
          orders: {
            some: {
              items: {
                some: {
                  vendorId: this.storeId,
                },
              },
            },
          },
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
          profile: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      });
      return customers;
    },

    findCustomerById: async (customerId: string) => {
      const customer = await prisma.user.findFirst({
        where: {
          id: customerId,
          orders: {
            some: {
              items: {
                some: {
                  vendorId: this.storeId,
                },
              },
            },
          },
        },
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      });
      if (!customer) {
        throw new AntiIdorSecurityViolationError(
          `StoreCustomer [${customerId}] has no transacted relationship with tenant [${this.storeId}].`
        );
      }
      return customer;
    },
  };

  /**
   * 4. StoreInvoice Scoped Operations (maps to vendor payouts & ledger records WHERE sellerId = storeId)
   */
  public readonly StoreInvoice = {
    findManyPayouts: async (args: { take?: number; skip?: number } = {}) => {
      return prisma.vendorPayout.findMany({
        take: args.take || 50,
        skip: args.skip || 0,
        where: {
          sellerId: this.storeId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    },

    findPayoutById: async (payoutId: string) => {
      const payout = await prisma.vendorPayout.findFirst({
        where: {
          id: payoutId,
          sellerId: this.storeId,
        },
      });
      if (!payout) {
        throw new AntiIdorSecurityViolationError(
          `StoreInvoice [${payoutId}] not found or access denied for tenant [${this.storeId}].`
        );
      }
      return payout;
    },
  };

  /**
   * 5. StoreReturn Scoped Operations (maps to return requests WHERE orderItem belongs to storeId)
   */
  public readonly StoreReturn = {
    findMany: async (args: { take?: number; skip?: number } = {}) => {
      return prisma.returnRequest.findMany({
        take: args.take || 50,
        skip: args.skip || 0,
        where: {
          orderItem: {
            vendorId: this.storeId,
          },
        },
        include: {
          orderItem: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    },

    findReturnById: async (returnId: string) => {
      const ret = await prisma.returnRequest.findFirst({
        where: {
          id: returnId,
          orderItem: {
            vendorId: this.storeId,
          },
        },
        include: {
          orderItem: true,
        },
      });
      if (!ret) {
        throw new AntiIdorSecurityViolationError(
          `StoreReturn [${returnId}] not found or access denied for tenant [${this.storeId}].`
        );
      }
      return ret;
    },
  };
}

/**
 * Factory to create a verified, tenant-scoped database client.
 */
export function createScopedTenantClient(verifiedSessionStoreId: string): TenantScopedPrismaClient {
  return new TenantScopedPrismaClient(verifiedSessionStoreId);
}
