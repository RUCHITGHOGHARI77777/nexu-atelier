import { ReviewStatus, ReactionType, ReportReasonCode } from "@prisma/client";

export interface ReviewMediaDTO {
  id: string;
  mediaType: string;
  url: string;
}

export interface SellerResponseDTO {
  sellerName: string;
  responseText: string;
  createdAt: string;
}

export interface PublicReviewDTO {
  id: string;
  productId: string;
  productTitle: string;
  rating: number; // 1 to 5
  title?: string | null;
  comment?: string | null;
  reviewerName: string; // Masked: e.g. "Aarav M."
  isVerifiedPurchase: boolean;
  variantSku?: string | null;
  variantName?: string | null;
  helpfulVotes: number;
  unhelpfulVotes: number;
  userReaction?: "HELPFUL" | "UNHELPFUL" | null;
  isEdited: boolean;
  media: ReviewMediaDTO[];
  sellerResponse?: SellerResponseDTO | null;
  createdAt: string;
}

export interface StarDistribution {
  star: number;
  count: number;
  percentage: number;
}

export interface ReviewStatsDTO {
  averageRating: number;
  totalCount: number;
  verifiedCount: number;
  distribution: StarDistribution[];
}

export interface CreateReviewPayload {
  productId: string;
  orderItemId?: string;
  rating: number;
  title?: string;
  comment?: string;
  mediaUrls?: string[];
  variantSku?: string;
  variantName?: string;
}

export interface EditReviewPayload {
  rating?: number;
  title?: string;
  comment?: string;
  mediaUrls?: string[];
}

export interface ReviewFilterOptions {
  page?: number;
  limit?: number;
  rating?: number; // 1-5 filter
  verifiedOnly?: boolean;
  hasMediaOnly?: boolean;
  sort?: "recent" | "helpful" | "rating_high" | "rating_low";
}

export interface SellerFeedbackInput {
  orderId: string;
  sellerId: string;
  packagingRating: number;
  deliveryRating: number;
  communicationRating: number;
  comment?: string;
}

export interface SellerReputationScorecard {
  sellerId: string;
  sellerName: string;
  averageProductRating: number;
  totalProductReviews: number;
  packagingScore: number;
  deliveryScore: number;
  communicationScore: number;
  totalServiceFeedbacks: number;
  onTimeDispatchRate: number; // percentage
  sellerCancellationRate: number; // percentage
  responseRate: number; // percentage of reviews answered
}

export interface AdminModerationReviewDTO {
  id: string;
  productId: string;
  productTitle: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  isVerifiedPurchase: boolean;
  status: ReviewStatus;
  reportCount: number;
  reports: {
    reasonCode: ReportReasonCode;
    explanation?: string | null;
    reporterEmail: string;
    createdAt: string;
  }[];
  createdAt: string;
}
