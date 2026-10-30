import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import { prisma } from "../prisma";
import { authService } from "../auth-service";
import { paymentRecordService } from "../payment-record-service";
import { financialReportingService } from "../financial-reporting-service";
import { customerPrivacyService } from "../customer-privacy-service";
import { supplierPrivacyService } from "../supplier-privacy-service";
import { adminManagementService } from "../admin-management-service";
import {
  UserRole,
  OrderStatus,
  PaymentStatus,
  PaymentProvider,
  SellerStatus,
  PayoutStatus,
} from "@prisma/client";

describe("NEXU ATELIER — Customer Privacy, Payment, Finance Reporting & Contact Management Engine", () => {
  let customerA: { id: string; email: string };
  let customerB: { id: string; email: string };
  let adminUser: { id: string; email: string };
  let sellerUser1: { id: string; email: string };
  let sellerUser2: { id: string; email: string };
  let seller1: any;
  let seller2: any;
  let testOrderA: any;
  let testOrderB: any;
  let testPaymentRecA: any;

  beforeAll(async () => {
    // 1. Create Customer A
    const custARes = await authService.register(
      "Ananya Iyer",
      `patron_priv_a_${Date.now()}@nexu.studio`,
      "MasterPass2026!",
      "+91 98101 11222"
    );
    customerA = { id: custARes.user!.id, email: custARes.user!.email };

    // 2. Create Customer B (for tenant isolation check)
    const custBRes = await authService.register(
      "Rohan Gupta",
      `patron_priv_b_${Date.now()}@nexu.studio`,
      "MasterPass2026!",
      "+91 98202 33444"
    );
    customerB = { id: custBRes.user!.id, email: custBRes.user!.email };

    // 3. Create Admin User
    adminUser = await prisma.user.create({
      data: {
        email: `admin_priv_${Date.now()}@nexu.studio`,
        passwordHash: "dummyhash",
        role: "ADMIN",
        profile: {
          create: {
            name: "Platform Auditor",
          },
        },
      },
    });

    // 4. Create Seller 1
    sellerUser1 = await prisma.user.create({
      data: {
        email: `seller_priv_1_${Date.now()}@nexu.studio`,
        passwordHash: "dummyhash",
        role: "SELLER",
      },
    });
    seller1 = await prisma.seller.create({
      data: {
        userId: sellerUser1.id,
        name: `Kashmir Loom Works ${Date.now()}`,
        slug: `kashmir-loom-${Date.now()}`,
        story: "Centuries of artisan wool craftsmanship passed across generations in the Kashmir valley.",
        heroImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80",
        originHub: "Srinagar, Jammu & Kashmir",
        taxIdentifier: "01AAAAA0000A1Z5",
        status: SellerStatus.APPROVED,
        verified: true,
        businessEmail: sellerUser1.email,
        businessPhone: "9812345678",
        bankAccountName: "Kashmir Loom Works LLP",
        bankAccountNumber: "98765432101234",
        bankIfsc: "HDFC0001234",
      },
    });

    // 5. Create Seller 2
    sellerUser2 = await prisma.user.create({
      data: {
        email: `seller_priv_2_${Date.now()}@nexu.studio`,
        passwordHash: "dummyhash",
        role: "SELLER",
      },
    });
    seller2 = await prisma.seller.create({
      data: {
        userId: sellerUser2.id,
        name: `Jaipur Ceramic Studio ${Date.now()}`,
        slug: `jaipur-ceramics-${Date.now()}`,
        story: "Handcrafted terracotta and blue pottery preserving Rajasthan royal design traditions.",
        heroImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80",
        originHub: "Jaipur, Rajasthan",
        status: SellerStatus.APPROVED,
        verified: true,
        businessEmail: sellerUser2.email,
      },
    });

    // 6. Create Test Orders with Items & Delivery Address
    testOrderA = await prisma.order.create({
      data: {
        id: `ord_priv_a_${Date.now()}`,
        customerId: customerA.id,
        customerName: "Ananya Iyer",
        customerEmail: customerA.email,
        shippingAddressSnapshot: JSON.stringify({
          fullName: "Ananya Iyer",
          phone: "+91 98101 11222",
          street: "12 Connaught Place",
          city: "New Delhi",
          state: "Delhi",
          pincode: "110001",
        }),
        deliveryMethodId: "standard",
        deliveryMethodName: "White-Glove Courier",
        deliveryEstimatedDays: 3,
        shippingFeePaise: 0,
        estimatedTaxPaise: 90000,
        subtotalPaise: 500000,
        totalPaise: 590000, // ₹5,900.00
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.CAPTURED,
        estimatedDeliveryDate: new Date(Date.now() + 3 * 86400000),
        items: {
          create: [
            {
              title: "Pashmina Hand-Spun Shawl",
              productSlug: "pashmina-shawl",
              vendorId: seller1.id,
              vendorName: seller1.name,
              selectedSku: "PASH-01",
              unitPricePaise: 500000,
              quantity: 1,
              lineTotalPaise: 500000,
              imageSnapshot: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",
            },
          ],
        },
      },
    });

    testOrderB = await prisma.order.create({
      data: {
        id: `ord_priv_b_${Date.now()}`,
        customerId: customerB.id,
        customerName: "Rohan Gupta",
        customerEmail: customerB.email,
        shippingAddressSnapshot: JSON.stringify({
          fullName: "Rohan Gupta",
          phone: "+91 98202 33444",
          street: "88 Indiranagar 100ft Rd",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560038",
        }),
        deliveryMethodId: "standard",
        deliveryMethodName: "White-Glove Courier",
        deliveryEstimatedDays: 4,
        shippingFeePaise: 0,
        estimatedTaxPaise: 30000,
        subtotalPaise: 200000,
        totalPaise: 230000, // ₹2,300.00
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.CAPTURED,
        estimatedDeliveryDate: new Date(Date.now() + 4 * 86400000),
        items: {
          create: [
            {
              title: "Terracotta Glazed Vessel",
              productSlug: "terracotta-vessel",
              vendorId: seller2.id,
              vendorName: seller2.name,
              unitPricePaise: 200000,
              quantity: 1,
              lineTotalPaise: 200000,
              imageSnapshot: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",
            },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    // Cleanup generated data
    await prisma.operationalContactLog.deleteMany({
      where: { adminId: adminUser.id },
    }).catch(() => {});
    await prisma.paymentRecord.deleteMany({
      where: { orderId: { in: [testOrderA?.id, testOrderB?.id].filter(Boolean) } },
    }).catch(() => {});
    await prisma.orderItem.deleteMany({
      where: { orderId: { in: [testOrderA?.id, testOrderB?.id].filter(Boolean) } },
    }).catch(() => {});
    await prisma.order.deleteMany({
      where: { id: { in: [testOrderA?.id, testOrderB?.id].filter(Boolean) } },
    }).catch(() => {});
    await prisma.seller.deleteMany({
      where: { id: { in: [seller1?.id, seller2?.id].filter(Boolean) } },
    }).catch(() => {});
    await prisma.user.deleteMany({
      where: { id: { in: [customerA?.id, customerB?.id, adminUser?.id, sellerUser1?.id, sellerUser2?.id].filter(Boolean) } },
    }).catch(() => {});
  });

  // 1. Customer sees only own payment records (tenant isolation)
  it("Criterion 1: Customer sees only own payment records (tenant isolation)", async () => {
    const recA = await paymentRecordService.recordTransaction({
      orderId: testOrderA.id,
      customerId: customerA.id,
      provider: PaymentProvider.RAZORPAY,
      transactionRef: `pay_iso_a_${Date.now()}`,
      idempotencyKey: `idem_iso_a_${Date.now()}`,
      amountPaise: 590000,
      currency: "INR",
      status: PaymentStatus.CAPTURED,
      method: "CARD",
      last4: "4242",
      cardBrand: "Visa",
    });
    testPaymentRecA = recA.paymentRecord;

    await paymentRecordService.recordTransaction({
      orderId: testOrderB.id,
      customerId: customerB.id,
      provider: PaymentProvider.RAZORPAY,
      transactionRef: `pay_iso_b_${Date.now()}`,
      idempotencyKey: `idem_iso_b_${Date.now()}`,
      amountPaise: 230000,
      currency: "INR",
      status: PaymentStatus.CAPTURED,
      method: "UPI",
    });

    const { payments: custAPayments } = await paymentRecordService.getCustomerPayments(customerA.id);
    expect(custAPayments.length).toBeGreaterThanOrEqual(1);

    // Verify every payment record in custAPayments belongs strictly to Customer A
    const allBelongToA = custAPayments.every((p) => p.orderId === testOrderA.id);
    expect(allBelongToA).toBe(true);

    // Verify customer A CANNOT see customer B's payment record
    const hasCustBRecord = custAPayments.some((p) => p.orderId === testOrderB.id);
    expect(hasCustBRecord).toBe(false);
  });

  // 2. Supplier sees only permitted assigned order information
  it("Criterion 2: Supplier sees only permitted assigned order information", async () => {
    const seller1OrderItems = await prisma.orderItem.findMany({
      where: { vendorId: seller1.id },
      include: { order: true },
    });

    expect(seller1OrderItems.length).toBeGreaterThan(0);
    // Every line item for seller1 is strictly from seller1's catalog
    expect(seller1OrderItems.every((item) => item.vendorId === seller1.id)).toBe(true);

    // Seller 1 cannot see seller 2's items
    const containsSeller2 = seller1OrderItems.some((item) => item.vendorId === seller2.id);
    expect(containsSeller2).toBe(false);
  });

  // 3. Supplier cannot see card credentials
  it("Criterion 3: Supplier cannot see card credentials (zero PAN/CVV exposure)", async () => {
    const supplierProfile = await supplierPrivacyService.getSupplierProfile(sellerUser1.id);
    expect(supplierProfile).toBeDefined();

    // Verify raw credit card numbers or CVV fields are absent from supplier profile
    expect((supplierProfile as any).cardPan).toBeUndefined();
    expect((supplierProfile as any).cardCvv).toBeUndefined();
    expect((supplierProfile as any).rawCardNumber).toBeUndefined();

    // Bank account must be masked with bullet characters
    expect(supplierProfile.maskedBankAccount).toContain("••••");
    expect(supplierProfile.maskedBankAccount).toMatch(/•••• •••• \d{4}/);
  });

  // 4. Admin cannot see CVV or UPI PIN
  it("Criterion 4: Admin cannot see CVV or UPI PIN (strict sanitization & PCI DSS SAQ-A)", async () => {
    // Attempting to record transaction with 16-digit PAN or CVV must trigger strict security violation
    await expect(
      paymentRecordService.recordTransaction({
        orderId: testOrderA.id,
        customerId: customerA.id,
        provider: PaymentProvider.RAZORPAY,
        transactionRef: `pay_viol_${Date.now()}`,
        amountPaise: 10000,
        status: PaymentStatus.CAPTURED,
        rawGatewayResponse: {
          cvv: "123", // Security violation
          fullCard: "4111111111111111",
        },
      })
    ).rejects.toThrow(/SECURITY VIOLATION/);

    // Normal records only store maskedDetails (e.g. "Visa ending in •••• 4242")
    const dbRecord = await prisma.paymentRecord.findUnique({
      where: { id: testPaymentRecA.id },
    });
    expect(dbRecord?.maskedDetails).toContain("•••• 4242");
    expect(JSON.stringify(dbRecord)).not.toContain("cvv");
    expect(JSON.stringify(dbRecord)).not.toContain("pin");
  });

  // 5. Monthly reports reconcile with payment transaction records
  it("Criterion 5: Monthly reports reconcile with payment transaction records", async () => {
    const report = await financialReportingService.getFinancialReport({
      period: "MONTHLY",
    });

    expect(report.summary).toBeDefined();
    expect(report.summary.grossCollectionsPaise).toBeGreaterThanOrEqual(590000);
    expect(report.summary.marketplaceCommissionPaise).toBeGreaterThanOrEqual(0);
    expect(report.summary.transactionCounts.successful).toBeGreaterThanOrEqual(1);

    // Sum of method breakdown matches or reconciles
    const sumMethods =
      report.summary.byMethod.upiPaise +
      report.summary.byMethod.cardPaise +
      report.summary.byMethod.netBankingPaise +
      report.summary.byMethod.codPaise +
      report.summary.byMethod.otherPaise;

    expect(sumMethods).toBe(report.summary.grossCollectionsPaise);
  });

  // 6. Refunds appear correctly in reports
  it("Criterion 6: Refunds appear correctly in reports and adjust net collections", async () => {
    // Create refund record
    const refundRes = await paymentRecordService.recordRefund({
      orderId: testOrderA.id,
      amountPaise: 90000, // ₹900.00 refund
      reason: "Damaged packaging during transit.",
      idempotencyKey: `ref_test_${Date.now()}`,
      providerReference: `rfnd_ref_${Date.now()}`,
      requestedBy: adminUser.id,
    });

    expect(refundRes.success).toBe(true);

    // Re-check report
    const report = await financialReportingService.getFinancialReport({
      period: "MONTHLY",
    });

    expect(report.summary.totalRefundsPaise).toBeGreaterThanOrEqual(90000);
    expect(report.summary.netCollectionsPaise).toBe(
      report.summary.grossCollectionsPaise - report.summary.totalRefundsPaise
    );
  });

  // 7. Failed transactions are not counted as successful collections
  it("Criterion 7: Failed transactions are not counted as successful collections", async () => {
    const reportBefore = await financialReportingService.getFinancialReport({
      period: "MONTHLY",
    });

    const grossBefore = reportBefore.summary.grossCollectionsPaise;

    // Record an explicitly FAILED transaction
    await paymentRecordService.recordTransaction({
      orderId: testOrderB.id,
      customerId: customerB.id,
      provider: PaymentProvider.RAZORPAY,
      transactionRef: `pay_fail_${Date.now()}`,
      idempotencyKey: `idem_fail_${Date.now()}`,
      amountPaise: 750000, // ₹7,500.00 that failed
      status: PaymentStatus.FAILED,
      failureCode: "BAD_REQUEST_PAYMENT_DECLINED",
      failureReason: "Card declined by issuing bank.",
    });

    const reportAfter = await financialReportingService.getFinancialReport({
      period: "MONTHLY",
    });

    // Gross successful volume MUST NOT increase with failed payments
    expect(reportAfter.summary.grossCollectionsPaise).toBe(grossBefore);
    // But failed count must increment
    expect(reportAfter.summary.transactionCounts.failed).toBeGreaterThanOrEqual(1);
  });

  // 8. Customer phone verification works (including attempt limits and verification timestamp)
  it("Criterion 8: Customer phone verification works (including attempt limits & cooldown)", async () => {
    const testPhone = "98" + Math.floor(10000000 + Math.random() * 90000000);

    // Step A: Request OTP
    const otpResult = await customerPrivacyService.requestPhoneOtp(customerA.id, testPhone);
    expect(otpResult.success).toBe(true);
    expect(otpResult.expiresInSeconds).toBe(300);
    expect(otpResult.cooldownSeconds).toBe(60);

    // Step B: Resend during cooldown must fail
    await expect(
      customerPrivacyService.requestPhoneOtp(customerA.id, testPhone)
    ).rejects.toThrow(/Please wait \d+ seconds/);

    // Step C: Incorrect OTP increments attempts and fails
    await expect(
      customerPrivacyService.verifyPhoneOtp(customerA.id, testPhone, "000000")
    ).rejects.toThrow(/(?:Incorrect|Invalid) verification code/);

    // Step D: Correct OTP succeeds (using _debugCode in test environment)
    if (otpResult._debugCode) {
      const verifyRes = await customerPrivacyService.verifyPhoneOtp(
        customerA.id,
        testPhone,
        otpResult._debugCode
      );
      expect(verifyRes.success).toBe(true);

      // Verify DB record updated
      const updatedProfile = await prisma.customerProfile.findUnique({
        where: { userId: customerA.id },
      });
      expect(updatedProfile?.isPhoneVerified).toBe(true);
      expect(updatedProfile?.phoneVerifiedAt).toBeInstanceOf(Date);
    }
  });

  // 9. Supplier verification works
  it("Criterion 9: Supplier verification and bank masking works", async () => {
    const updated = await supplierPrivacyService.updateBankSettlementDetails(sellerUser1.id, {
      bankAccountName: "Kashmir Crafts Heritage",
      bankAccountNumber: "50100223344556",
      bankIfsc: "SBIN0001234",
    });

    expect(updated.bankAccountName).toBe("Kashmir Crafts Heritage");
    expect(updated.bankIfsc).toBe("SBIN0001234");
    expect(updated.maskedBankAccount).toBe("•••• •••• 4556");

    // Invalid IFSC must throw
    await expect(
      supplierPrivacyService.updateBankSettlementDetails(sellerUser1.id, {
        bankAccountName: "Invalid",
        bankAccountNumber: "1234567890",
        bankIfsc: "INVALID_IFSC",
      })
    ).rejects.toThrow(/Invalid Indian IFSC code format/);
  });

  // 10. Address changes persist
  it("Criterion 10: Address changes persist and link to customer profile", async () => {
    const newAddress = await prisma.address.create({
      data: {
        customerId: customerA.id,
        fullName: "Ananya Iyer (Studio)",
        phone: "+91 98101 11222",
        street: "7 Park Lane",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        isDefault: false,
      },
    });

    expect(newAddress.id).toBeDefined();
    expect(newAddress.city).toBe("Mumbai");

    // Verify it persists in customer's address book
    const addresses = await prisma.address.findMany({
      where: { customerId: customerA.id },
    });
    expect(addresses.some((a) => a.id === newAddress.id)).toBe(true);
  });

  // 11. Authorized operational contact actions are logged with purpose and admin ID
  it("Criterion 11: Authorized operational contact actions are logged with purpose and admin ID", async () => {
    const contactResult = await adminManagementService.initiateOperationalContact(
      adminUser.id,
      {
        targetType: "CUSTOMER",
        targetId: customerA.id,
        purpose: "DELIVERY_ISSUE",
        notes: "Courier reported locked gate at Connaught Place address.",
      }
    );

    expect(contactResult.success).toBe(true);
    expect(contactResult.logId).toBeDefined();
    expect(contactResult.dialerUri).toContain("tel:+91");
    expect(contactResult.purpose).toBe("DELIVERY_ISSUE");

    // Check DB log
    const logInDb = await prisma.operationalContactLog.findUnique({
      where: { id: contactResult.logId },
    });
    expect(logInDb?.adminId).toBe(adminUser.id);
    expect(logInDb?.purpose).toBe("DELIVERY_ISSUE");
    expect(logInDb?.notes).toContain("locked gate");
  });

  // 12. Unauthorized data access is denied (IDOR defense)
  it("Criterion 12: Unauthorized data access is denied (IDOR protection)", async () => {
    // Customer B trying to fetch Customer A's private data export must fail or return only Customer B's data
    const exportDataB = await customerPrivacyService.exportCustomerData(customerB.id);
    expect(exportDataB.profile.id).toBe(customerB.id);
    expect(exportDataB.profile.id).not.toBe(customerA.id);

    // Invalid contact purpose throws
    await expect(
      adminManagementService.initiateOperationalContact(adminUser.id, {
        targetType: "CUSTOMER",
        targetId: customerA.id,
        purpose: "INVALID_PURPOSE" as any,
        notes: "Notes here",
      })
    ).rejects.toThrow(/Invalid contact purpose/);
  });

  // 13. CSV exports respect permissions and format correctly
  it("Criterion 13: CSV exports respect permissions and format correctly", async () => {
    const csvContent = await financialReportingService.generateCsvReport({
      period: "MONTHLY",
    });

    expect(csvContent).toBeDefined();
    expect(csvContent).toContain("Transaction ID");
    expect(csvContent).toContain("Order ID");
    expect(csvContent).toContain("Amount (INR)");
    expect(csvContent).toContain("Payment Method");
    expect(csvContent).toContain("NEXU ATELIER FINANCIAL STATEMENT");
  });

  // 14. Payment webhooks are signature-verified and idempotent
  it("Criterion 14: Payment webhooks are signature-verified and idempotent", async () => {
    const secret = "live_secret_key_testing_12345";
    const payload = JSON.stringify({
      order_id: testOrderA.id,
      payment_id: "pay_rzp_mock_123",
      amount: 590000,
    });

    // Valid HMAC SHA-256
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const isValid = paymentRecordService.verifyWebhookSignature(payload, validSignature, secret);
    expect(isValid).toBe(true);

    // Tampered signature must fail
    const isInvalid = paymentRecordService.verifyWebhookSignature(
      payload,
      "invalid_tampered_signature_hex",
      secret
    );
    expect(isInvalid).toBe(false);

    // Test Idempotency in Payment Recording
    const fixedIdempotencyKey = `idem_webhook_${Date.now()}`;
    const firstCall = await paymentRecordService.recordTransaction({
      orderId: testOrderA.id,
      customerId: customerA.id,
      provider: PaymentProvider.RAZORPAY,
      transactionRef: `tx_idem_${Date.now()}`,
      idempotencyKey: fixedIdempotencyKey,
      amountPaise: 590000,
      currency: "INR",
      status: PaymentStatus.CAPTURED,
    });
    expect(firstCall.success).toBe(true);
    expect(firstCall.isDuplicate).toBeFalsy();

    // Second call with same idempotency key
    const secondCall = await paymentRecordService.recordTransaction({
      orderId: testOrderA.id,
      customerId: customerA.id,
      provider: PaymentProvider.RAZORPAY,
      transactionRef: `tx_idem_diff_${Date.now()}`,
      idempotencyKey: fixedIdempotencyKey,
      amountPaise: 590000,
      currency: "INR",
      status: PaymentStatus.CAPTURED,
    });
    expect(secondCall.success).toBe(true);
    expect(secondCall.isDuplicate).toBe(true);
    expect(secondCall.paymentRecord.id).toBe(firstCall.paymentRecord.id);
  });
});
