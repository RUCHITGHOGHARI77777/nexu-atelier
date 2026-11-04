# NEXU ATELIER — API Contracts & Endpoint Specifications

**Document Revision:** 2.0.0  
**Status:** Authoritative API Contract Specification  

---

## 1. Authentication & Session Headers

All authenticated requests require an active session token delivered via an `HttpOnly` cookie or bearer authorization header:
```http
Authorization: Bearer <session_token>
Content-Type: application/json
```

Standard Error Response Envelope:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT",
    "message": "Human-readable error description"
  }
}
```

---

## 2. Public Storefront & Commerce Endpoints

### 2.1 Validate Promotional Coupon
`POST /api/coupons/validate`
- **Request Body:**
  ```json
  {
    "code": "NEXUFIRST",
    "subtotalPaise": 1500000
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "valid": true,
    "code": "NEXUFIRST",
    "discountPaise": 225000,
    "discountType": "PERCENTAGE",
    "discountValue": 15,
    "message": "15% off first order applied"
  }
  ```

### 2.2 Server-Authoritative Checkout
`POST /api/checkout`
- **Request Body:**
  ```json
  {
    "idempotencyKey": "req_8f192b49-1123-4567-89ab-cdef01234567",
    "items": [
      {
        "productId": "prod_silk_001",
        "variantId": "var_gold_001",
        "quantity": 1
      }
    ],
    "addressId": "addr_987654",
    "deliveryMethodId": "STANDARD_EXPRESS",
    "couponCode": "NEXUFIRST",
    "isCod": false
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "orderId": "ORD-2026-6F7AF890D736",
    "status": "CONFIRMED",
    "subtotalPaise": 1500000,
    "discountPaise": 225000,
    "shippingFeePaise": 25000,
    "estimatedTaxPaise": 153000,
    "totalPaise": 1453000,
    "shipmentCount": 1,
    "createdAt": "2026-11-04T12:00:00.000Z"
  }
  ```

---

## 3. Customer / Patron Endpoints

### 3.1 Order Cancellation
`POST /api/patron/orders/{orderId}/cancel`
- **Request Body:**
  ```json
  {
    "reason": "Accidentally placed duplicate order"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "orderId": "ORD-2026-6F7AF890D736",
    "status": "CANCELLED",
    "inventoryRestored": true
  }
  ```

### 3.2 Submit Support Ticket
`POST /api/patron/tickets`
- **Request Body:**
  ```json
  {
    "subject": "Care instructions for pure silk dupatta",
    "category": "PRODUCT_INQUIRY",
    "priority": "MEDIUM",
    "orderId": "ORD-2026-6F7AF890D736",
    "message": "Should this piece be dry cleaned only?"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "ticketNumber": "TKT-20261104-4821",
    "status": "OPEN",
    "createdAt": "2026-11-04T12:05:00.000Z"
  }
  ```

---

## 4. Supplier Hub Endpoints

### 4.1 Query Supplier Order Lines
`GET /api/supplier/orders?fulfillmentStatus=NEW`
- **Headers:** Supplier Session Cookie
- **Response (200 OK):**
  ```json
  {
    "orderLines": [
      {
        "id": "item_silk_001",
        "orderId": "ORD-2026-6F7AF890D736",
        "productSlug": "chanderi-silk-saree",
        "title": "Chanderi Silk Saree with Antique Zari",
        "quantity": 1,
        "lineTotalPaise": 1500000,
        "fulfillmentStatus": "NEW",
        "vendorId": "seller_chanderi_guild"
      }
    ]
  }
  ```

### 4.2 Update Fulfillment Status
`PATCH /api/supplier/orders/{orderItemId}/status`
- **Request Body:**
  ```json
  {
    "status": "PROCESSING"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "orderItemId": "item_silk_001",
    "fulfillmentStatus": "PROCESSING"
  }
  ```

---

## 5. Webhook Ingestion Endpoints

### 5.1 Payment Gateway Webhook
`POST /api/webhooks/razorpay`
- **Headers:** `X-Razorpay-Signature: <hmac_hex_digest>`
- **Response (200 OK):**
  ```json
  {
    "status": "PROCESSED",
    "eventId": "evt_rzp_123456"
  }
  ```
