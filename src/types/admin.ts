import {
  SellerStatus,
  ProductApprovalStatus,
  FulfillmentStatus,
  PayoutStatus,
  OrderStatus,
  PaymentStatus,
  DisputeStatus,
  CouponDiscountType,
  UserRole,
} from "@prisma/client";

export {
  SellerStatus,
  ProductApprovalStatus,
  FulfillmentStatus,
  PayoutStatus,
  OrderStatus,
  PaymentStatus,
  DisputeStatus,
  CouponDiscountType,
  UserRole,
};

export interface AdminMetrics {
  grossMerchandiseValue: number;
  netPlatformRevenue: number;
  totalCommission: number;
  totalOrders: number;
  completedOrders: number;
  inTransitOrders: number;
  cancelledOrders: number;
  activeSellers: number;
  pendingSellers: number;
  suspendedSellers: number;
  activeProducts: number;
  pendingProducts: number;
  totalCustomers: number;
  openDisputes: number;
  totalRefunded: number;
}

export interface AdminSellerView {
  id: string;
  userId: string | null;
  name: string;
  slug: string;
  originHub: string;
  story: string;
  status: SellerStatus;
  businessEmail: string | null;
  businessPhone: string | null;
  taxIdentifier: string | null;
  commissionRatePercent: number;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  rejectionReason: string | null;
  productCount: number;
  orderCount: number;
  grossSales: number;
  createdAt: string;
  approvedAt: string | null;
}

export interface AdminProductView {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  category: string;
  categoryId: string;
  vendorName: string;
  vendorId: string;
  basePrice: number;
  compareAtPrice: number | null;
  stock: number;
  isPublished: boolean;
  approvalStatus: ProductApprovalStatus;
  moderationNotes: string | null;
  variantsCount: number;
  images: string[];
  createdAt: string;
}

export interface AdminOrderView {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  shippingAddressSnapshot: any;
  deliveryMethodName: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  couponCode: string | null;
  total: number;
  refundedAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  items: {
    id: string;
    productTitle: string;
    vendorName: string;
    vendorId: string;
    sku: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    fulfillmentStatus: FulfillmentStatus;
    courierName: string | null;
    trackingNumber: string | null;
  }[];
  disputes: {
    id: string;
    reason: string;
    status: DisputeStatus;
    refundAmount: number | null;
  }[];
}

export interface DisputeCaseView {
  id: string;
  orderId: string;
  orderItemId: string | null;
  customerId: string;
  customerName: string;
  customerEmail: string;
  sellerId: string | null;
  sellerName: string | null;
  reason: string;
  evidence: string | null;
  status: DisputeStatus;
  refundAmount: number | null;
  internalNotes: string | null;
  resolutionReason: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface CouponView {
  id: string;
  code: string;
  description: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  perCustomerLimit: number;
  timesUsed: number;
  startsAt: string;
  expiresAt: string | null;
  isActive: boolean;
  fundedBy: string;
  createdAt: string;
}

export interface CouponInput {
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perCustomerLimit?: number;
  startsAt?: string;
  expiresAt?: string;
  isActive?: boolean;
  fundedBy?: string;
}

export interface PlatformSettingView {
  key: string;
  value: string;
  description: string | null;
  updatedBy: string | null;
  updatedAt: string;
}

export interface AuditEventView {
  id: string;
  orderId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  note: string;
  performedBy: string;
  createdAt: string;
}

export interface AdminUserView {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string | null;
  createdAt: string;
  orderCount: number;
  sellerSlug?: string | null;
}
