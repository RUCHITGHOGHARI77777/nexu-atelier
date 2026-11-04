import { describe, it, expect } from "vitest";
import {
  calculateSupplierProfitAndLoss,
  SupplierCostInputs,
} from "../supplier-costing";
import { lookupHsn, suggestGstRateForHsn } from "../tax-hsn-directory";

describe("NEXU ATELIER — Supplier Costing, GST & Profit/Loss Engine", () => {
  const baseDefaultInputs: SupplierCostInputs = {
    purchaseCostINR: 0,
    manufacturingCostINR: 0,
    rawMaterialCostINR: 0,
    labourCostINR: 0,
    packagingMaterialINR: 0,
    labellingINR: 0,
    handlingINR: 0,
    qualityInspectionINR: 0,
    warehouseExpensesINR: 0,
    inwardTransportINR: 0,
    supplierToWarehouseShippingINR: 0,
    outwardCourierCostINR: 0,
    transitInsuranceINR: 0,
    shippingPaidBy: "SELLER",
    customerShippingFeeINR: 0,
    marketingExpensesINR: 0,
    photographyCostAllocationINR: 0,
    additionalOperatingExpensesINR: 0,
    customExpenses: [],
    priceMode: "EXCLUSIVE",
    sellingPriceINR: 1000,
    discountPercent: 0,
    taxRatePercent: 12.0,
    supplyType: "INTRA_STATE",
    platformCommissionPercent: 10.0,
    paymentProcessingPercent: 2.0,
  };

  describe("Official Statutory GST Calculation Verification (Mode A: Exclusive)", () => {
    it("Mode A (5%): ₹1,000 taxable -> Tax ₹50, Total ₹1,050", () => {
      const res = calculateSupplierProfitAndLoss({
        ...baseDefaultInputs,
        priceMode: "EXCLUSIVE",
        sellingPriceINR: 1000,
        taxRatePercent: 5.0,
      });

      expect(res.taxableSellingPricePaise).toBe(100000); // ₹1,000.00
      expect(res.outputGstPaise).toBe(5000); // ₹50.00
      expect(res.customerFinalPricePaise).toBe(105000); // ₹1,050.00
      expect(res.cgstPaise).toBe(2500); // ₹25.00
      expect(res.sgstPaise).toBe(2500); // ₹25.00
    });

    it("Mode A (12%): ₹1,000 taxable -> Tax ₹120, Total ₹1,120", () => {
      const res = calculateSupplierProfitAndLoss({
        ...baseDefaultInputs,
        priceMode: "EXCLUSIVE",
        sellingPriceINR: 1000,
        taxRatePercent: 12.0,
      });

      expect(res.taxableSellingPricePaise).toBe(100000); // ₹1,000.00
      expect(res.outputGstPaise).toBe(12000); // ₹120.00
      expect(res.customerFinalPricePaise).toBe(112000); // ₹1,120.00
      expect(res.cgstPaise).toBe(6000); // ₹60.00
      expect(res.sgstPaise).toBe(6000); // ₹60.00
    });

    it("Mode A (18%): ₹1,000 taxable -> Tax ₹180, Total ₹1,180", () => {
      const res = calculateSupplierProfitAndLoss({
        ...baseDefaultInputs,
        priceMode: "EXCLUSIVE",
        sellingPriceINR: 1000,
        taxRatePercent: 18.0,
      });

      expect(res.taxableSellingPricePaise).toBe(100000); // ₹1,000.00
      expect(res.outputGstPaise).toBe(18000); // ₹180.00
      expect(res.customerFinalPricePaise).toBe(118000); // ₹1,180.00
      expect(res.cgstPaise).toBe(9000); // ₹90.00
      expect(res.sgstPaise).toBe(9000); // ₹90.00
    });
  });

  describe("Official Statutory GST Calculation Verification (Mode B: Inclusive)", () => {
    it("Mode B (5%): ₹1,000 inclusive -> Taxable ₹952.38, Tax ₹47.62", () => {
      const res = calculateSupplierProfitAndLoss({
        ...baseDefaultInputs,
        priceMode: "INCLUSIVE",
        sellingPriceINR: 1000,
        taxRatePercent: 5.0,
      });

      expect(res.taxableSellingPricePaise).toBe(95238); // ₹952.38
      expect(res.outputGstPaise).toBe(4762); // ₹47.62
      expect(res.customerFinalPricePaise).toBe(100000); // ₹1,000.00
      expect(res.taxableSellingPricePaise + res.outputGstPaise).toBe(100000);
    });

    it("Mode B (12%): ₹1,000 inclusive -> Taxable ₹892.86, Tax ₹107.14", () => {
      const res = calculateSupplierProfitAndLoss({
        ...baseDefaultInputs,
        priceMode: "INCLUSIVE",
        sellingPriceINR: 1000,
        taxRatePercent: 12.0,
      });

      expect(res.taxableSellingPricePaise).toBe(89286); // ₹892.86
      expect(res.outputGstPaise).toBe(10714); // ₹107.14
      expect(res.customerFinalPricePaise).toBe(100000); // ₹1,000.00
      expect(res.taxableSellingPricePaise + res.outputGstPaise).toBe(100000);
    });

    it("Mode B (18%): ₹1,000 inclusive -> Taxable ₹847.46, Tax ₹152.54", () => {
      const res = calculateSupplierProfitAndLoss({
        ...baseDefaultInputs,
        priceMode: "INCLUSIVE",
        sellingPriceINR: 1000,
        taxRatePercent: 18.0,
      });

      expect(res.taxableSellingPricePaise).toBe(84746); // ₹847.46
      expect(res.outputGstPaise).toBe(15254); // ₹152.54
      expect(res.customerFinalPricePaise).toBe(100000); // ₹1,000.00
      expect(res.taxableSellingPricePaise + res.outputGstPaise).toBe(100000);
    });
  });

  describe("Complete Cost Breakdown & Profit Margin Integrity", () => {
    it("accurately calculates direct product costs and net contribution profit", () => {
      const realisticInputs: SupplierCostInputs = {
        purchaseCostINR: 1200,
        manufacturingCostINR: 300,
        rawMaterialCostINR: 200,
        labourCostINR: 150,
        packagingMaterialINR: 80,
        labellingINR: 20,
        handlingINR: 30,
        qualityInspectionINR: 20,
        warehouseExpensesINR: 50,
        inwardTransportINR: 60,
        supplierToWarehouseShippingINR: 40,
        outwardCourierCostINR: 150,
        transitInsuranceINR: 20,
        shippingPaidBy: "SELLER",
        customerShippingFeeINR: 0,
        marketingExpensesINR: 100,
        photographyCostAllocationINR: 50,
        additionalOperatingExpensesINR: 50,
        customExpenses: [
          { id: "1", name: "Custom Thread Dyeing", amountINR: 80, allocation: "PER_UNIT" },
          { id: "2", name: "Batch Loom Calibration", amountINR: 1000, allocation: "PER_BATCH", batchUnits: 50 }, // 20 per unit
        ],
        priceMode: "EXCLUSIVE",
        sellingPriceINR: 4500,
        discountPercent: 10, // 10% discount -> net taxable ₹4,050
        taxRatePercent: 12.0,
        supplyType: "INTRA_STATE",
        platformCommissionPercent: 10.0,
        paymentProcessingPercent: 2.0,
      };

      const res = calculateSupplierProfitAndLoss(realisticInputs);

      // Procurement: 1200 + 300 + 200 + 150 = 1850 -> 185000 paise
      expect(res.procurementSubtotalPaise).toBe(185000);
      // Packaging: 80 + 20 + 30 + 20 + 50 = 200 -> 20000 paise
      expect(res.packagingSubtotalPaise).toBe(20000);
      // Inward Transport: 60 + 40 = 100 -> 10000 paise
      expect(res.inwardTransportSubtotalPaise).toBe(10000);
      // Direct Product Cost: 1850 + 200 + 100 = 2150 -> 215000 paise
      expect(res.directProductCostPaise).toBe(215000);

      // Outward shipping: 150 + 20 = 170 -> 17000 paise
      expect(res.sellerBorneShippingPaise).toBe(17000);

      // Other expenses: 100 + 50 + 50 + 80 + 20 = 300 -> 30000 paise
      expect(res.otherExpensesSubtotalPaise).toBe(30000);

      // Total seller cost: 215000 + 17000 + 30000 = 262000 paise (₹2,620)
      expect(res.totalSellerCostPaise).toBe(262000);

      // Taxable price: 4500 - 10% = 4050 -> 405000 paise
      expect(res.taxableSellingPricePaise).toBe(405000);

      // GST: 12% of 4050 = 486 -> 48600 paise
      expect(res.outputGstPaise).toBe(48600);
      expect(res.customerFinalPricePaise).toBe(453600); // 405000 + 48600 = ₹4,536

      // Commission: 10% of 4050 = 405 -> 40500 paise
      expect(res.platformCommissionPaise).toBe(40500);

      // Gateway fee: 2% of 4536 = 90.72 -> 9072 paise
      expect(res.paymentGatewayFeePaise).toBe(9072);

      // Estimated payout: 405000 - 40500 - 9072 - 17000 = 338428 paise (₹3,384.28)
      expect(res.estimatedSellerPayoutPaise).toBe(338428);

      // Contribution profit: 405000 - 262000 (total cost) - 40500 (commission) - 9072 (fee) = 93428 paise (₹934.28)
      expect(res.estimatedContributionProfitPaise).toBe(93428);

      // Margin % = (93428 / 405000) * 100 = 23.07%
      expect(res.profitMarginPercent).toBe(23.07);
      expect(res.isLoss).toBe(false);
      expect(res.isLowMargin).toBe(false);
    });

    it("triggers critical loss warning when selling below total cost", () => {
      const lossInputs: SupplierCostInputs = {
        ...baseDefaultInputs,
        purchaseCostINR: 1500,
        outwardCourierCostINR: 200,
        shippingPaidBy: "SELLER",
        priceMode: "EXCLUSIVE",
        sellingPriceINR: 1200, // Selling at 1200 when cost is 1700!
        taxRatePercent: 12.0,
      };

      const res = calculateSupplierProfitAndLoss(lossInputs);
      expect(res.isLoss).toBe(true);
      expect(res.estimatedContributionProfitPaise).toBeLessThan(0);
      expect(res.warnings.some((w) => w.includes("CRITICAL LOSS WARNING"))).toBe(true);
    });
  });

  describe("HSN Directory & Notification 13/2025-Central Tax (Rate) Mapping", () => {
    it("suggests 12% for brass handicrafts under Notification 13/2025-CT(R)", () => {
      const brass = lookupHsn("7418");
      expect(brass).toBeDefined();
      expect(brass?.notificationRef).toContain("13/2025-Central Tax (Rate)");
      expect(brass?.defaultRatePercent).toBe(12.0);
      expect(brass?.isHandicraftEligible).toBe(true);
    });

    it("suggests 5% for silk fabrics (HSN 5007)", () => {
      const silk = lookupHsn("5007");
      expect(silk).toBeDefined();
      expect(silk?.defaultRatePercent).toBe(5.0);
    });

    it("suggests 18% for high-fidelity acoustics (HSN 8518)", () => {
      const audio = lookupHsn("8518");
      expect(audio).toBeDefined();
      expect(audio?.defaultRatePercent).toBe(18.0);
      expect(audio?.isHandicraftEligible).toBe(false);
    });

    it("applies value threshold rule for apparel HSN 6204", () => {
      const belowThresh = suggestGstRateForHsn("6204", 850);
      expect(belowThresh.ratePercent).toBe(5.0);

      const aboveThresh = suggestGstRateForHsn("6204", 3500);
      expect(aboveThresh.ratePercent).toBe(12.0);
    });
  });
});
