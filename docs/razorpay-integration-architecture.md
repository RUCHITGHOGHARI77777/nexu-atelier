# NEXU ATELIER — Razorpay Payment Gateway Integration Architecture
## Technical Reference, Sandbox Specifications & Security Boundaries

**Status:** Ready for Owner Payment Processing Specification  
**Version:** 1.0.0 (Pre-Payment Staging)  
**Security Level:** PCI-DSS Hosted / Zero Raw Card Ingestion  

---

### 1. Environment Variable Placeholders

The application interfaces with Razorpay via environment variables defined in `.env.example`. No credentials or secret keys are hardcoded in the codebase:

```bash
# Payment Provider Selection ("SANDBOX" for simulated development; "RAZORPAY" for live gateway)
PAYMENT_PROVIDER=SANDBOX

# Razorpay API Credentials (Obtain from Razorpay Dashboard -> Settings -> API Keys)
RAZORPAY_KEY_ID=rzp_test_placeholder
RAZORPAY_KEY_SECRET=placeholder

# Webhook Cryptographic Verification Secret (Configure in Dashboard -> Settings -> Webhooks)
RAZORPAY_WEBHOOK_SECRET=placeholder_webhook_secret
```

---

### 2. Provider Adapter Architecture

NEXU ATELIER employs the **Provider Pattern** (`IPaymentAdapter` interface located at `src/lib/server/payment/types.ts`). This guarantees modular decoupling between business logic and third-party payment gateways:

```
                      +----------------------+
                      |   IPaymentAdapter    |
                      +----------------------+
                                 |
         +-----------------------+-----------------------+
         |                                               |
+--------------------------+               +--------------------------+
|  RazorpayPaymentAdapter  |               |  SandboxPaymentAdapter   |
| (Official Razorpay v1)   |               |  (Local Auth Verification)|
+--------------------------+               +--------------------------+
```

Each adapter implements:
- `createPaymentOrder(params)`: Generates gateway order ID and registers receipt details.
- `verifyPaymentSignature(params)`: Cryptographically verifies HMAC-SHA256 signature.
- `fetchPaymentStatus(paymentId)`: Queries remote gateway state and maps to internal enum.
- `refundPayment(params)`: Executes idempotent partial or full refunds.
- `verifyWebhookSignature(rawBody, signature)`: Validates inbound webhook events.

---

### 3. Payment Method Configuration

The pre-payment interface supports 5 configurable payment avenues:

| Method ID | Channel Type | Ingestion Model | Security & Compliance Note |
| :--- | :--- | :--- | :--- |
| `UPI` | Instant UPI (GPay, PhonePe, Paytm, BHIM, Custom VPA) | Intent / Collect | Customer authorizes inside their native UPI app. Nexu never collects UPI PINs. |
| `CARD` | Credit & Debit Cards (Visa, Mastercard, RuPay, Amex) | Hosted Gateway | Full card numbers and CVVs are captured exclusively on bank's 3D-Secure switch. Masked view only (`•••• •••• •••• 4242`). |
| `NET_BANKING` | 50+ Scheduled Commercial Indian Banks | Bank Redirection | Hosted redirect to financial institution login. |
| `WALLET` | Digital Wallets (Paytm, PhonePe, Amazon Pay) | Wallet Token | Direct wallet switch authorization. |
| `COD` | Cash on Delivery | Courier Remittance | Governed by multi-signal risk rules, PIN serviceability, and mandatory courier reconciliation. |

---

### 4. Gateway Status Mapping

| Razorpay Gateway State | NEXU Internal Status (`PaymentStatus`) | Order Status Transition |
| :--- | :--- | :--- |
| `created` | `PENDING` | `PENDING_PAYMENT` |
| `authorized` | `ESCROW_HOLD` | `CONFIRMED` |
| `captured` | `CAPTURED` | `CONFIRMED` / `IN_PRODUCTION` |
| `failed` | `FAILED` | `PENDING_PAYMENT` (retry allowed) |
| `refunded` | `REFUNDED` | `CANCELLED` / `RETURNED` |

---

### 5. Sandbox Configuration & Testing Credentials

For sandbox verification, Razorpay provides standard test instrumentation:
- **Test Mode API Endpoint:** `https://api.razorpay.com/v1`
- **Standard Test UPI VPAs:** `success@razorpay` (instant capture), `failure@razorpay` (simulated decline).
- **Test Card Numbers:** `4111 1111 1111 1111` (Visa Success), `5123 4567 8901 2345` (Mastercard Success).
- **Test OTP:** `123456` on simulated 3D-Secure ACS page.

---

### 6. Webhook Endpoint Architecture (`/api/webhooks/razorpay`)

Inbound webhooks guarantee asynchronous state synchronization:
1. **Raw Body Retention:** Incoming payload is preserved in raw UTF-8 format before JSON parsing.
2. **Signature Check:** Verified against `X-Razorpay-Signature` header using:
   $$\text{HMAC-SHA256}(\text{rawBody}, \text{RAZORPAY\_WEBHOOK\_SECRET})$$
3. **Supported Events:**
   - `order.paid` / `payment.captured`: Moves `PaymentRecord` to `CAPTURED`, records gateway transaction reference.
   - `payment.failed`: Records failure reason, increments customer failed payment counter.
   - `refund.processed`: Updates `RefundRecord` to `COMPLETED` and recalculates order refunded totals.
4. **Deduplication:** Event IDs are recorded in `AuditEvent` to prevent replaying webhook payloads.

---

### 7. Idempotency Design

- Every payment request generates a unique idempotency key: `idemp_${Date.now()}_${customerId}`.
- Database unique constraint on `PaymentRecord.transactionRef` prevents duplicate order captures.
- In-flight duplicate payment requests return existing order records rather than re-initiating gateway charges.

---

### 8. Explicit Stop Point Boundary

> **IMPORTANT ARCHITECTURAL RULE:**  
> The checkout payment UI, payment method selector, multi-signal fraud evaluation, and COD eligibility system are complete and functional in staging mode.
> In accordance with the Owner's instructions, live online payment execution and actual COD order creation are safely halted at the Final Pay button pending the Owner's next payment processing specification.
