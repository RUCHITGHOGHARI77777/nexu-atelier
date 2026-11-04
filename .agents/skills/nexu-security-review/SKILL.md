---
name: nexu-security-review
description: OWASP ASVS Level 2, API security, and penetration defense guidelines for NEXU ATELIER. Enforces anti-IDOR checks, password hashing standards (PBKDF2), tenant boundary validations, CSRF/XSS sanitization, and webhook HMAC-SHA256 signatures.
---

# NEXU Security Review Skill

## 1. Activation Conditions
Activate this skill when:
- Reviewing authentication, password hashing, session tokens, or cookie flags.
- Validating API route handlers against Insecure Direct Object References (IDOR).
- Inspecting external webhooks (Razorpay, WhatsApp, 3PL logistics) for signature authenticity.
- Reviewing file uploads for MIME sniffing, executable extensions, or path traversal.

## 2. Core Security Invariants
1. **Zero-Trust Access Control (Anti-IDOR):**
   - Never trust IDs passed in route parameters or query strings (`req.params.id`).
   - Every lookup must verify ownership against the authenticated database session:
     ```typescript
     const order = await prisma.order.findFirst({
       where: { id: orderId, customerId: session.userId }
     });
     if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
     ```
2. **Cryptographic Password Storage:**
   - Use PBKDF2 with SHA-512, minimum 100,000 iterations, and a unique 32-byte salt per user.
   - Session tokens must use cryptographically secure random bytes (`crypto.randomBytes(32).toString('hex')`).
   - Cookie flags: `HttpOnly; SameSite=Lax; Path=/; Secure`.
3. **Webhook Verification:**
   - Payment webhooks must compute `crypto.createHmac('sha256', secret).update(rawBody).digest('hex')`.
   - Verify signatures using constant-time string comparison (`crypto.timingSafeEqual`) to prevent timing attacks.

## 3. Threat Mitigation Checklist
- [ ] Stored XSS prevented: User-supplied text sanitized before display in reviews or messages.
- [ ] SQL Injection prevented: 100% Prisma parameterized queries; zero raw SQL strings.
- [ ] Rate limiting applied to authentication, OTP generation, and coupon verification endpoints.
- [ ] File uploads restrict extensions to `.jpg`, `.jpeg`, `.png`, `.webp` with 5MB size caps.
