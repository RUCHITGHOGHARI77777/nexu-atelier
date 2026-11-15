# 10. MULTI-VENDOR SPLITTING & SHIPMENT REPORT

## Multi-Vendor Checkout Verification
1. **Scenario:** Customer purchased Item 1 (Solstice Studio, Gujarat) and Item 2 (Varanasi Silks, Uttar Pradesh) in a single checkout.
2. **Database Verification:**
   - 1 Parent `Order` created for ₹32,000.
   - 2 discrete `OrderItem` rows created, each tied to its respective `vendorId`.
   - 2 discrete `Shipment` rows generated with independent AWB tracking.
   - Solstice Studio portal displayed only Item 1.
   - Varanasi Silks portal displayed only Item 2.
   - Admin console displayed parent order with full suborder visibility.
- **Test Result:** **100% PASS** (Verified in `tests/e2e-marketplace-demo-readiness.test.ts`).
