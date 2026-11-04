# NEXU ATELIER — Supplier Costing, GST & Profit/Loss Mathematical Formulas

## 1. Monetary Unit Standard

All internal calculations, database records, and ledger transitions are executed in **integer paise** (1 INR = 100 paise). IEEE-754 floating-point rounding errors are strictly eliminated.

---

## 2. Direct Product Cost Formulas

The direct cost of bringing an artisan piece to market is divided into four distinct cost groups:

### A. Procurement / Production Cost
$$\text{Procurement Subtotal} = \text{Purchase Cost} + \text{Manufacturing Cost} + \text{Raw Material Cost} + \text{Labour Cost}$$

### B. Packaging and Handling
$$\text{Packaging Subtotal} = \text{Box/Pouch Material} + \text{Labelling} + \text{Handling} + \text{Quality Inspection} + \text{Warehouse Expenses}$$

### C. Inward Logistics (Distinct from Customer Courier)
$$\text{Inward Transport Subtotal} = \text{Inward Raw Freight} + \text{Supplier-to-Studio Shipping}$$

### D. Other Allocated Studio Expenses
$$\text{Other Expenses Subtotal} = \text{Marketing} + \text{Lookbook Photography} + \text{Operating Overhead} + \sum \text{Custom Direct Rows}$$
*Note: For batch expenses (e.g. ₹1,000 loom calibration across 50 units), unit cost is computed as $\text{round}(\frac{\text{Amount}}{\text{Batch Units}})$.*

### Total Direct Product Cost
$$\text{Direct Product Cost} = \text{Procurement Subtotal} + \text{Packaging Subtotal} + \text{Inward Transport Subtotal}$$

---

## 3. Commercial Pricing & Statutory GST Calculations

### Mode A: GST Exclusive (Supplier Enters Taxable Supply Price)
Let $P_{\text{taxable}}$ be the entered taxable price after deducting any seller-funded discount $D$:
$$P_{\text{taxable}} = P_{\text{entered}} \times \left(1 - \frac{D}{100}\right)$$
$$\text{Output GST} = \text{round}\left( \frac{P_{\text{taxable}} \times R_{\text{GST}}}{100} \right)$$
$$\text{Customer Final Price} = P_{\text{taxable}} + \text{Output GST} + \text{Customer Paid Shipping}$$

### Mode B: GST Inclusive (Supplier Enters Final Buyer Price / MRP)
Let $P_{\text{inc}}$ be the discounted inclusive price:
$$P_{\text{inc}} = P_{\text{entered}} \times \left(1 - \frac{D}{100}\right)$$
$$P_{\text{taxable}} = \text{round}\left( \frac{P_{\text{inc}} \times 100}{100 + R_{\text{GST}}} \right)$$
$$\text{Output GST} = P_{\text{inc}} - P_{\text{taxable}}$$
$$\text{Customer Final Price} = P_{\text{inc}} + \text{Customer Paid Shipping}$$

### Tax Jurisdiction Split
- **Intra-State (Within Same State):**
  $$\text{CGST} = \text{round}\left(\frac{\text{Output GST}}{2}\right), \quad \text{SGST} = \text{Output GST} - \text{CGST}$$
- **Inter-State (Across State Lines):**
  $$\text{IGST} = \text{Output GST}, \quad \text{CGST} = 0, \quad \text{SGST} = 0$$

---

## 4. Deductions & Marketplace Take Rate

- **Platform Commission ($C_{\text{rate}} = 10\%$ default):**
  $$\text{Platform Commission} = \text{round}\left( \frac{P_{\text{taxable}} \times C_{\text{rate}}}{100} \right)$$
- **Payment Processing Fee ($G_{\text{rate}} = 2\%$ default on gross transaction):**
  $$\text{Payment Gateway Fee} = \text{round}\left( \frac{\text{Customer Final Price} \times G_{\text{rate}}}{100} \right)$$

---

## 5. Net Seller Settlement & Profitability

### Estimated Seller Payout (Escrow Settlement to Bank)
*Output GST is collected on behalf of the tax authorities and is excluded from seller revenue.*
$$\text{Estimated Seller Payout} = P_{\text{taxable}} - \text{Platform Commission} - \text{Payment Gateway Fee} - \text{Seller Borne Courier}$$

### Total Seller Production & Logistics Cost
$$\text{Total Seller Cost} = \text{Direct Product Cost} + \text{Seller Borne Courier} + \text{Other Expenses Subtotal}$$

### Estimated Contribution Profit
$$\text{Estimated Contribution Profit} = P_{\text{taxable}} - \text{Total Seller Cost} - \text{Platform Commission} - \text{Payment Gateway Fee}$$

### Contribution Profit Margin (%)
$$\text{Profit Margin } (\%) = \left( \frac{\text{Estimated Contribution Profit}}{P_{\text{taxable}}} \right) \times 100$$

---

## 6. Break-Even & Price Recommendation Formulas

To find the minimum taxable selling price where Contribution Profit equals zero:
$$\text{Effective Factor } F = 1 - \frac{C_{\text{rate}}}{100} - \frac{G_{\text{rate}}}{100} \times \left(1 + \frac{R_{\text{GST}}}{100}\right)$$
$$\text{Fixed Burden} = \text{Total Seller Cost} + \text{round}\left(\text{Customer Paid Shipping} \times \frac{G_{\text{rate}}}{100}\right)$$
$$\text{Break-Even Price } (P_{\text{BE}}) = \text{round}\left( \frac{\text{Fixed Burden}}{F} \right)$$
$$\text{Minimum Recommended Price } (P_{\text{rec}}) = \text{round}(P_{\text{BE}} \times 1.15) \quad \text{(15\% safety buffer)}$$
