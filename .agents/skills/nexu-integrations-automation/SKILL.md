---
name: nexu-integrations-automation
description: External service integrations and background automations for NEXU ATELIER. Governs Razorpay payment gateway, WhatsApp Cloud API, transactional email outbox, 3PL courier tracking (Shiprocket/Delhivery), and cloud media storage.
---

# NEXU Integrations & Automation Skill

## 1. Activation Conditions
Activate this skill when:
- Configuring or testing payment gateways (Razorpay, Stripe, COD).
- Managing OTP delivery via WhatsApp Meta Cloud API or email outbox queues.
- Implementing 3PL logistics dispatch, AWB generation, and delivery tracking webhooks.
- Handling local-to-cloud media migrations (AWS S3, Cloudinary).

## 2. Integration Transparency Standards
Never misrepresent a simulated service as live:
- **DEMO / SANDBOX:** Transactions labeled with explicit `DEMO-` prefixes and test watermarks.
- **SIMULATOR SINK:** OTPs and notifications logged to database outbox tables (`NotificationEvent`) with developer simulator overlays.
- **LIVE VERIFIED:** Requires verified merchant API keys, production webhooks, and live gateway responses.

## 3. The Transactional Outbox Pattern
To prevent distributed transaction failures (e.g. order saved in DB, but email API call crashed):
1. Insert notification record into `NotificationEvent` in the same database transaction as the order.
2. Background worker polls pending notifications:
   ```typescript
   const pending = await prisma.notificationEvent.findMany({
     where: { status: 'PENDING', attempts: { lt: 3 } },
     take: 10
   });
   ```
3. Worker dispatches notification via active provider (WhatsApp Meta API or Resend/SES) and marks `SENT` with timestamp.
4. If provider fails, increment `attempts` and schedule exponential backoff.

## 4. Quality Checklist
- [ ] No hardcoded production API secrets in source control.
- [ ] All webhook endpoints verify cryptographic signatures.
- [ ] External service outages gracefully degrade with retry queues rather than failing customer checkouts.
