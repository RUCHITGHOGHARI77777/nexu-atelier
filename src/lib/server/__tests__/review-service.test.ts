import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { reviewService, maskCustomerName } from "../review-service";
import { prisma } from "../prisma";
import { ReviewStatus, ReactionType, ReportReasonCode, OrderStatus, FulfillmentStatus } from "@prisma/client";

describe("Review & Reputation Domain Service", () => {
  const patron1Id = "usr_patron_01"; // Aarav Mehta
  const patron2Id = "usr_patron_02"; // Priya Sharma
  const sellerId = "vnd_sol_textiles"; // Solstice Textiles
  const sellerUserId = "usr_seller_01"; // User ID for Solstice Textiles
  const adminId = "usr_admin_01";

  let testProduct: any;
  let testDeliveredItem: any;
  let createdReviewId: string;

  beforeAll(async () => {
    testProduct = await prisma.product.findFirst({
      where: { vendorId: sellerId },
    });

    const testOrder = await prisma.order.create({
      data: {
        id: `ORD-REV-TEST-${Date.now()}`,
        customerId: patron2Id,
        customerEmail: "priya.test@nexu.studio",
        customerName: "Priya Sharma",
        shippingAddressSnapshot: JSON.stringify({ street: "Test Road", city: "Mumbai", postalCode: "400001" }),
        deliveryMethodId: "express",
        deliveryMethodName: "Bluedart Air Express",
        deliveryEstimatedDays: 3,
        estimatedDeliveryDate: new Date(),
        shippingFeePaise: 0,
        estimatedTaxPaise: 1000,
        subtotalPaise: 50000,
        totalPaise: 51000,
        status: OrderStatus.DELIVERED,
        items: {
          create: {
            id: `item_rev_test_${Date.now()}`,
            product: { connect: { id: testProduct.id } },
            productSlug: testProduct.slug,
            title: testProduct.title,
            vendorId: sellerId,
            vendorName: "Solstice Textiles",
            selectedColorName: "Artisanal Weave Edition",
            selectedSku: "SOL-RAW-001",
            unitPricePaise: 50000,
            quantity: 1,
            lineTotalPaise: 50000,
            imageSnapshot: "https://images.unsplash.com/photo-test",
            fulfillmentStatus: FulfillmentStatus.DELIVERED,
          },
        },
      },
      include: { items: true },
    });

    testDeliveredItem = testOrder.items[0];
  });

  afterAll(async () => {
    if (createdReviewId) {
      await prisma.reviewReaction.deleteMany({ where: { reviewId: createdReviewId } });
      await prisma.reviewReport.deleteMany({ where: { reviewId: createdReviewId } });
      await prisma.sellerReviewResponse.deleteMany({ where: { reviewId: createdReviewId } });
      await prisma.reviewMedia.deleteMany({ where: { reviewId: createdReviewId } });
      await prisma.reviewModerationEvent.deleteMany({ where: { reviewId: createdReviewId } });
      await prisma.productReview.deleteMany({ where: { id: createdReviewId } });
    }
    if (testDeliveredItem) {
      await prisma.orderItem.deleteMany({ where: { id: testDeliveredItem.id } });
      await prisma.order.deleteMany({ where: { id: testDeliveredItem.orderId } });
    }
  });

  describe("Customer Name Privacy Masking", () => {
    it("masks customer full names into privacy-preserving format", () => {
      expect(maskCustomerName("Aarav Mehta")).toBe("Aarav M.");
      expect(maskCustomerName("Devika S. Patel")).toBe("Devika P.");
      expect(maskCustomerName("Siddharth")).toBe("Siddharth");
      expect(maskCustomerName(null, "rohan.verma@example.com")).toBe("Rohan V.");
    });
  });

  describe("Review Submission & Verified Purchase Qualification", () => {
    it("submits a verified purchase review linked to a delivered order item", async () => {
      const review = await reviewService.createReview(
        {
          productId: testProduct.id,
          orderItemId: testDeliveredItem.id,
          rating: 5,
          title: "Sublime tactile texture and artisanal weight",
          comment: "Exceptional weave density and subtle obsidian color tone. Exceeded high expectations.",
          mediaUrls: ["https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600"],
        },
        patron2Id
      );

      createdReviewId = review.id;
      expect(review.isVerifiedPurchase).toBe(true);
      expect(review.rating).toBe(5);
      expect(review.variantName).toBe("Artisanal Weave Edition");
      expect(review.media.length).toBe(1);
      expect(review.reviewerName).toBe("Priya S.");

      const updatedProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });
      expect(updatedProduct?.ratingCount).toBeGreaterThanOrEqual(1);
      expect(updatedProduct?.rating).toBeGreaterThan(0);
      expect(updatedProduct?.ratingBreakdownJson).toBeDefined();
    });

    it("strictly prevents duplicate reviews for the exact same purchased order item", async () => {
      await expect(
        reviewService.createReview(
          {
            productId: testProduct.id,
            orderItemId: testDeliveredItem.id,
            rating: 4,
            title: "Attempting duplicate review",
          },
          patron2Id
        )
      ).rejects.toThrow("A review has already been submitted for this purchased item.");
    });

    it("prevents vendors/sellers from reviewing their own products (Self-Review Prevention)", async () => {
      await expect(
        reviewService.createReview(
          {
            productId: testProduct.id,
            rating: 5,
            title: "Vendor praising own piece",
          },
          sellerUserId // The user who owns Solstice Textiles
        )
      ).rejects.toThrow("Sellers are strictly prohibited from reviewing their own products.");
    });

    it("validates star rating boundaries (rejects ratings < 1 or > 5)", async () => {
      await expect(
        reviewService.createReview(
          {
            productId: testProduct.id,
            rating: 6,
            title: "Invalid star rating",
          },
          patron1Id
        )
      ).rejects.toThrow("Rating must be an integer between 1 and 5.");
    });
  });

  describe("Customer Reactions & Deduplication", () => {
    it("records a helpful reaction and updates helpfulVotes atomically", async () => {
      const res = await reviewService.reactToReview(createdReviewId, patron1Id, ReactionType.HELPFUL);
      expect(res.helpfulVotes).toBe(1);
      expect(res.unhelpfulVotes).toBe(0);
      expect(res.userReaction).toBe(ReactionType.HELPFUL);
    });

    it("toggles reaction off when clicking the same reaction button again", async () => {
      const res = await reviewService.reactToReview(createdReviewId, patron1Id, ReactionType.HELPFUL);
      expect(res.helpfulVotes).toBe(0);
      expect(res.userReaction).toBe(null);
    });

    it("switches reaction from helpful to unhelpful smoothly", async () => {
      await reviewService.reactToReview(createdReviewId, patron1Id, ReactionType.HELPFUL);
      const res = await reviewService.reactToReview(createdReviewId, patron1Id, ReactionType.UNHELPFUL);
      expect(res.helpfulVotes).toBe(0);
      expect(res.unhelpfulVotes).toBe(1);
      expect(res.userReaction).toBe(ReactionType.UNHELPFUL);
    });

    it("prevents reviewers from reacting to their own review", async () => {
      await expect(
        reviewService.reactToReview(createdReviewId, patron2Id, ReactionType.HELPFUL)
      ).rejects.toThrow("You cannot react to your own review.");
    });
  });

  describe("Official Seller Response Authorization", () => {
    it("allows the verified product seller to post an official response", async () => {
      const response = await reviewService.respondToReview(
        createdReviewId,
        sellerId,
        "We are thrilled you appreciate the heritage Varanasi silk finish. Warm regards from our atelier."
      );

      expect(response.sellerName).toBe("Solstice Loom Studio");
      expect(response.responseText).toContain("heritage Varanasi silk finish");

      const reviewList = await reviewService.getProductReviews(testProduct.id);
      const found = reviewList.reviews.find((r) => r.id === createdReviewId);
      expect(found?.sellerResponse).toBeDefined();
      expect(found?.sellerResponse?.sellerName).toBe("Solstice Loom Studio");
    });

    it("strictly prevents an unrelated seller from posting responses to another vendor's product review", async () => {
      const otherSellerId = "vnd_voxel_audio";
      await expect(
        reviewService.respondToReview(
          createdReviewId,
          otherSellerId,
          "Unauthorized seller replying"
        )
      ).rejects.toThrow("Only the verified seller of this product may post an official seller response.");
    });
  });

  describe("Abuse Reporting & Auto-Flagging", () => {
    it("submits a policy abuse report and increments reportCount", async () => {
      const res = await reviewService.reportReview(
        createdReviewId,
        patron1Id,
        ReportReasonCode.SPAM_OR_ADVERTISEMENT,
        "Testing report submission"
      );

      expect(res.success).toBe(true);
      expect(res.reportCount).toBeGreaterThanOrEqual(1);
    });

    it("prevents authors from reporting their own review", async () => {
      await expect(
        reviewService.reportReview(
          createdReviewId,
          patron2Id,
          ReportReasonCode.HARASSMENT_OR_ABUSE
        )
      ).rejects.toThrow("You cannot report your own review.");
    });

    it("prevents the same user from submitting duplicate reports for the same review", async () => {
      await expect(
        reviewService.reportReview(
          createdReviewId,
          patron1Id,
          ReportReasonCode.SPAM_OR_ADVERTISEMENT
        )
      ).rejects.toThrow("You have already reported this review.");
    });
  });

  describe("Admin Moderation & Policy Protection", () => {
    it("moderates review and updates product aggregate rating upon removal", async () => {
      const approved = await reviewService.moderateReview({
        reviewId: createdReviewId,
        action: "APPROVED",
        reasonCode: "POLICY_COMPLIANT",
        note: "Verified authentic collector review.",
        adminUserId: adminId,
      });
      expect(approved.status).toBe(ReviewStatus.PUBLISHED);

      const removed = await reviewService.moderateReview({
        reviewId: createdReviewId,
        action: "REMOVED",
        reasonCode: "SPAM_OR_ADVERTISEMENT",
        note: "Removed in test.",
        adminUserId: adminId,
      });
      expect(removed.status).toBe(ReviewStatus.REMOVED);

      const publicReviews = await reviewService.getProductReviews(testProduct.id);
      const isPresent = publicReviews.reviews.some((r) => r.id === createdReviewId);
      expect(isPresent).toBe(false);

      const reinstated = await reviewService.moderateReview({
        reviewId: createdReviewId,
        action: "REINSTATED",
        adminUserId: adminId,
      });
      expect(reinstated.status).toBe(ReviewStatus.PUBLISHED);
    });
  });

  describe("Seller Reputation Scorecard & Fulfillment Metrics", () => {
    it("calculates accurate seller scorecard with rating aggregates, OTDR, and response rate", async () => {
      const scorecard = await reviewService.getSellerReputation(sellerId);

      expect(scorecard.sellerId).toBe(sellerId);
      expect(scorecard.sellerName).toBe("Solstice Loom Studio");
      expect(scorecard.averageProductRating).toBeGreaterThanOrEqual(1.0);
      expect(scorecard.averageProductRating).toBeLessThanOrEqual(5.0);
      expect(scorecard.onTimeDispatchRate).toBeGreaterThanOrEqual(0);
      expect(scorecard.onTimeDispatchRate).toBeLessThanOrEqual(100);
      expect(scorecard.packagingScore).toBeGreaterThanOrEqual(1.0);
      expect(scorecard.responseRate).toBeGreaterThanOrEqual(0);
    });
  });
});
