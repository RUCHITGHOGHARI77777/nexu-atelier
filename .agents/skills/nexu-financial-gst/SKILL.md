---
name: nexu-financial-gst
description: Statutory Indian GST compliance and financial ledger engineering for NEXU ATELIER. Enforces Notification 13/2025-Central Tax (Rate), HSN classifications, intra-state (CGST+SGST) vs inter-state (IGST) split, commission ledgers, and escrow settlements.
---

# NEXU Financial & Statutory GST Skill

## 1. Activation Conditions
Activate this skill when:
- Computing Goods and Services Tax (GST) for products, shipping, or platform fees.
- Looking up or validating Harmonized System of Nomenclature (HSN) codes.
- Managing escrow holdings, vendor payouts, and commission calculations.
- Handling debit/credit notes, refund adjustments, and input tax credit (ITC) allocations.

## 2. Statutory GST Engine Standards
1. **Official Schedules Reference:**
   - Compliant with **Notification 13/2025-Central Tax (Rate), dated 17 September 2025**.
   - HSN 6204 / 6203 (Handcrafted Apparel): 5% for price <= ₹1,000; 12% for price > ₹1,000.
   - HSN 7113 (Artisanal Jewelry): 3%.
   - HSN 6403 (Handcrafted Footwear): 12% for price <= ₹1,000; 18% for price > ₹1,000.
   - HSN 9403 (Artisan Woodcraft & Furniture): 18%.
2. **Intra-State vs Inter-State Supply:**
   - **Intra-state (Supplier State == Customer State):**
     - CGST = $\text{Tax Rate} / 2$
     - SGST = $\text{Tax Rate} / 2$
   - **Inter-state (Supplier State != Customer State):**
     - IGST = $\text{Full Tax Rate}$
3. **Calculation Modes:**
   - **Mode A (Exclusive):** $\text{Tax} = \text{Base Price} \times \text{Rate}\%$. Total = Base + Tax.
   - **Mode B (Inclusive):** $\text{Base} = \text{MRP} / (1 + \text{Rate}\%)$. Tax = MRP - Base.

## 3. Financial Ledger Invariants
$$\text{Gross Order Value} = \text{Net Product Amount} + \text{GST} + \text{Shipping Fee} - \text{Discounts}$$
$$\text{Supplier Payout} = \text{Product Base} + \text{Collected GST} - \text{Platform Commission} - \text{TCS (1\%)} - \text{TDS}$$

## 4. Quality Checklist
- [ ] No product is arbitrarily assigned 5%, 12%, or 18% without statutory HSN verification.
- [ ] Tax amounts are never mixed with supplier profit margins.
- [ ] Credit notes and return reversals balance the platform escrow ledger to the exact single paisa.
