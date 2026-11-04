/**
 * NEXU ATELIER — Supplier Costing, GST & Profit/Loss Engine
 *
 * Core Principles:
 * 1. Integer paise arithmetic for all monetary values.
 * 2. Mode A: GST Exclusive (supplier enters taxable selling price).
 * 3. Mode B: GST Inclusive (supplier enters final customer price).
 * 4. Transparent Indian GST calculation (5%, 12%, 18%) with CGST/SGST vs IGST split.
 * 5. Distinct separation of:
 *    - Inward transport (supplier raw goods -> studio) vs Outward shipping (studio -> customer).
 *    - Seller-paid shipping vs Customer-paid shipping.
 *    - Output GST collected (payable to govt) vs Supplier net revenue vs Actual profit.
 *    - Platform commission & payment processing fee deductions.
 * 6. Mathematical precision: Zero floating point drift.
 */

export type GstPriceMode = "EXCLUSIVE" | "INCLUSIVE";
export type GstSupplyType = "INTRA_STATE" | "INTER_STATE";

export interface CustomExpenseRow {
  id: string;
  name: string;
  amountINR: number;
  allocation: "PER_UNIT" | "PER_BATCH";
  batchUnits?: number;
}

export interface SupplierCostInputs {
  // A. Product Procurement / Production
  purchaseCostINR: number;
  manufacturingCostINR: number;
  rawMaterialCostINR: number;
  labourCostINR: number;

  // B. Packaging and Handling
  packagingMaterialINR: number;
  labellingINR: number;
  handlingINR: number;
  qualityInspectionINR: number;
  warehouseExpensesINR: number;

  // C. Transport & Shipping
  inwardTransportINR: number;
  supplierToWarehouseShippingINR: number;
  outwardCourierCostINR: number;
  transitInsuranceINR: number;
  shippingPaidBy: "SELLER" | "CUSTOMER";
  customerShippingFeeINR: number; // If customer pays

  // D. Other Costs
  marketingExpensesINR: number;
  photographyCostAllocationINR: number;
  additionalOperatingExpensesINR: number;
  customExpenses: CustomExpenseRow[];

  // Commercial Pricing Inputs
  priceMode: GstPriceMode;
  sellingPriceINR: number; // In exclusive mode: taxable price; in inclusive mode: MRP / total price
  mrpBenchmarkINR?: number; // Optional compare-at MRP
  discountPercent: number; // Optional seller-funded discount
  taxRatePercent: number; // e.g. 5, 12, or 18
  supplyType: GstSupplyType; // INTRA_STATE (CGST+SGST) vs INTER_STATE (IGST)
  hsnCode?: string;

  // Platform Commission & Payment Processing Fee Overrides (Marketplace governed)
  platformCommissionPercent?: number; // Default 10.0%
  paymentProcessingPercent?: number; // Default 2.0% gateway fee
}

export interface CostCalculationResult {
  // Direct Production / Sourcing Cost
  procurementSubtotalPaise: number;
  packagingSubtotalPaise: number;
  inwardTransportSubtotalPaise: number;
  otherExpensesSubtotalPaise: number;
  directProductCostPaise: number; // Sum of procurement, packaging, labour, inward transport, direct rows

  // Shipping Treatment
  outwardCourierPaise: number;
  sellerBorneShippingPaise: number;
  customerPaidShippingPaise: number;

  // Taxable & Customer Price Breakdown
  priceMode: GstPriceMode;
  enteredPricePaise: number;
  sellerFundedDiscountPaise: number;
  taxableSellingPricePaise: number; // Net taxable amount (pre-GST)
  gstRatePercent: number;
  outputGstPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  customerFinalPricePaise: number; // What customer actually pays at checkout

  // Deductions & Marketplace Take
  platformCommissionPaise: number;
  paymentGatewayFeePaise: number;
  totalMarketplaceDeductionsPaise: number;

  // Net Seller Settlement & P&L
  estimatedSellerPayoutPaise: number; // Escrow settlement from marketplace to seller bank
  totalSellerCostPaise: number; // Direct cost + seller shipping + other allocated costs
  estimatedGrossProfitPaise: number; // Taxable selling price - direct product cost
  estimatedContributionProfitPaise: number; // Payout - total costs
  profitMarginPercent: number; // (Contribution Profit / Taxable Selling Price) * 100
  returnOnCostPercent: number; // (Contribution Profit / Total Cost) * 100

  // Break-Even & Suggestions
  breakEvenPricePaise: number; // Minimum taxable price where Contribution Profit == 0
  minRecommendedPricePaise: number; // Break-even + 15% safety margin
  alternativePricingScenarios: {
    label: string;
    sellingPricePaise: number;
    estimatedPayoutPaise: number;
    contributionProfitPaise: number;
    marginPercent: number;
  }[];

  // Warnings & Flags
  isBelowBreakEven: boolean;
  isLoss: boolean;
  isLowMargin: boolean; // < 10%
  isHighShipping: boolean; // shipping > 20% of product price
  warnings: string[];
}

/**
 * Standard integer paise rounding helper.
 */
function toPaise(inr: number): number {
  return Math.round((Number(inr) || 0) * 100);
}

function fromPaise(paise: number): number {
  return paise / 100;
}

/**
 * Interactive calculation function for supplier cost, GST, and profit/loss.
 */
export function calculateSupplierProfitAndLoss(inputs: SupplierCostInputs): CostCalculationResult {
  const commissionRate = inputs.platformCommissionPercent !== undefined ? inputs.platformCommissionPercent : 10.0;
  const paymentRate = inputs.paymentProcessingPercent !== undefined ? inputs.paymentProcessingPercent : 2.0;
  const taxRate = Number(inputs.taxRatePercent) || 12.0;

  // --- 1. A. Product Procurement / Production Subtotal ---
  const purchaseCostPaise = toPaise(inputs.purchaseCostINR);
  const manufacturingCostPaise = toPaise(inputs.manufacturingCostINR);
  const rawMaterialCostPaise = toPaise(inputs.rawMaterialCostINR);
  const labourCostPaise = toPaise(inputs.labourCostINR);
  const procurementSubtotalPaise = purchaseCostPaise + manufacturingCostPaise + rawMaterialCostPaise + labourCostPaise;

  // --- 2. B. Packaging and Handling Subtotal ---
  const packagingMaterialPaise = toPaise(inputs.packagingMaterialINR);
  const labellingPaise = toPaise(inputs.labellingINR);
  const handlingPaise = toPaise(inputs.handlingINR);
  const qualityInspectionPaise = toPaise(inputs.qualityInspectionINR);
  const warehouseExpensesPaise = toPaise(inputs.warehouseExpensesINR);
  const packagingSubtotalPaise =
    packagingMaterialPaise + labellingPaise + handlingPaise + qualityInspectionPaise + warehouseExpensesPaise;

  // --- 3. C. Transport & Shipping ---
  const inwardTransportPaise = toPaise(inputs.inwardTransportINR);
  const supplierToWarehousePaise = toPaise(inputs.supplierToWarehouseShippingINR);
  const inwardTransportSubtotalPaise = inwardTransportPaise + supplierToWarehousePaise;

  const outwardCourierPaise = toPaise(inputs.outwardCourierCostINR);
  const transitInsurancePaise = toPaise(inputs.transitInsuranceINR);
  const totalOutwardShippingPaise = outwardCourierPaise + transitInsurancePaise;

  const isSellerPaidShipping = inputs.shippingPaidBy === "SELLER";
  const sellerBorneShippingPaise = isSellerPaidShipping ? totalOutwardShippingPaise : 0;
  const customerPaidShippingPaise = !isSellerPaidShipping
    ? toPaise(inputs.customerShippingFeeINR || inputs.outwardCourierCostINR)
    : 0;

  // --- 4. D. Other Costs & Custom Rows ---
  const marketingPaise = toPaise(inputs.marketingExpensesINR);
  const photographyPaise = toPaise(inputs.photographyCostAllocationINR);
  const additionalOperatingPaise = toPaise(inputs.additionalOperatingExpensesINR);

  let customExpensesPaise = 0;
  if (Array.isArray(inputs.customExpenses)) {
    for (const row of inputs.customExpenses) {
      if (row.allocation === "PER_BATCH" && row.batchUnits && row.batchUnits > 0) {
        customExpensesPaise += Math.round(toPaise(row.amountINR) / row.batchUnits);
      } else {
        customExpensesPaise += toPaise(row.amountINR);
      }
    }
  }

  const otherExpensesSubtotalPaise = marketingPaise + photographyPaise + additionalOperatingPaise + customExpensesPaise;

  // Direct Product Cost (Base unit production cost excluding outward courier and marketplace commissions)
  const directProductCostPaise =
    procurementSubtotalPaise + packagingSubtotalPaise + inwardTransportSubtotalPaise;

  // --- 5. Pricing & GST Calculations (Mode A vs Mode B) ---
  const enteredPricePaise = toPaise(inputs.sellingPriceINR);
  let taxableSellingPricePaise = 0;
  let outputGstPaise = 0;
  let customerFinalPricePaise = 0;

  // Seller-funded discount calculation
  const discountPercent = Math.max(0, Math.min(100, Number(inputs.discountPercent) || 0));

  if (inputs.priceMode === "EXCLUSIVE") {
    // Mode A: GST Exclusive
    // Entered price is the taxable value before GST.
    // If discount exists, it reduces the taxable selling price.
    const undiscountedTaxablePaise = enteredPricePaise;
    const discountPaise = Math.round((undiscountedTaxablePaise * discountPercent) / 100);
    taxableSellingPricePaise = Math.max(0, undiscountedTaxablePaise - discountPaise);

    // GST = round(Taxable * rate / 100)
    outputGstPaise = Math.round((taxableSellingPricePaise * taxRate) / 100);
    customerFinalPricePaise = taxableSellingPricePaise + outputGstPaise + customerPaidShippingPaise;
  } else {
    // Mode B: GST Inclusive
    // Entered price is the final price including GST (product part).
    const undiscountedInclusivePaise = enteredPricePaise;
    const discountPaise = Math.round((undiscountedInclusivePaise * discountPercent) / 100);
    const netInclusiveProductPaise = Math.max(0, undiscountedInclusivePaise - discountPaise);

    // Extraction: Taxable = round(Net Inclusive * 100 / (100 + rate))
    taxableSellingPricePaise = Math.round((netInclusiveProductPaise * 100) / (100 + taxRate));
    outputGstPaise = netInclusiveProductPaise - taxableSellingPricePaise;
    customerFinalPricePaise = netInclusiveProductPaise + customerPaidShippingPaise;
  }

  const sellerFundedDiscountPaise = Math.round((enteredPricePaise * discountPercent) / 100);

  // Tax Split (Intra-State vs Inter-State)
  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;

  if (inputs.supplyType === "INTER_STATE") {
    igstPaise = outputGstPaise;
  } else {
    // 50-50 split for Intra-State (e.g. 6% + 6% for 12%)
    cgstPaise = Math.round(outputGstPaise / 2);
    sgstPaise = outputGstPaise - cgstPaise;
  }

  // --- 6. Marketplace Commission & Payment Processing Fee ---
  // Platform commission applies to the taxable selling price
  const platformCommissionPaise = Math.round((taxableSellingPricePaise * commissionRate) / 100);
  // Payment processing fee applies to the total customer transaction value
  const paymentGatewayFeePaise = Math.round((customerFinalPricePaise * paymentRate) / 100);
  const totalMarketplaceDeductionsPaise = platformCommissionPaise + paymentGatewayFeePaise;

  // --- 7. Net Seller Payout & Profit Calculations ---
  // Escrow Payout: What marketplace settles into the seller's bank account.
  // Note: Output GST belongs to the tax authorities (seller must file it with GSTR-1),
  // so it is NOT supplier revenue.
  // Customer pays `customerFinalPricePaise`.
  // Marketplace deducts: Platform Commission + Payment Gateway Fee + Output GST (or remits net of GST/TCS).
  // Net seller payout = Taxable Selling Price - Platform Commission - Gateway Fee - (Seller-borne Shipping).
  const estimatedSellerPayoutPaise = Math.max(
    0,
    taxableSellingPricePaise - platformCommissionPaise - paymentGatewayFeePaise - sellerBorneShippingPaise
  );

  // Total Seller Cost = Direct Product Cost + Seller Shipping + Allocated Other Operating Expenses
  const totalSellerCostPaise = directProductCostPaise + sellerBorneShippingPaise + otherExpensesSubtotalPaise;

  // Gross Profit = Taxable Selling Price - Direct Product Cost
  const estimatedGrossProfitPaise = taxableSellingPricePaise - directProductCostPaise;

  // Contribution Profit = Net Seller Revenue (taxable) - Total Seller Cost - Deductions
  const estimatedContributionProfitPaise =
    taxableSellingPricePaise - totalSellerCostPaise - totalMarketplaceDeductionsPaise;

  const profitMarginPercent =
    taxableSellingPricePaise > 0
      ? Number(((estimatedContributionProfitPaise / taxableSellingPricePaise) * 100).toFixed(2))
      : 0;

  const returnOnCostPercent =
    totalSellerCostPaise > 0
      ? Number(((estimatedContributionProfitPaise / totalSellerCostPaise) * 100).toFixed(2))
      : 0;

  // --- 8. Break-Even Price Calculation ---
  // We want Taxable Selling Price where Contribution Profit == 0.
  // Contribution Profit = Taxable - Total Cost - (Taxable * commRate/100) - ((Taxable * (1 + taxRate/100) + custShipping) * payRate/100)
  // Let T = Taxable Selling Price
  // T - (commRate/100)*T - (payRate/100)*(1 + taxRate/100)*T = Total Cost + (payRate/100)*custShipping
  // T * [1 - (commRate/100) - (payRate/100)*(1 + taxRate/100)] = Total Cost + (payRate/100)*custShipping
  const effectiveDeductionFactor = 1 - commissionRate / 100 - (paymentRate / 100) * (1 + taxRate / 100);
  let breakEvenPricePaise = 0;
  if (effectiveDeductionFactor > 0) {
    const fixedBurden = totalSellerCostPaise + Math.round(customerPaidShippingPaise * (paymentRate / 100));
    breakEvenPricePaise = Math.round(fixedBurden / effectiveDeductionFactor);
  } else {
    breakEvenPricePaise = Math.round(totalSellerCostPaise * 1.5);
  }

  // Recommended minimum selling price: Break-even + 15% minimum viable contribution margin
  const minRecommendedPricePaise = Math.round(breakEvenPricePaise * 1.15);

  // Alternative pricing scenarios (-10%, +10%, +25%)
  const testPrices = [
    { label: "Discounted (-10%)", multiplier: 0.9 },
    { label: "Current Price", multiplier: 1.0 },
    { label: "Recommended (+10%)", multiplier: 1.1 },
    { label: "Premium (+25%)", multiplier: 1.25 },
  ];

  const alternativePricingScenarios = testPrices.map((scenario) => {
    const testTaxablePaise = Math.round(taxableSellingPricePaise * scenario.multiplier);
    const testCommPaise = Math.round((testTaxablePaise * commissionRate) / 100);
    const testTaxPaise = Math.round((testTaxablePaise * taxRate) / 100);
    const testCustomerPaise = testTaxablePaise + testTaxPaise + customerPaidShippingPaise;
    const testPayFeePaise = Math.round((testCustomerPaise * paymentRate) / 100);
    const testPayoutPaise = Math.max(0, testTaxablePaise - testCommPaise - testPayFeePaise - sellerBorneShippingPaise);
    const testProfitPaise = testTaxablePaise - totalSellerCostPaise - (testCommPaise + testPayFeePaise);
    const testMargin =
      testTaxablePaise > 0 ? Number(((testProfitPaise / testTaxablePaise) * 100).toFixed(2)) : 0;

    return {
      label: scenario.label,
      sellingPricePaise: testTaxablePaise,
      estimatedPayoutPaise: testPayoutPaise,
      contributionProfitPaise: testProfitPaise,
      marginPercent: testMargin,
    };
  });

  // --- 9. Warnings & Safety Checks ---
  const warnings: string[] = [];
  const isLoss = estimatedContributionProfitPaise < 0;
  const isBelowBreakEven = taxableSellingPricePaise < breakEvenPricePaise;
  const isLowMargin = profitMarginPercent >= 0 && profitMarginPercent < 10.0;
  const isHighShipping =
    taxableSellingPricePaise > 0 && sellerBorneShippingPaise / taxableSellingPricePaise > 0.2;

  if (isLoss) {
    warnings.push(
      `CRITICAL LOSS WARNING: At this selling price, you are losing ₹${Math.abs(fromPaise(estimatedContributionProfitPaise)).toFixed(2)} per unit after platform commission, courier and taxes.`
    );
  } else if (isBelowBreakEven) {
    warnings.push(
      `BELOW BREAK-EVEN: Your taxable selling price (₹${fromPaise(taxableSellingPricePaise).toFixed(2)}) is below the break-even threshold of ₹${fromPaise(breakEvenPricePaise).toFixed(2)}.`
    );
  } else if (isLowMargin) {
    warnings.push(
      `LOW PROFIT MARGIN: Your current estimated contribution margin is ${profitMarginPercent}%. Recommended minimum is 15%.`
    );
  }

  if (isHighShipping) {
    warnings.push(
      `HIGH COURIER EXPENSE: Outward courier costs represent more than 20% of your product value. Consider passing partial courier costs to the customer or optimizing packaging.`
    );
  }

  if (discountPercent > 35) {
    warnings.push(
      `EXCESSIVE DISCOUNT: A ${discountPercent}% discount significantly compresses your net contribution margin.`
    );
  }

  if (directProductCostPaise === 0) {
    warnings.push(
      "MISSING COST DATA: You have not entered procurement, raw material, or labour costs. Profit calculation is incomplete."
    );
  }

  if (!inputs.hsnCode) {
    warnings.push(
      "MISSING HSN CLASSIFICATION: No official HSN code specified. Accurate GST classification requires an active HSN."
    );
  }

  return {
    procurementSubtotalPaise,
    packagingSubtotalPaise,
    inwardTransportSubtotalPaise,
    otherExpensesSubtotalPaise,
    directProductCostPaise,
    outwardCourierPaise,
    sellerBorneShippingPaise,
    customerPaidShippingPaise,
    priceMode: inputs.priceMode,
    enteredPricePaise,
    sellerFundedDiscountPaise,
    taxableSellingPricePaise,
    gstRatePercent: taxRate,
    outputGstPaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
    customerFinalPricePaise,
    platformCommissionPaise,
    paymentGatewayFeePaise,
    totalMarketplaceDeductionsPaise,
    estimatedSellerPayoutPaise,
    totalSellerCostPaise,
    estimatedGrossProfitPaise,
    estimatedContributionProfitPaise,
    profitMarginPercent,
    returnOnCostPercent,
    breakEvenPricePaise,
    minRecommendedPricePaise,
    alternativePricingScenarios,
    isBelowBreakEven,
    isLoss,
    isLowMargin,
    isHighShipping,
    warnings,
  };
}
