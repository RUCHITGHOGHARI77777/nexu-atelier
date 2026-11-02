import { getSessionUser } from "./session-helper";
import { prisma } from "./prisma";
import { SellerProfile } from "@/types/seller";
import { CustomerUser } from "@/types/customer";

export interface SellerAuthContext {
  user: CustomerUser;
  seller: SellerProfile | null;
  activeStoreId?: string;
  isSeller: boolean;
  isApproved: boolean;
}

export async function getAuthenticatedSeller(): Promise<SellerAuthContext | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const dbSeller = await prisma.seller.findFirst({
    where: {
      OR: [
        { userId: user.id },
        { businessEmail: user.email },
      ],
    },
  });

  if (!dbSeller) {
    return {
      user: {
        ...user,
        activeStoreId: undefined,
      },
      seller: null,
      activeStoreId: undefined,
      isSeller: user.role === "seller",
      isApproved: false,
    };
  }

  const seller: SellerProfile = {
    id: dbSeller.id,
    userId: dbSeller.userId,
    slug: dbSeller.slug,
    name: dbSeller.name,
    originHub: dbSeller.originHub,
    story: dbSeller.story,
    heroImage: dbSeller.heroImage,
    verified: dbSeller.verified,
    rating: dbSeller.rating,
    leadTimeDays: dbSeller.leadTimeDays,
    status: dbSeller.status as any,
    businessEmail: dbSeller.businessEmail,
    businessPhone: dbSeller.businessPhone,
    taxIdentifier: dbSeller.taxIdentifier,
    commissionRatePercent: dbSeller.commissionRatePercent,
    bankAccountName: dbSeller.bankAccountName,
    bankAccountNumber: dbSeller.bankAccountNumber,
    bankIfsc: dbSeller.bankIfsc,
    rejectionReason: dbSeller.rejectionReason,
    approvedAt: dbSeller.approvedAt ? dbSeller.approvedAt.toISOString() : null,
    createdAt: dbSeller.createdAt.toISOString(),
  };

  return {
    user: {
      ...user,
      activeStoreId: dbSeller.id,
    },
    seller,
    activeStoreId: dbSeller.id,
    isSeller: true,
    isApproved: dbSeller.status === "APPROVED",
  };
}
