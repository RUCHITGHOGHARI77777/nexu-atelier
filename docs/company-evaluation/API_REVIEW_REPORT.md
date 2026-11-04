# 6. REST API & ROUTE HANDLER AUDIT REPORT

## Comprehensive API Route Inventory
- `POST /api/auth/login`: Authenticates user session with PBKDF2 verification.
- `POST /api/auth/register`: Creates new patron account with password complexity checks.
- `GET /api/products`: Retrieves faceted catalog items with search and category filters.
- `POST /api/orders`: Server-authoritative order creation, parent/suborder splitting, and stock reservation.
- `POST /api/payments/verify`: HMAC-SHA256 signature verification for payment settlements.
- `GET /api/seller/orders`: Scoped order listing for authenticated seller (`vendorId: seller.id`).
- `POST /api/seller/orders/[id]/status`: Monotonic fulfillment forward transition handler.
- `POST /api/seller/products`: Multi-step product creation with variant matrices.
- `GET /api/admin/finances`: Platform commission and escrow ledger aggregation.
- `GET /api/admin/audit`: Tamper-evident audit trail search and filtering.
