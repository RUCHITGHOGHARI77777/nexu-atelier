# NEXU ATELIER — Security Threat Model & OWASP ASVS Assessment

**Document Revision:** 2.0.0  
**Framework:** OWASP ASVS v4.0.3 & OWASP API Security Top 10 (2023)  
**Status:** Authoritative Security Document  

---

## 1. Asset Classification & Sensitivity

| Asset | Sensitivity | Protection Requirement | Storage Mechanism |
| :--- | :--- | :--- | :--- |
| **Customer Passwords** | Critical | One-way PBKDF2 salt + hash, 210,000 rounds | `User.passwordHash` |
| **Authentication OTP** | Critical | SHA-256 hash, 5-minute expiry, 3-attempt limit | `VerificationOtp.otpHash` |
| **Payment Card Details** | Extreme | ZERO storage (PAN/CVV never enter platform) | Tokenized gateway only |
| **Customer PII** | High | Masked in logs, protected by strict session scoping | PostgreSQL + SSL |
| **Seller Bank Accounts**| High | Admin/seller-only visibility, masked in exports | `Seller.bankAccountNumber` |
| **Order Ledgers** | Critical | Immutable append-only audit events | `AuditEvent`, `VendorPayout` |

---

## 2. Adversary Personas & Threat Scenarios

```mermaid
flowchart TD
    Attacker([Adversary])
    
    Attacker -->|Threat 1: BOLA / IDOR| QuerySpoof[Attempt to read other customer's orders via UUID manipulation]
    Attacker -->|Threat 2: Price Tampering| PayloadAlter[Alter line total or shipping fee in checkout POST body]
    Attacker -->|Threat 3: OTP Brute Force| ScriptBurst[Flood OTP endpoint with 1,000,000 combinations]
    Attacker -->|Threat 4: Webhook Forgery| FakeEvent[Send fake payment.captured webhook to mark unpaid orders as confirmed]
    Attacker -->|Threat 5: Tenant Crossing| SellerProbe[Seller attempts to inspect rival seller's orders & payouts]

    QuerySpoof -.->|Mitigated by| Guard1[where: { id, customerId }]
    PayloadAlter -.->|Mitigated by| Guard2[Server-Authoritative Price Recalculation]
    ScriptBurst -.->|Mitigated by| Guard3[3-Attempt Lockout + 60s Resend Cooldown]
    FakeEvent -.->|Mitigated by| Guard4[HMAC-SHA256 Timing-Safe Signature Verification]
    SellerProbe -.->|Mitigated by| Guard5[where: { vendorId: seller.id }]
```

---

## 3. OWASP API Security Top 10 Control Matrix

| Vulnerability | Status | Implemented Mitigation | Verification Test |
| :--- | :--- | :--- | :--- |
| **API1: Broken Object Level Auth (BOLA)** | Mitigated | All customer data queries scope by authenticated `customerId`. Sellers scope by authenticated `sellerId`. | `tenant-security-anti-idor.test.ts` |
| **API2: Broken Authentication** | Mitigated | PBKDF2 password hashing (210,000 iterations); WhatsApp OTP rate limiting and attempt lockout. | `whatsapp-otp-system.test.ts` |
| **API3: Broken Object Property Level Auth** | Mitigated | Client payloads are strongly typed; mass assignment of internal fields (`status`, `refundedPaise`) is blocked. | `order-service.test.ts` |
| **API4: Unrestricted Resource Consumption** | Mitigated | Interactive transaction timeouts (10s), pagination limits on catalog queries, OTP cooldowns. | `central-admin-control-engine.test.ts` |
| **API5: Broken Function Level Auth (BFLA)** | Mitigated | Server-side role inspection (`requireRole(["ADMIN"])`) before administrative execution. | `tenant-security-anti-idor.test.ts` |
| **API6: Server-Side Request Forgery (SSRF)** | Mitigated | External webhook deliveries and images restricted to whitelisted domains and verified CDNs. | `smart-listing-engine.test.ts` |
| **API7: Security Misconfiguration** | Mitigated | Security headers, strict CORS, disabled directory indexing, generic error messages to clients. | `privacy-payment-reporting.test.ts` |
| **API8: Lack of Protection from Automated Threats** | Mitigated | Rate limiting, COD risk assessment engine, honeypot fields. | `fraud-and-cod-engine.test.ts` |
| **API9: Improper Inventory Management** | Mitigated | Deprecated API routes retired; OpenAPI/contract documentation in `API_CONTRACTS.md`. | System Verification |
| **API10: Unsafe Consumption of APIs** | Mitigated | Webhook payloads verified via cryptographically signed HMAC buffers before processing. | `payment-webhook-service.test.ts` |

