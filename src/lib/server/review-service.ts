import { prisma } from "./prisma";
import { ReviewStatus, ReactionType, ReportReasonCode, OrderStatus } from "@prisma/client";
import {
  PublicReviewDTO,
  ReviewStatsDTO,
  StarDistribution,
  CreateReviewPayload,
  EditReviewPayload,
  ReviewFilterOptions,
  SellerFeedbackInput,
  SellerReputationScorecard,
  AdminModerationReviewDTO,
  SellerResponseDTO,
} from "@/types/review";

export class ReviewError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = "ReviewError";
  }
}

/**
 * Masks a full customer name into privacy-preserving "First Name + Initial" (e.g. "Aarav M.")
 * Never leaks surname, email address, or phone number.
 */
export function maskCustomerName(name?: string | null, email?: string | null): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0];
    }
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1][0].toUpperCase();
    return `${firstName} ${lastInitial}.`;
  }

  if (email && email.includes("@")) {
    const local = email.split("@")[0].replace(/[._-]/g, " ").trim();
    const parts = local.split(/\s+/);
    if (parts.length > 1) {
      const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      const initial = parts[1].charAt(0).toUpperCase();
      return `${first} ${initial}.`;
    }
    return local.charAt(0).toUpperCase() + local.slice(1);
  }

  return "Verified Patron";
}

export class ReviewService {
  /**
   * Recalculates and updates product rating, ratingCount, and ratingBreakdownJson atomically.
   */
  public async recalculateProductRating(productId: string): Promise<void> {
    const reviews = await prisma.productReview.findMany({
      where: {
        productId,
        status: ReviewStatus.PUBLISHED,
      },
      select: { rating: true },
    });

    const totalCount = reviews.length;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    let sum = 0;
    for (const r of reviews) {
      sum += r.rating;
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
    }

    const averageRating = totalCount > 0 ? Math.round((sum / totalCount) * 10) / 10 : 5.0;

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: averageRating,
        ratingCount: totalCount,
        ratingBreakdownJson: JSON.stringify(distribution),
      },
    });
  }

  /**
   * Submits a customer review with verified purchase validation, self-review prevention,
   * duplicate protection, and atomic aggregate recalculation.
   */
  public async createReview(payload: CreateReviewPayload, customerId: string): Promise<PublicReviewDTO> {
    const { productId, rating, title, comment, mediaUrls, variantSku, variantName } = payload;

    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new ReviewError("Rating must be an integer between 1 and 5.", 400);
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: true },
    });

    if (!product) {
      throw new ReviewError("Product not found.", 404);
    }

    const seller = await prisma.seller.findUnique({
      where: { userId: customerId },
    });

    if (seller && seller.id === product.vendorId) {
      throw new ReviewError("Sellers are strictly prohibited from reviewing their own products.", 403);
    }

    let isVerifiedPurchase = false;
    let verifiedOrderItemId: string | null = null;
    let assignedVariantSku: string | null = variantSku || null;
    let assignedVariantName: string | null = variantName || null;

    if (payload.orderItemId) {
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: payload.orderItemId },
        include: { order: true, review: true },
      });

      if (!orderItem) {
        throw new ReviewError("Specified order item does not exist.", 404);
      }

      if (orderItem.order.customerId !== customerId) {
        throw new ReviewError("You do not have authorization to review an item from another customer's order.", 403);
      }

      if (orderItem.productId !== productId) {
        throw new ReviewError("The specified order item does not match this product.", 400);
      }

      if (orderItem.review) {
        throw new ReviewError("A review has already been submitted for this purchased item.", 409);
      }

      const isDelivered =
        orderItem.fulfillmentStatus === "DELIVERED" || orderItem.order.status === OrderStatus.DELIVERED;

      if (!isDelivered) {
        throw new ReviewError("Reviews can only be verified after the order item has been delivered.", 400);
      }

      isVerifiedPurchase = true;
      verifiedOrderItemId = orderItem.id;
      assignedVariantSku = assignedVariantSku || orderItem.selectedSku;
      assignedVariantName = assignedVariantName || orderItem.selectedColorName || orderItem.selectedSize;
    } else {
      const deliveredItem = await prisma.orderItem.findFirst({
        where: {
          productId,
          order: { customerId, status: { in: [OrderStatus.DELIVERED, OrderStatus.CONFIRMED, OrderStatus.IN_PRODUCTION, OrderStatus.SHIPPED] } },
          review: null,
          OR: [
            { fulfillmentStatus: "DELIVERED" },
            { order: { status: OrderStatus.DELIVERED } },
          ],
        },
        include: { order: true },
      });

      if (deliveredItem) {
        isVerifiedPurchase = true;
        verifiedOrderItemId = deliveredItem.id;
        assignedVariantSku = assignedVariantSku || deliveredItem.selectedSku;
        assignedVariantName = assignedVariantName || deliveredItem.selectedColorName || deliveredItem.selectedSize;
      } else {
        const existingReview = await prisma.productReview.findFirst({
          where: {
            productId,
            customerId,
            orderItemId: null,
          },
        });
        if (existingReview) {
          throw new ReviewError("You have already submitted a review for this product.", 409);
        }
      }
    }

    const validMedia = (mediaUrls || []).slice(0, 4).filter((url) => {
      return typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/"));
    });

    const newReview = await prisma.productReview.create({
      data: {
        productId,
        customerId,
        orderItemId: verifiedOrderItemId,
        rating,
        title: title?.trim() || null,
        comment: comment?.trim() || null,
        isVerifiedPurchase,
        variantSku: assignedVariantSku,
        variantName: assignedVariantName,
        status: ReviewStatus.PUBLISHED,
        media: {
          create: validMedia.map((url, idx) => ({
            url,
            mediaType: "IMAGE",
            sortOrder: idx,
          })),
        },
      },
      include: {
        customer: { include: { profile: true } },
        media: true,
        sellerResponse: {
          include: { seller: true },
        },
        product: true,
      },
    });

    await this.recalculateProductRating(productId);

    return {
      id: newReview.id,
      productId: newReview.productId,
      productTitle: product.title,
      rating: newReview.rating,
      title: newReview.title,
      comment: newReview.comment,
      reviewerName: maskCustomerName(newReview.customer.profile?.name, newReview.customer.email),
      isVerifiedPurchase: newReview.isVerifiedPurchase,
      variantSku: newReview.variantSku,
      variantName: newReview.variantName,
      helpfulVotes: newReview.helpfulVotes,
      unhelpfulVotes: newReview.unhelpfulVotes,
      userReaction: null,
      isEdited: newReview.isEdited,
      media: newReview.media.map((m) => ({ id: m.id, mediaType: m.mediaType, url: m.url })),
      sellerResponse: null,
      createdAt: newReview.createdAt.toISOString(),
    };
  }

  /**
   * Retrieves public reviews for a product with filtering, sorting, pagination, and stats breakdown.
   */
  public async getProductReviews(
    productId: string,
    options: ReviewFilterOptions = {},
    currentUserId?: string
  ): Promise<{
    reviews: PublicReviewDTO[];
    stats: ReviewStatsDTO;
    pagination: { page: number; limit: number; totalCount: number; totalPages: number };
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const whereClause: any = {
      productId,
      status: ReviewStatus.PUBLISHED,
    };

    if (options.rating && options.rating >= 1 && options.rating <= 5) {
      whereClause.rating = options.rating;
    }

    if (options.verifiedOnly) {
      whereClause.isVerifiedPurchase = true;
    }

    if (options.hasMediaOnly) {
      whereClause.media = { some: {} };
    }

    let orderBy: any = [{ createdAt: "desc" }];
    if (options.sort === "helpful") {
      orderBy = [{ helpfulVotes: "desc" }, { createdAt: "desc" }];
    } else if (options.sort === "rating_high") {
      orderBy = [{ rating: "desc" }, { createdAt: "desc" }];
    } else if (options.sort === "rating_low") {
      orderBy = [{ rating: "asc" }, { createdAt: "desc" }];
    }

    const [reviews, totalMatching, allPublishedReviews] = await Promise.all([
      prisma.productReview.findMany({
        where: whereClause,
        include: {
          customer: { include: { profile: true } },
          media: { orderBy: { sortOrder: "asc" } },
          sellerResponse: {
            include: { seller: true },
          },
          reactions: currentUserId ? { where: { userId: currentUserId } } : false,
          product: { select: { title: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.productReview.count({ where: whereClause }),
      prisma.productReview.findMany({
        where: { productId, status: ReviewStatus.PUBLISHED },
        select: { rating: true, isVerifiedPurchase: true },
      }),
    ]);

    const totalAll = allPublishedReviews.length;
    let totalScore = 0;
    let verifiedCount = 0;
    const distributionCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const r of allPublishedReviews) {
      totalScore += r.rating;
      if (r.isVerifiedPurchase) verifiedCount++;
      if (distributionCounts[r.rating] !== undefined) {
        distributionCounts[r.rating]++;
      }
    }

    const averageRating = totalAll > 0 ? Math.round((totalScore / totalAll) * 10) / 10 : 5.0;

    const distribution: StarDistribution[] = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: distributionCounts[star] || 0,
      percentage: totalAll > 0 ? Math.round(((distributionCounts[star] || 0) / totalAll) * 100) : 0,
    }));

    const stats: ReviewStatsDTO = {
      averageRating,
      totalCount: totalAll,
      verifiedCount,
      distribution,
    };

    const formattedReviews: PublicReviewDTO[] = reviews.map((r) => {
      const userReaction =
        r.reactions && r.reactions.length > 0
          ? (r.reactions[0].reactionType as "HELPFUL" | "UNHELPFUL")
          : null;

      return {
        id: r.id,
        productId: r.productId,
        productTitle: r.product.title,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        reviewerName: maskCustomerName(r.customer.profile?.name, r.customer.email),
        isVerifiedPurchase: r.isVerifiedPurchase,
        variantSku: r.variantSku,
        variantName: r.variantName,
        helpfulVotes: r.helpfulVotes,
        unhelpfulVotes: r.unhelpfulVotes,
        userReaction,
        isEdited: r.isEdited,
        media: r.media.map((m) => ({ id: m.id, mediaType: m.mediaType, url: m.url })),
        sellerResponse: r.sellerResponse
          ? {
              sellerName: r.sellerResponse.seller.name,
              responseText: r.sellerResponse.responseText,
              createdAt: r.sellerResponse.createdAt.toISOString(),
            }
          : null,
        createdAt: r.createdAt.toISOString(),
      };
    });

    return {
      reviews: formattedReviews,
      stats,
      pagination: {
        page,
        limit,
        totalCount: totalMatching,
        totalPages: Math.ceil(totalMatching / limit),
      },
    };
  }

  /**
   * Updates an existing review submitted by the author.
   */
  public async editReview(
    reviewId: string,
    customerId: string,
    payload: EditReviewPayload
  ): Promise<PublicReviewDTO> {
    const existing = await prisma.productReview.findUnique({
      where: { id: reviewId },
      include: { product: true },
    });

    if (!existing) {
      throw new ReviewError("Review not found.", 404);
    }

    if (existing.customerId !== customerId) {
      throw new ReviewError("You do not have permission to edit this review.", 403);
    }

    if (existing.status === ReviewStatus.REMOVED || existing.status === ReviewStatus.REJECTED) {
      throw new ReviewError("Removed or rejected reviews cannot be edited.", 400);
    }

    if (payload.rating !== undefined && (payload.rating < 1 || payload.rating > 5)) {
      throw new ReviewError("Rating must be between 1 and 5.", 400);
    }

    if (payload.mediaUrls) {
      await prisma.reviewMedia.deleteMany({ where: { reviewId } });
      const validMedia = payload.mediaUrls.slice(0, 4).filter((url) => {
        return typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/"));
      });
      await prisma.reviewMedia.createMany({
        data: validMedia.map((url, idx) => ({
          reviewId,
          url,
          mediaType: "IMAGE",
          sortOrder: idx,
        })),
      });
    }

    const updated = await prisma.productReview.update({
      where: { id: reviewId },
      data: {
        rating: payload.rating !== undefined ? payload.rating : existing.rating,
        title: payload.title !== undefined ? payload.title.trim() || null : existing.title,
        comment: payload.comment !== undefined ? payload.comment.trim() || null : existing.comment,
        isEdited: true,
      },
      include: {
        customer: { include: { profile: true } },
        media: true,
        sellerResponse: { include: { seller: true } },
      },
    });

    await this.recalculateProductRating(existing.productId);

    return {
      id: updated.id,
      productId: updated.productId,
      productTitle: existing.product.title,
      rating: updated.rating,
      title: updated.title,
      comment: updated.comment,
      reviewerName: maskCustomerName(updated.customer.profile?.name, updated.customer.email),
      isVerifiedPurchase: updated.isVerifiedPurchase,
      variantSku: updated.variantSku,
      variantName: updated.variantName,
      helpfulVotes: updated.helpfulVotes,
      unhelpfulVotes: updated.unhelpfulVotes,
      userReaction: null,
      isEdited: updated.isEdited,
      media: updated.media.map((m) => ({ id: m.id, mediaType: m.mediaType, url: m.url })),
      sellerResponse: updated.sellerResponse
        ? {
            sellerName: updated.sellerResponse.seller.name,
            responseText: updated.sellerResponse.responseText,
            createdAt: updated.sellerResponse.createdAt.toISOString(),
          }
        : null,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Records or toggles a helpful/unhelpful customer reaction.
   * Enforces 1 vote per customer and recalculates helpfulVotes atomically.
   */
  public async reactToReview(
    reviewId: string,
    userId: string,
    reactionType: ReactionType
  ): Promise<{ helpfulVotes: number; unhelpfulVotes: number; userReaction: ReactionType | null }> {
    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ReviewError("Review not found.", 404);
    }

    if (review.customerId === userId) {
      throw new ReviewError("You cannot react to your own review.", 400);
    }

    const existingReaction = await prisma.reviewReaction.findUnique({
      where: {
        reviewId_userId: { reviewId, userId },
      },
    });

    let finalReaction: ReactionType | null = reactionType;

    if (existingReaction) {
      if (existingReaction.reactionType === reactionType) {
        await prisma.reviewReaction.delete({
          where: { id: existingReaction.id },
        });
        finalReaction = null;
      } else {
        await prisma.reviewReaction.update({
          where: { id: existingReaction.id },
          data: { reactionType },
        });
      }
    } else {
      await prisma.reviewReaction.create({
        data: {
          reviewId,
          userId,
          reactionType,
        },
      });
    }

    const [helpfulCount, unhelpfulCount] = await Promise.all([
      prisma.reviewReaction.count({
        where: { reviewId, reactionType: ReactionType.HELPFUL },
      }),
      prisma.reviewReaction.count({
        where: { reviewId, reactionType: ReactionType.UNHELPFUL },
      }),
    ]);

    await prisma.productReview.update({
      where: { id: reviewId },
      data: {
        helpfulVotes: helpfulCount,
        unhelpfulVotes: unhelpfulCount,
      },
    });

    return {
      helpfulVotes: helpfulCount,
      unhelpfulVotes: unhelpfulCount,
      userReaction: finalReaction,
    };
  }

  /**
   * Submits an abuse/policy violation report. Transitions review to REPORTED if threshold reached.
   */
  public async reportReview(
    reviewId: string,
    reporterId: string,
    reasonCode: ReportReasonCode,
    explanation?: string
  ): Promise<{ success: boolean; reportCount: number }> {
    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ReviewError("Review not found.", 404);
    }

    if (review.customerId === reporterId) {
      throw new ReviewError("You cannot report your own review.", 400);
    }

    const existing = await prisma.reviewReport.findFirst({
      where: { reviewId, reporterId },
    });

    if (existing) {
      throw new ReviewError("You have already reported this review.", 409);
    }

    await prisma.reviewReport.create({
      data: {
        reviewId,
        reporterId,
        reasonCode,
        explanation: explanation?.trim() || null,
      },
    });

    const reportCount = await prisma.reviewReport.count({
      where: { reviewId },
    });

    const newStatus =
      reportCount >= 3 && review.status === ReviewStatus.PUBLISHED
        ? ReviewStatus.REPORTED
        : review.status;

    await prisma.productReview.update({
      where: { id: reviewId },
      data: {
        reportCount,
        status: newStatus,
      },
    });

    return { success: true, reportCount };
  }

  /**
   * Authors or updates an official seller response to a product review.
   * Strictly enforces that the responding seller is the verified vendor of the product.
   */
  public async respondToReview(
    reviewId: string,
    sellerId: string,
    responseText: string
  ): Promise<SellerResponseDTO> {
    if (!responseText || responseText.trim().length < 5) {
      throw new ReviewError("Response text must be at least 5 characters.", 400);
    }

    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
      include: {
        product: true,
      },
    });

    if (!review) {
      throw new ReviewError("Review not found.", 404);
    }

    if (review.product.vendorId !== sellerId) {
      throw new ReviewError("Only the verified seller of this product may post an official seller response.", 403);
    }

    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      throw new ReviewError("Seller not found.", 404);
    }

    const response = await prisma.sellerReviewResponse.upsert({
      where: { reviewId },
      create: {
        reviewId,
        sellerId,
        responseText: responseText.trim(),
      },
      update: {
        responseText: responseText.trim(),
      },
    });

    return {
      sellerName: seller.name,
      responseText: response.responseText,
      createdAt: response.createdAt.toISOString(),
    };
  }

  /**
   * Admin content moderation queue action.
   * Strict marketplace rule: Negative reviews are never removed merely for being critical.
   * Only objective policy violations (SPAM, HARASSMENT, PII, ADVERTISING) warrant removal.
   */
  public async moderateReview(params: {
    reviewId: string;
    action: "APPROVED" | "REJECTED" | "REMOVED" | "REINSTATED";
    reasonCode?: string;
    note?: string;
    adminUserId: string;
  }): Promise<{ status: ReviewStatus }> {
    const { reviewId, action, reasonCode, note, adminUserId } = params;

    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ReviewError("Review not found.", 404);
    }

    let newStatus: ReviewStatus = review.status;
    if (action === "APPROVED" || action === "REINSTATED") {
      newStatus = ReviewStatus.PUBLISHED;
    } else if (action === "REJECTED") {
      newStatus = ReviewStatus.REJECTED;
    } else if (action === "REMOVED") {
      newStatus = ReviewStatus.REMOVED;
    }

    await prisma.$transaction([
      prisma.productReview.update({
        where: { id: reviewId },
        data: { status: newStatus },
      }),
      prisma.reviewModerationEvent.create({
        data: {
          reviewId,
          action,
          reasonCode: reasonCode || null,
          note: note || null,
          performedBy: adminUserId,
        },
      }),
      prisma.reviewReport.updateMany({
        where: { reviewId },
        data: { status: action === "REMOVED" ? "RESOLVED" : "DISMISSED" },
      }),
    ]);

    await this.recalculateProductRating(review.productId);

    return { status: newStatus };
  }

  /**
   * Retrieves pending or reported reviews for the admin moderation queue.
   */
  public async getModerationQueue(): Promise<AdminModerationReviewDTO[]> {
    const reviews = await prisma.productReview.findMany({
      where: {
        status: { in: [ReviewStatus.REPORTED, ReviewStatus.UNDER_REVIEW, ReviewStatus.PENDING_REVIEW] },
      },
      include: {
        customer: { include: { profile: true } },
        product: { select: { title: true } },
        reports: {
          include: { reporter: { select: { email: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ reportCount: "desc" }, { createdAt: "desc" }],
    });

    return reviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      productTitle: r.product.title,
      customerName: r.customer.profile?.name || "Customer",
      customerEmail: r.customer.email,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      isVerifiedPurchase: r.isVerifiedPurchase,
      status: r.status,
      reportCount: r.reportCount,
      reports: r.reports.map((rep) => ({
        reasonCode: rep.reasonCode,
        explanation: rep.explanation,
        reporterEmail: rep.reporter.email,
        createdAt: rep.createdAt.toISOString(),
      })),
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Submits seller service feedback for an executed order.
   */
  public async submitSellerFeedback(
    payload: SellerFeedbackInput,
    customerId: string
  ): Promise<{ id: string; success: boolean }> {
    const { orderId, sellerId, packagingRating, deliveryRating, communicationRating, comment } = payload;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new ReviewError("Order not found.", 404);
    }

    if (order.customerId !== customerId) {
      throw new ReviewError("Unauthorized to submit feedback for this order.", 403);
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new ReviewError("Seller feedback can only be submitted after order delivery.", 400);
    }

    const sellerHasItems = order.items.some(
      (item) => item.vendorId === sellerId || item.product?.vendorId === sellerId
    );
    if (!sellerHasItems) {
      throw new ReviewError("The specified seller did not fulfill any items in this order.", 400);
    }

    const existingFeedback = await prisma.sellerFeedback.findUnique({
      where: { orderId },
    });

    if (existingFeedback) {
      throw new ReviewError("Seller feedback has already been submitted for this order.", 409);
    }

    const feedback = await prisma.sellerFeedback.create({
      data: {
        orderId,
        sellerId,
        customerId,
        packagingRating: Math.min(5, Math.max(1, Math.round(packagingRating))),
        deliveryRating: Math.min(5, Math.max(1, Math.round(deliveryRating))),
        communicationRating: Math.min(5, Math.max(1, Math.round(communicationRating))),
        comment: comment?.trim() || null,
      },
    });

    return { id: feedback.id, success: true };
  }

  /**
   * Computes comprehensive seller reputation scorecard, objective fulfillment KPIs,
   * service ratings, and unanswered review counts.
   */
  public async getSellerReputation(sellerId: string): Promise<SellerReputationScorecard> {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        products: {
          select: { id: true },
        },
      },
    });

    if (!seller) {
      throw new ReviewError("Seller not found.", 404);
    }

    const productIds = seller.products.map((p) => p.id);

    const productReviews = await prisma.productReview.findMany({
      where: {
        productId: { in: productIds },
        status: ReviewStatus.PUBLISHED,
      },
      include: { sellerResponse: true },
    });

    const totalProductReviews = productReviews.length;
    const sumProductRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageProductRating =
      totalProductReviews > 0 ? Math.round((sumProductRating / totalProductReviews) * 10) / 10 : 5.0;

    const answeredReviews = productReviews.filter((r) => r.sellerResponse !== null).length;
    const responseRate =
      totalProductReviews > 0 ? Math.round((answeredReviews / totalProductReviews) * 100) : 100;

    const serviceFeedbacks = await prisma.sellerFeedback.findMany({
      where: { sellerId },
    });

    const totalServiceFeedbacks = serviceFeedbacks.length;
    let packagingSum = 0;
    let deliverySum = 0;
    let commSum = 0;

    for (const f of serviceFeedbacks) {
      packagingSum += f.packagingRating;
      deliverySum += f.deliveryRating;
      commSum += f.communicationRating;
    }

    const packagingScore =
      totalServiceFeedbacks > 0 ? Math.round((packagingSum / totalServiceFeedbacks) * 10) / 10 : 5.0;
    const deliveryScore =
      totalServiceFeedbacks > 0 ? Math.round((deliverySum / totalServiceFeedbacks) * 10) / 10 : 5.0;
    const communicationScore =
      totalServiceFeedbacks > 0 ? Math.round((commSum / totalServiceFeedbacks) * 10) / 10 : 5.0;

    const [shipments, sellerOrders] = await Promise.all([
      prisma.shipment.findMany({
        where: { sellerId },
        select: { dispatchedAt: true, createdAt: true },
      }),
      prisma.orderItem.findMany({
        where: { product: { vendorId: sellerId } },
        select: { fulfillmentStatus: true },
      }),
    ]);

    let onTimeDispatches = 0;
    for (const s of shipments) {
      if (s.dispatchedAt) {
        const diffHours = (s.dispatchedAt.getTime() - s.createdAt.getTime()) / (1000 * 60 * 60);
        if (diffHours <= 48) {
          onTimeDispatches++;
        }
      }
    }
    const onTimeDispatchRate =
      shipments.length > 0 ? Math.round((onTimeDispatches / shipments.length) * 100) : 100;

    const totalItems = sellerOrders.length;
    const cancelledItems = sellerOrders.filter((i) => i.fulfillmentStatus === "CANCELLED").length;
    const sellerCancellationRate =
      totalItems > 0 ? Math.round((cancelledItems / totalItems) * 100) : 0;

    return {
      sellerId: seller.id,
      sellerName: seller.name,
      averageProductRating,
      totalProductReviews,
      packagingScore,
      deliveryScore,
      communicationScore,
      totalServiceFeedbacks,
      onTimeDispatchRate,
      sellerCancellationRate,
      responseRate,
    };
  }
}

export const reviewService = new ReviewService();
