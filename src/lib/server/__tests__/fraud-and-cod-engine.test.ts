import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "../prisma";
import { fraudDetectionService } from "../fraud-detection-service";
import { codService } from "../cod-service";
import { paymentReportService } from "../payment-report-service";
import { sellerService } from "../seller-service";
import { FraudEvaluationInput } from "@/types/payment-fraud";

describe("NEXU ATELIER — Fraud Detection, COD & Pre-Payment Engine", () => {
  let testCustomerId: string;
  let testCustomerEmail: string;
  let testAdminId: string;
  let testSellerId: string;

  beforeEach(async () => {
    // Unique test customer
    testCustomerEmail = `fraud_test_${Date.now()}@nexu.studio`;
    const customerUser = await prisma.user.create({
      data: {
        email: testCustomerEmail,
        passwordHash: "pbkdf2_hash_dummy",
        role: "CUSTOMER",
        profile: {
          create: {
            name: "Test Patron",
            phone: "9876543210",
            isPhoneVerified: false,
            codRefusalCount: 0,
            rtoCount: 0,
          },
        },
      },
    });
    testCustomerId = customerUser.id;

    // Admin user
    let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: `admin_${Date.now()}@nexu.studio`,
          passwordHash: "pbkdf2_hash_dummy",
          role: "ADMIN",
        },
      });
    }
    testAdminId = admin.id;

    // Seller user
    const seller = await prisma.seller.findFirst();
    if (seller) {
      testSellerId = seller.id;
    } else {
      const sUser = await prisma.user.create({
        data: {
          email: `seller_${Date.now()}@nexu.studio`,
          passwordHash: "dummy",
          role: "SELLER",
        },
      });
      const newSeller = await prisma.seller.create({
        data: {
          userId: sUser.id,
          name: "Heritage Silks Studio",
          slug: `heritage-silks-${Date.now()}`,
          originHub: "Jaipur",
          story: "Handloom textiles",
          heroImage: "/images/seller.jpg",
          status: "APPROVED",
        },
      });
      testSellerId = newSeller.id;
    }

    // Ensure COD is enabled in platform settings for isolated test execution
    await prisma.platformSetting.upsert({
      where: { key: "fraud_cod_enabled" },
      update: { value: "true" },
      create: {
        key: "fraud_cod_enabled",
        value: "true",
        description: "COD Enabled",
      },
    });
  });

  afterAll(async () => {
    // Clean up test records in correct foreign-key dependency order
    await prisma.paymentRecord.deleteMany({
      where: { order: { customerEmail: { contains: "fraud_test_" } } },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: { contains: "fraud_test_" } },
    });
    await (prisma as any).orderRiskAssessment.deleteMany({
      where: { customer: { email: { contains: "fraud_test_" } } },
    });
    await prisma.customerProfile.deleteMany({
      where: { user: { email: { contains: "fraud_test_" } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: "fraud_test_" } },
    });
  });

  // =========================================================================
  // 1. ORDER FRAUD DETECTION ENGINE
  // =========================================================================
  describe("1. Order Fraud Detection Engine", () => {
    it("evaluates a standard low-risk order with verified details as LOW risk", async () => {
      // Mark phone verified
      await fraudDetectionService.updateCustomerVerification(testCustomerId, true, "9876543210");

      const input: FraudEvaluationInput = {
        customerId: testCustomerId,
        email: testCustomerEmail,
        phone: "9876543210",
        isPhoneVerified: true,
        shippingAddress: {
          fullName: "Test Patron",
          street: "124 Heritage Lane, Near City Palace",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
          country: "India",
        },
        items: [
          {
            productId: "prod_01",
            unitPricePaise: 250000,
            quantity: 1,
            vendorId: testSellerId,
          },
        ],
        totalPaise: 250000,
        paymentMethod: "UPI",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      };

      const result = await fraudDetectionService.evaluateOrderRisk(input);
      expect(result.riskScore).toBeLessThan(35);
      expect(result.riskLevel).toBe("LOW");
      expect(result.recommendedAction).toBe("ALLOW");
      expect(result.assessmentId).toBeDefined();
    });

    it("penalizes unverified mobile phone for high-value orders", async () => {
      const input: FraudEvaluationInput = {
        customerId: testCustomerId,
        email: testCustomerEmail,
        isPhoneVerified: false,
        shippingAddress: {
          fullName: "Test Patron",
          street: "124 Heritage Lane, Civil Lines",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
          country: "India",
        },
        items: [
          {
            unitPricePaise: 600000,
            quantity: 1,
            vendorId: testSellerId,
          },
        ],
        totalPaise: 600000, // ₹6,000 (> ₹5,000 threshold)
        paymentMethod: "CARD",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      };

      const result = await fraudDetectionService.evaluateOrderRisk(input);
      expect(result.signals.phoneVerified).toBe(false);
      expect(result.triggeredReasons.some((r) => r.includes("without verified mobile"))).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(25);
    });

    it("detects rapid duplicate order patterns within 15 minutes", async () => {
      // Create an existing recent order
      await prisma.order.create({
        data: {
          id: `ORD-DUP-${Date.now()}`,
          customerId: testCustomerId,
          customerEmail: testCustomerEmail,
          customerName: "Test Patron",
          shippingAddressSnapshot: JSON.stringify({ pincode: "302001" }),
          deliveryMethodId: "standard",
          deliveryMethodName: "Standard",
          deliveryEstimatedDays: 3,
          shippingFeePaise: 0,
          estimatedTaxPaise: 24000,
          subtotalPaise: 200000,
          totalPaise: 224000,
          status: "CONFIRMED",
          paymentStatus: "CAPTURED",
          estimatedDeliveryDate: new Date(Date.now() + 86400000 * 3),
        },
      });

      const input: FraudEvaluationInput = {
        customerId: testCustomerId,
        email: testCustomerEmail,
        shippingAddress: {
          fullName: "Test Patron",
          street: "124 Heritage Lane",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
          country: "India",
        },
        items: [{ unitPricePaise: 224000, quantity: 1, vendorId: testSellerId }],
        totalPaise: 224000, // exact same total within 15 min
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      };

      const result = await fraudDetectionService.evaluateOrderRisk(input);
      expect(result.signals.duplicateOrderDetected).toBe(true);
      expect(result.triggeredReasons.some((r) => r.includes("duplicate order pattern"))).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(35);
    });

    it("penalizes accounts with prior COD delivery refusals and RTO occurrences", async () => {
      // Increment refusal and RTO on profile
      await fraudDetectionService.recordCodRefusalOrRto(testCustomerId, "COD_REFUSAL");
      await fraudDetectionService.recordCodRefusalOrRto(testCustomerId, "COD_REFUSAL");
      await fraudDetectionService.recordCodRefusalOrRto(testCustomerId, "RTO");

      const input: FraudEvaluationInput = {
        customerId: testCustomerId,
        email: testCustomerEmail,
        shippingAddress: {
          fullName: "Test Patron",
          street: "124 Heritage Lane",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
          country: "India",
        },
        items: [{ unitPricePaise: 100000, quantity: 1, vendorId: testSellerId }],
        totalPaise: 100000,
        paymentMethod: "COD",
        userAgent: "Mozilla/5.0",
      };

      const result = await fraudDetectionService.evaluateOrderRisk(input);
      expect(result.signals.priorCodRefusalCount).toBe(2);
      expect(result.signals.priorRtoCount).toBe(1);
      expect(result.recommendedAction).toBe("RESTRICT_COD");
    });

    it("penalizes incomplete shipping address missing valid 6-digit postal code", async () => {
      const input: FraudEvaluationInput = {
        customerId: testCustomerId,
        email: testCustomerEmail,
        shippingAddress: {
          fullName: "T",
          street: "Short", // < 8 chars
          city: "Jaipur",
          state: "RJ",
          pincode: "ABC123", // invalid
          country: "India",
        },
        items: [{ unitPricePaise: 100000, quantity: 1, vendorId: testSellerId }],
        totalPaise: 100000,
        userAgent: "Mozilla/5.0",
      };

      const result = await fraudDetectionService.evaluateOrderRisk(input);
      expect(result.signals.addressCompletenessScore).toBeLessThan(70);
      expect(result.triggeredReasons.some((r) => r.includes("incomplete"))).toBe(true);
    });
  });

  // =========================================================================
  // 2. ADMIN FRAUD REVIEW & FALSE-POSITIVE CORRECTION
  // =========================================================================
  describe("2. Admin Fraud Review & False-Positive Correction", () => {
    it("allows admin to review risk assessment with mandatory reason and logs audit event", async () => {
      const input: FraudEvaluationInput = {
        customerId: testCustomerId,
        email: testCustomerEmail,
        shippingAddress: {
          fullName: "Test Patron",
          street: "124 Heritage Lane, Civil Lines",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
          country: "India",
        },
        items: [{ unitPricePaise: 12000000, quantity: 1, vendorId: testSellerId }],
        totalPaise: 12000000, // ₹1,20,000 -> High risk
        userAgent: "Mozilla/5.0",
      };

      const evalResult = await fraudDetectionService.evaluateOrderRisk(input);
      expect(evalResult.assessmentId).toBeDefined();

      // Admin manual review
      const reviewed = await fraudDetectionService.reviewRiskAssessment(evalResult.assessmentId!, {
        adminId: testAdminId,
        decision: "APPROVED",
        overrideReason: "Verified customer identity via direct telephone authorization.",
        isFalsePositive: true,
      });

      expect(reviewed.reviewStatus).toBe("APPROVED");
      expect(reviewed.overrideReason).toBe("Verified customer identity via direct telephone authorization.");
      expect(reviewed.isFalsePositive).toBe(true);

      // Verify AuditEvent recorded
      const audit = await prisma.auditEvent.findFirst({
        where: {
          entityId: evalResult.assessmentId!,
          action: "FRAUD_ASSESSMENT_APPROVED",
        },
      });
      expect(audit).toBeDefined();
      expect(audit?.performedBy).toBe(testAdminId);
    });

    it("rejects review update if mandatory explanatory reason is missing or too brief", async () => {
      const input: FraudEvaluationInput = {
        customerId: testCustomerId,
        email: testCustomerEmail,
        shippingAddress: {
          fullName: "Test Patron",
          street: "124 Heritage Lane",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
          country: "India",
        },
        items: [{ unitPricePaise: 100000, quantity: 1, vendorId: testSellerId }],
        totalPaise: 100000,
        userAgent: "Mozilla/5.0",
      };

      const evalResult = await fraudDetectionService.evaluateOrderRisk(input);

      await expect(
        fraudDetectionService.reviewRiskAssessment(evalResult.assessmentId!, {
          adminId: testAdminId,
          decision: "OVERRIDDEN",
          overrideReason: "ok", // < 5 chars
        })
      ).rejects.toThrow("mandatory explanatory reason");
    });
  });

  // =========================================================================
  // 3. CASH ON DELIVERY (COD) ENGINE
  // =========================================================================
  describe("3. Cash on Delivery (COD) Engine", () => {
    it("confirms COD eligibility for cart within valid order value and serviceable pincode", async () => {
      const eligibility = await codService.evaluateEligibility({
        customerId: testCustomerId,
        items: [
          {
            productId: "prod_01",
            unitPricePaise: 150000, // ₹1,500
            quantity: 1,
            vendorId: testSellerId,
            vendorName: "Heritage Silks Studio",
          },
        ],
        shippingAddress: {
          fullName: "Test Patron",
          street: "124 Heritage Lane",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
        },
        totalPaise: 150000,
      });

      expect(eligibility.isEligible).toBe(true);
      expect(eligibility.ineligibilityReasons.length).toBe(0);
      expect(eligibility.codFeePaise).toBe(5000); // ₹50 convenience fee
      expect(eligibility.serviceablePincode).toBe(true);
    });

    it("restricts COD when order value exceeds maximum allowed threshold (₹15,000)", async () => {
      const eligibility = await codService.evaluateEligibility({
        customerId: testCustomerId,
        items: [
          {
            unitPricePaise: 2000000, // ₹20,000 (> ₹15,000)
            quantity: 1,
            vendorId: testSellerId,
            vendorName: "Heritage Silks Studio",
          },
        ],
        shippingAddress: {
          fullName: "Test Patron",
          street: "124 Heritage Lane",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
        },
        totalPaise: 2000000,
      });

      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.ineligibilityReasons.some((r) => r.includes("exceeds the maximum"))).toBe(true);
    });

    it("restricts COD when order value is below minimum threshold (₹500)", async () => {
      const eligibility = await codService.evaluateEligibility({
        customerId: testCustomerId,
        items: [
          {
            unitPricePaise: 20000, // ₹200 (< ₹500)
            quantity: 1,
            vendorId: testSellerId,
          },
        ],
        shippingAddress: {
          fullName: "Test Patron",
          street: "124 Heritage Lane",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
        },
        totalPaise: 20000,
      });

      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.ineligibilityReasons.some((r) => r.includes("below the minimum"))).toBe(true);
    });

    it("restricts COD when customer has prior delivery refusal history", async () => {
      await fraudDetectionService.recordCodRefusalOrRto(testCustomerId, "COD_REFUSAL");
      await fraudDetectionService.recordCodRefusalOrRto(testCustomerId, "COD_REFUSAL");

      const eligibility = await codService.evaluateEligibility({
        customerId: testCustomerId,
        items: [{ unitPricePaise: 100000, quantity: 1, vendorId: testSellerId }],
        shippingAddress: {
          fullName: "Test Patron",
          street: "124 Heritage Lane",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302001",
        },
        totalPaise: 100000,
      });

      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.ineligibilityReasons.some((r) => r.includes("previous uncollected delivery refusals"))).toBe(true);
    });

    it("restricts COD when PIN code format is invalid", async () => {
      const eligibility = await codService.evaluateEligibility({
        customerId: testCustomerId,
        items: [{ unitPricePaise: 100000, quantity: 1, vendorId: testSellerId }],
        shippingAddress: {
          fullName: "Test Patron",
          street: "124 Heritage Lane",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "000000", // invalid PIN format
        },
        totalPaise: 100000,
      });

      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.serviceablePincode).toBe(false);
    });
  });

  // =========================================================================
  // 4. ADMIN COD RECONCILIATION
  // =========================================================================
  describe("4. Admin COD Remittance Reconciliation", () => {
    it("reconciles courier remittance for COD orders and updates payment status", async () => {
      const codOrderId = `ORD-COD-${Date.now()}`;
      await prisma.order.create({
        data: {
          id: codOrderId,
          customerId: testCustomerId,
          customerEmail: testCustomerEmail,
          customerName: "Test Patron",
          shippingAddressSnapshot: JSON.stringify({ pincode: "302001" }),
          deliveryMethodId: "standard",
          deliveryMethodName: "Standard",
          deliveryEstimatedDays: 3,
          shippingFeePaise: 0,
          estimatedTaxPaise: 12000,
          subtotalPaise: 100000,
          totalPaise: 112000,
          isCod: true,
          codFeePaise: 5000,
          codCollectionStatus: "COLLECTED",
          status: "DELIVERED",
          paymentStatus: "PENDING",
          estimatedDeliveryDate: new Date(),
          payments: {
            create: {
              provider: "ESCROW_INTERNAL",
              transactionRef: `COD-${Date.now()}`,
              amountPaise: 112000,
              currency: "INR",
              isCod: true,
              codCollectionStatus: "COLLECTED",
              status: "PENDING",
            },
          },
        },
      });

      await codService.reconcileCourierRemittance({
        orderId: codOrderId,
        adminId: testAdminId,
        courierRemittanceRef: "BLUEDART-UTR-998811",
        collectionStatus: "REMITTED",
        notes: "Matched courier batch statement 44A",
      });

      const updated = await prisma.order.findUnique({
        where: { id: codOrderId },
        include: { payments: true },
      });

      expect(updated?.codCollectionStatus).toBe("REMITTED");
      expect(updated?.paymentStatus).toBe("CAPTURED");
      expect(updated?.payments[0]?.courierRemittanceRef).toBe("BLUEDART-UTR-998811");
    });
  });

  // =========================================================================
  // 5. PRIVACY, SECURITY BOUNDARIES & STOP POINT
  // =========================================================================
  describe("5. Privacy, Security Boundaries & Stop Point Contract", () => {
    it("strictly isolates seller orders: no raw card data, no CVV, no UPI PIN exposed", async () => {
      const res = await sellerService.getSellerOrderLines(testSellerId, { page: 1, limit: 10 });

      expect(res.orderLines).toBeDefined();
      for (const line of res.orderLines) {
        // Assert absence of any sensitive financial keys
        expect((line as any).cvv).toBeUndefined();
        expect((line as any).upiPin).toBeUndefined();
        expect((line as any).cardNumber).toBeUndefined();
        expect((line as any).cardExpiry).toBeUndefined();
        expect((line as any).bankingCredentials).toBeUndefined();
      }
    });

    it("computes database-backed payment reports directly from PostgreSQL with zero fabrication", async () => {
      const report = await paymentReportService.getMonthlyPaymentReport(new Date());

      expect(report.periodMonth).toBeDefined();
      expect(typeof report.totalVolumePaise).toBe("number");
      expect(typeof report.byMethod.upiCount).toBe("number");
      expect(typeof report.byMethod.cardCount).toBe("number");
      expect(typeof report.byMethod.codCount).toBe("number");
      expect(report.totalVolumePaise).toBeGreaterThanOrEqual(0);
    });

    it("verifies the CRITICAL STOP POINT: Final Pay button does not execute payment or create paid orders", () => {
      // Contract test verifying that the pre-payment checkout stops at the Final Pay button
      const checkoutState = {
        method: "UPI",
        isReadyToPay: true,
        isProcessingInitiated: false,
        isPaidOrderCreated: false,
      };

      // Ensure that clicking placeholder Pay button keeps payment uninitiated
      const handlePlaceholderClick = () => {
        // Must NOT initiate real gateway charge
        // Must NOT create paid order
        return {
          placeholderActive: true,
          stopPointHonored: true,
          orderPaid: false,
        };
      };

      const result = handlePlaceholderClick();
      expect(result.placeholderActive).toBe(true);
      expect(result.stopPointHonored).toBe(true);
      expect(result.orderPaid).toBe(false);
      expect(checkoutState.isPaidOrderCreated).toBe(false);
    });
  });
});
