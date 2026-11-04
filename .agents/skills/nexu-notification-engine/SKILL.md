---
name: nexu-notification-engine
description: Notification architecture and communication protocols for NEXU ATELIER. Covers WhatsApp Cloud API OTP authentication, transactional emails, delivery retry mechanisms, template structures, and notification audit logs.
metadata:
  author: NEXU ATELIER Platform Communications
  version: "1.0.0"
  stack: "WhatsApp Cloud API (v21.0), Transactional Email Outbox, PostgreSQL 17"
---

# NEXU ATELIER — Notification Engine & WhatsApp Cloud Architecture

## 1. Primary Channels & Policy Decisions

1. **WhatsApp Cloud API (Primary Real-Time Channel):**
   - Designated channel for authentication OTP, order confirmation alerts, out-for-delivery updates, and high-urgency notifications.
   - Prohibits SMS OTP to prevent SIM-swap risks, SMS toll fraud, and poor delivery rates in India.
2. **Transactional Email (Documentary & Detailed Channel):**
   - High-fidelity HTML emails for patron welcome, tax invoices, order receipts, shipment tracking dispatches, admin SLA escalations, and monthly reports.
   - Recorded in `NotificationEvent` table with delivery status, retry attempts, and error logs.

---

## 2. WhatsApp Business Cloud API Integration

### 2.1 OTP Generation & Verification Specifications
- **Template Name:** `nexu_auth_code` (Category: `AUTHENTICATION`).
- **Body Structure:** "Your NEXU ATELIER security verification code is {{1}}. Valid for 5 minutes. Do not share this code with anyone."
- **Verification Constraints:**
  - Code length: 6 numeric digits.
  - Expiry: 300 seconds (5 minutes).
  - Attempt limit: 3 attempts maximum. On 3rd failure, the code is immediately invalidated.
  - Resend cooldown: 60 seconds.

### 2.2 Operational Alerts
- `nexu_order_confirmed`: Sent immediately upon order creation with `ORD-YYYY-XXXX` and tracking link.
- `nexu_shipment_dispatched`: Sent when carrier (Blue Dart) picks up consignment with tracking AWB.
- `nexu_out_for_delivery`: Real-time morning notification for delivery day.

---

## 3. Transactional Email Engine

### 3.1 Event Handling Architecture
All transactional communications pass through `sendTransactionalEmail()` in `src/lib/server/notification-service.ts`:
```ts
export async function sendTransactionalEmail(payload: {
  recipient: string;
  template: string;
  payload: Record<string, any>;
  orderId?: string;
  idempotencyKey?: string;
}): Promise<{ id: string; status: "SENT" | "QUEUED" | "FAILED" }> {
  // 1. Check idempotency
  // 2. Render responsive luxury HTML template
  // 3. Deliver via configured SMTP provider or log to dev outbox sink
  // 4. Record in NotificationEvent
}
```

### 3.2 Supported Email Templates
- `WELCOME_PATRON`: Sent upon customer registration with exclusive tier onboarding.
- `ORDER_CONFIRMED`: Rich receipt with line item photos, courier details, and breakdown.
- `SUPPLIER_NEW_ORDER`: Dispatched to studio maker with required packing instructions.
- `ORDER_CANCELLED`: Confirmation of cancellation and refund schedule.
- `ACCOUNT_RECOVERY`: Secure password reset link with 15-minute token expiry.
- `ADMIN_SLA_ESCALATION`: Escalation sent to administrators for overdue product reviews.

---

## 4. Resilience, Retries & Auditing

- If an external delivery attempt fails with a transient error, the notification is set to `QUEUED` with `attempts = attempts + 1`.
- Exponential backoff retry mechanism (1m, 5m, 15m) capped at 3 retries.
- Permanent failures (`FAILED`) are flagged for operational review in `OperationalContactLog`.
