-- CreateEnum
CREATE TYPE "SellerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ProductApprovalStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('NEW', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('ESCROW_HOLD', 'ELIGIBLE_FOR_PAYOUT', 'PROCESSING', 'SETTLED', 'WITHHELD');

-- AlterTable
ALTER TABLE "Seller" ADD COLUMN "status" "SellerStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN "businessEmail" TEXT,
ADD COLUMN "businessPhone" TEXT,
ADD COLUMN "taxIdentifier" TEXT,
ADD COLUMN "commissionRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
ADD COLUMN "bankAccountName" TEXT,
ADD COLUMN "bankAccountNumber" TEXT,
ADD COLUMN "bankIfsc" TEXT,
ADD COLUMN "rejectionReason" TEXT,
ADD COLUMN "approvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "approvalStatus" "ProductApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN "moderationNotes" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN "courierName" TEXT,
ADD COLUMN "trackingNumber" TEXT,
ADD COLUMN "dispatchedAt" TIMESTAMP(3),
ADD COLUMN "deliveredAt" TIMESTAMP(3),
ADD COLUMN "cancellationReason" TEXT;

-- CreateTable
CREATE TABLE "VendorPayout" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "orderItemId" TEXT,
    "grossAmountPaise" INTEGER NOT NULL,
    "commissionPaise" INTEGER NOT NULL,
    "netPayoutPaise" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'ESCROW_HOLD',
    "settledAt" TIMESTAMP(3),
    "transactionRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Seller_status_idx" ON "Seller"("status");

-- CreateIndex
CREATE INDEX "Product_approvalStatus_idx" ON "Product"("approvalStatus");

-- CreateIndex
CREATE INDEX "OrderItem_vendorId_idx" ON "OrderItem"("vendorId");

-- CreateIndex
CREATE INDEX "OrderItem_fulfillmentStatus_idx" ON "OrderItem"("fulfillmentStatus");

-- CreateIndex
CREATE INDEX "VendorPayout_sellerId_idx" ON "VendorPayout"("sellerId");

-- CreateIndex
CREATE INDEX "VendorPayout_status_idx" ON "VendorPayout"("status");

-- AddForeignKey
ALTER TABLE "VendorPayout" ADD CONSTRAINT "VendorPayout_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayout" ADD CONSTRAINT "VendorPayout_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
