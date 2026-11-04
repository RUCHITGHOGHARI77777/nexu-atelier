---
name: nexu-marketplace-security
description: OWASP ASVS and API Security engineering guidelines for NEXU ATELIER. Covers authentication, WhatsApp OTP, tenant isolation, anti-IDOR safeguards, payment security, CSRF/XSS mitigations, webhook verification, and secrets management.
metadata:
  author: NEXU ATELIER Security Team
  version: "1.0.0"
  standards: "OWASP ASVS v4.0.3, OWASP API Security Top 10 (2023), India DPDP Act 2023"
---

# NEXU ATELIER — Marketplace Security & OWASP Engineering Standards

## 1. Security Architecture Overview

NEXU ATELIER enforces a multi-tier defense-in-depth model across all customer, supplier, and administrative workflows. Every endpoint, database query, and mutation must adhere to OWASP ASVS Level 2+ guidelines.

---

## 2. Threat Modeling & Countermeasure Matrix

| Threat Category | Potential Impact | NEXU ATELIER Countermeasure | Verification Test |
| :--- | :--- | :--- | :--- |
| **Broken Object Level Auth (BOLA / IDOR)** | User accesses/modifies another tenant's order or payout | Mandatory query scoping: `where: { id: orderId, customerId: user.id }` | `tenant-security-anti-idor.test.ts` |
| **Broken Function Level Auth (BFLA)** | Customer invokes admin review or supplier fulfillment | Strict role verification via `requireRole(["ADMIN"])` before business logic | `central-admin-control-engine.test.ts` |
| **Credential Stuffing / Brute Force** | Account takeover or OTP exhaustion | PBKDF2 (210,000 rounds), 3-attempt OTP lockout, 60s resend cooldown, IP rate limiting | `whatsapp-otp-system.test.ts` |
| **Payment Amount Tampering** | Client alters total in payload to pay less | Server-authoritative price recalculation strictly from PostgreSQL catalog | `order-service.test.ts` |
| **Webhook Forgery** | Attacker fakes payment captured or delivery status | Strict HMAC-SHA256 signature verification over raw request body buffer | `payment-webhook-service.test.ts` |
| **Cardholder Data Leakage** | PCI DSS non-compliance, financial liability | Zero raw cardholder storage: PAN and CVV are never accepted, processed, or logged | `privacy-payment-reporting.test.ts` |
| **Stored XSS** | Malicious script in product reviews or Q&A | React JSX auto-escaping, content sanitization, strict CSP headers | `customer-experience-engine.test.ts` |

---

## 3. Authentication & Password Security

### 3.1 Cryptographic Password Hashing
- Use `node:crypto.pbkdf2` with `sha512`, 210,000 iterations, 32-byte cryptographically random salt, and 64-byte key length.
- Verifications must execute via `crypto.timingSafeEqual` to eliminate timing side-channel attacks.
```ts
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, iterationsStr, key] = storedHash.split(":");
  const iterations = parseInt(iterationsStr, 10);
  const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512");
  return crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
}
```

### 3.2 WhatsApp Business Cloud OTP Security
- **Channel Policy:** WhatsApp OTP is the designated real-time authentication and verification channel. SMS OTP is prohibited.
- **Code Entropy:** 6-digit cryptographically generated digits (`crypto.randomInt(100000, 999999)`).
- **Storage:** Only store SHA-256 hashed OTPs in PostgreSQL (`VerificationOtp.otpHash`).
- **Throttling & Locks:**
  - Maximum 3 incorrect attempts. On 3rd failure, the code is immediately invalidated.
  - Expiry is strictly 5 minutes (300 seconds).
  - Resend cooldown is enforced for 60 seconds (`resendCooldownUntil`).

---

## 4. Tenant Isolation & Anti-IDOR Standards

### 4.1 Customer Isolation Rule
A customer must never read or modify orders, addresses, or support tickets belonging to another user:
```ts
// SECURE: Enforces tenant boundary
const order = await prisma.order.findFirst({
  where: { id: orderId, customerId: currentSession.userId },
  include: { items: true, shipments: true }
});
if (!order) throw new ForbiddenException("Access denied or order not found");
```

### 4.2 Supplier Tenant Isolation
Sellers must only view orders, inventory, drafts, and payouts tied to their unique `sellerId`:
```ts
// SECURE: Only returns items where vendorId matches seller
const orderLines = await prisma.orderItem.findMany({
  where: { vendorId: currentSeller.id, fulfillmentStatus: statusFilter },
  include: { order: true, shipment: true }
});
```

### 4.3 Administrator Guardrail
Admin routes must verify `user.role === 'ADMIN'` in the session token and log all administrative interventions in `AuditEvent` with IP, timestamp, and target entity.

---

## 5. Payment Security & Webhook Integrity

1. **Server-Authoritative Pricing:** Client-provided prices, subtotals, or discount totals in checkout payloads are discarded. The server loads each product from PostgreSQL, calculates line totals, applies verified coupon rules, computes shipping and taxes, and creates the payment order.
2. **Webhook Verification:** Verify gateway signatures using raw request bodies before JSON parsing:
   ```ts
   const expectedSignature = crypto
     .createHmac("sha256", process.env.PAYMENT_WEBHOOK_SECRET!)
     .update(rawBodyBuffer)
     .digest("hex");
   if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
     throw new UnauthorizedException("Invalid webhook signature");
   }
   ```
3. **Webhook Idempotency:** Check `WebhookEvent` with `@@unique([provider, eventId])` before triggering order state changes.

---

## 6. Privacy & Data Protection (DPDP Act 2023)

- User phone numbers and personal identifiers must be masked in operational logs (e.g., `+91 983*****41`).
- Provide Data Subject Request (DSR) workflows for account data export and erasure (`DataSubjectRequest`).
- Retain audit logs for compliance without logging unencrypted sensitive secrets.
