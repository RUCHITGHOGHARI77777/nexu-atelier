# NEXU ATELIER — FINANCIAL LEDGER & REVENUE RULES
**Standard:** Strict Integer Paise Arithmetic & Indian E-Commerce Taxation  
**Date:** November 5, 2026  

---

## 1. CORE FINANCIAL VOCABULARY & DISTINCTIONS

To prevent confusion between top-line platform volume and true bottom-line platform income:

| Financial Metric | Technical Definition | Example Amount (INR) |
| :--- | :--- | :---: |
| **Gross Merchandise Value (GMV)** | Total value of all customer orders placed on the platform before cancellations. | ₹10,000 |
| **Gross Order Value (GOV)** | Actual amount paid by customer for a specific order ($\text{Subtotal} + \text{Tax} + \text{Shipping} - \text{Discount}$). | ₹8,450 |
| **Product Base Revenue** | Net product price excluding statutory GST. | ₹7,000 |
| **Statutory Tax (GST)** | Government tax collected from customer on behalf of the supplier or platform. | ₹1,260 (18%) |
| **Shipping Fees** | Logistics cost collected from customer or borne by seller. | ₹190 |
| **Platform Commission** | Fee charged by NEXU ATELIER for marketplace facilitation (default 7% on base price). | ₹490 |
| **TCS (Tax Collected at Source)**| Mandatory 1% GST deduction under Section 52 of CGST Act remitted directly to the Government. | ₹70 |
| **Net Supplier Payout** | Total funds disbursed to the artisan/seller after all deductions. | ₹7,700 |
| **Platform Net Income** | Commission retained by NEXU ATELIER minus gateway processing fees. | ₹321 |

---

## 2. INTEGER PAISE MATHEMATICAL INVARIANTS

All mathematical calculations operate on integers representing paise ($1\text{ Rupee} = 100\text{ Paise}$):

### A. Order Total Equation:
$$\text{totalPaise} = \text{subtotalPaise} + \text{estimatedTaxPaise} + \text{shippingFeePaise} - \text{discountPaise}$$

### B. Mode A: Cost-Plus Pricing (Supplier Target Margin)
$$\text{Base Selling Price} = \frac{\text{Total Cost}}{1 - \text{Target Margin Rate}}$$
$$\text{Total Cost} = \text{Procurement} + \text{Packaging} + \text{Logistics} + \text{Studio Overheads}$$

### C. Mode B: Contribution Profit (Given Selling Price)
$$\text{Net Revenue} = \text{Selling Price} - \text{Commission (7\%)} - \text{Payment Fee (2\%)} - \text{TCS (1\%)}$$
$$\text{Contribution Profit} = \text{Net Revenue} - \text{Total Cost}$$
$$\text{Profit Margin \%} = \left(\frac{\text{Contribution Profit}}{\text{Selling Price}}\right) \times 100$$

### D. Break-Even Price (Zero Profit)
$$\text{Break-Even Price} = \frac{\text{Total Cost}}{1 - (\text{Commission Rate} + \text{Payment Fee Rate} + \text{TCS Rate})}$$

---

## 3. ESCROW DISBURSEMENT TIMELINE

```text
[Day 0: Customer Checkout] ──► Payment captured; funds placed in ESCROW_HOLD.
[Day 2: Supplier Dispatch] ──► Suborder marked in-transit with 3PL courier.
[Day 5: Customer Delivery] ──► Courier webhook confirms "DELIVERED".
[Day 5 to Day 8: Inspection]──► 3-day inspection window for returns/disputes.
[Day 8: Settlement Release] ──► Escrow released to AVAILABLE_FOR_PAYOUT; batch payout to seller's bank.
```

