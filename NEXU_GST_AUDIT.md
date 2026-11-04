# NEXU ATELIER — STATUTORY GST & HSN COMPLIANCE AUDIT
**Statutory Basis:** Central Board of Indirect Taxes and Customs (CBIC) Goods & Services Tax Schedules  
**Notification Reference:** Notification No. 13/2025-Central Tax (Rate), dated 17 September 2025  
**Audit Scope:** HSN Code Mapping, Threshold Determination, Intra vs Inter-State Apportionment  
**Date:** November 5, 2026  

---

## 1. OFFICIAL STATUTORY HSN CLASSIFICATION DIRECTORY

NEXU ATELIER integrates official CBIC HSN codes for luxury and handcrafted artisan goods:

| HSN Code | Description / Commodity Category | Statutory Condition | GST Slab Rate | Tax Breakup (Intra-state) | Tax Breakup (Inter-state) |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **6204 / 6203** | Handloom Apparel, Chanderi & Banarasi Sarees | Selling Price $\le$ ₹1,000 | **5%** | 2.5% CGST + 2.5% SGST | 5% IGST |
| **6204 / 6203** | Luxury Heritage Sarees, Embroidered Lehengas | Selling Price $>$ ₹1,000 | **12%** | 6.0% CGST + 6.0% SGST | 12% IGST |
| **7113** | Handcrafted Silver & Gold-Plated Jewelry | All value tiers | **3%** | 1.5% CGST + 1.5% SGST | 3% IGST |
| **6403** | Handcrafted Leather Mojaris & Footwear | Selling Price $\le$ ₹1,000 | **12%** | 6.0% CGST + 6.0% SGST | 12% IGST |
| **6403** | Bespoke Leather Shoes & Boots | Selling Price $>$ ₹1,000 | **18%** | 9.0% CGST + 9.0% SGST | 18% IGST |
| **9403** | Artisan Carved Wood Furniture & Decor | All value tiers | **18%** | 9.0% CGST + 9.0% SGST | 18% IGST |
| **9983** | Marketplace Platform Facilitation Services | Platform commission | **18%** | 9.0% CGST + 9.0% SGST | 18% IGST |

> **Anti-Tampering Rule:** Tax rates are **never universally assigned**. The system dynamically resolves the correct rate from `src/lib/tax-hsn-directory.ts` based on product HSN and unit price.

---

## 2. SUPPLY LOCATION LOGIC (INTRA-STATE VS INTER-STATE)

The place of supply is determined by comparing the **Supplier Studio Origin State** with the **Customer Shipping Address State**:

1. **Intra-State Supply (Supplier State == Customer State):**
   - Applies equal split between Central GST and State GST.
   - Example (₹5,000 Silk Saree sold within Rajasthan, 12% GST):
     - Taxable Value: ₹5,000.00
     - CGST (6%): ₹300.00
     - SGST (6%): ₹300.00
     - Total GST: ₹600.00
2. **Inter-State Supply (Supplier State != Customer State):**
   - Applies Integrated GST (IGST) in full.
   - Example (₹5,000 Silk Saree sold from Rajasthan to Maharashtra, 12% GST):
     - Taxable Value: ₹5,000.00
     - IGST (12%): ₹600.00
     - Total GST: ₹600.00

---

## 3. GST-INCLUSIVE VS GST-EXCLUSIVE PRICE RESOLUTION

The pricing engine handles both modes to accommodate artisan inputs:

* **Mode A (Exclusive):**
  $$\text{Tax Amount} = \text{Taxable Base} \times \left(\frac{\text{GST Rate}}{100}\right)$$
  $$\text{Final MRP} = \text{Taxable Base} + \text{Tax Amount}$$
* **Mode B (Inclusive):**
  $$\text{Taxable Base} = \frac{\text{Final MRP}}{1 + \left(\frac{\text{GST Rate}}{100}\right)}$$
  $$\text{Tax Amount} = \text{Final MRP} - \text{Taxable Base}$$

All numbers are rounded to the nearest integer paisa and verified across automated test suites (`supplier-product-costing-integration.test.ts`).
