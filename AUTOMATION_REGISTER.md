# NEXU ATELIER — Master Automation Register & Event Index

## 1. Automated Event Architecture

NEXU ATELIER implements automated event handlers backed by the transactional `NotificationOutbox` pattern and scheduled workers.

---

## 2. Event Ledger

| Event Trigger | Automation Action | System Handler | Delivery Channel | Audit Record |
|---|---|---|---|:---:|
| **ORDER_PLACED** | Atomic stock lock, order confirmation notification | `orderService.createOrder` | Email + In-App | Logged in `AuditEvent` |
| **PAYMENT_CAPTURED** | Settlement accrual, invoice generation | `paymentService.capturePayment` | Email + Outbox | Logged in `PaymentRecord` |
| **STOCK_BELOW_THRESHOLD** | Low inventory alert dispatched to studio owner | `inventoryService.checkThreshold` | In-App + Email | Logged in `NotificationOutbox` |
| **PRODUCT_SUBMITTED** | Moderation queue entry, 60-minute review SLA initiated | `sellerService.createProduct` | In-App Queue | Logged in `ProductRevision` |
| **REVIEW_OVERDUE** | Escalation alert dispatched to Super Admin desk | `reviewSlaService.scanOverdue` | In-App Admin Banner | Logged in `AuditEvent` |
| **ORDER_CANCELLED** | Atomic stock restitution, refund ledger update | `orderService.cancelOrder` | Email + Outbox | Logged in `AuditEvent` |
| **WHATSAPP_OTP_REQUESTED** | Generation of 6-digit cryptographic OTP (3-attempt lock) | `whatsappService.sendOtp` | WhatsApp Cloud API | Logged in `VerificationOtp` |
| **RETURN_REQUESTED** | Return eligibility check, evidence attachment | `returnService.createReturn` | Email + Studio In-App | Logged in `AuditEvent` |
