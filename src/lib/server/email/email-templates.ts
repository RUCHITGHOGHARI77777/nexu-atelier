/**
 * NEXU ATELIER — Branded Transactional Email Templates
 *
 * Implements luxury editorial email templates with responsive tables,
 * typography hierarchy, dark text (#17191F), signature NEXU blue (#2457C5),
 * and clean fallback plain-text rendering.
 */

export interface EmailRenderResult {
  subject: string;
  html: string;
  text: string;
}

interface LayoutOptions {
  title: string;
  preheader?: string;
  contentHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  orderSummary?: {
    orderId: string;
    totalAmount: string;
    itemsCount?: number;
  };
}

const BRAND_NAME = "NEXU ATELIER";
const SUPPORT_EMAIL = "concierge@nexuatelier.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://nexuatelier.com";

/**
 * Universal Luxury Responsive Email Layout
 */
function wrapInLuxuryLayout(options: LayoutOptions): string {
  const { title, preheader = "", contentHtml, ctaText, ctaUrl } = options;

  const ctaButtonHtml =
    ctaText && ctaUrl
      ? `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 32px 0 16px 0;">
        <tr>
          <td align="left">
            <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: #17191F; color: #FFFFFF; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; text-decoration: none; border-radius: 6px;">
              ${ctaText} &rarr;
            </a>
          </td>
        </tr>
      </table>
    `
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; }
    a { color: #2457C5; text-decoration: underline; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 16px !important; }
      .content-card { padding: 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA;">
  <!-- Hidden Preheader -->
  <span style="display: none; font-size: 1px; color: #F8F9FA; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
  </span>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #F8F9FA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" class="container" width="560" border="0" cellpadding="0" cellspacing="0" style="width: 560px; max-width: 560px;">
          <!-- Brand Header -->
          <tr>
            <td align="left" style="padding-bottom: 24px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left">
                    <span style="font-size: 16px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #17191F;">
                      ${BRAND_NAME}
                    </span>
                    <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #717684; margin-top: 2px;">
                      Haute Artisan Commerce
                    </span>
                  </td>
                  <td align="right">
                    <a href="${APP_URL}" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #717684; text-decoration: none;">
                      Visit Atelier
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Card -->
          <tr>
            <td class="content-card" style="background-color: #FFFFFF; border: 1px solid #E4E7EC; border-radius: 12px; padding: 36px 36px 32px 36px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);">
              <h1 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 600; line-height: 1.3; color: #17191F; letter-spacing: -0.01em;">
                ${title}
              </h1>

              <div style="font-size: 14px; line-height: 1.65; color: #414651;">
                ${contentHtml}
              </div>

              ${ctaButtonHtml}

              <!-- Divider -->
              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #F2F4F7; font-size: 12px; color: #717684; line-height: 1.5;">
                Need assistance with this dispatch? Contact the Atelier Concierge at 
                <a href="mailto:${SUPPORT_EMAIL}" style="color: #17191F; text-decoration: underline;">${SUPPORT_EMAIL}</a>.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 28px; font-size: 11px; line-height: 1.6; color: #98A2B3;">
              <p style="margin: 0 0 4px 0;">
                &copy; ${new Date().getFullYear()} NEXU ATELIER. All rights reserved.
              </p>
              <p style="margin: 0;">
                Direct-from-artisan heritage craft marketplace. Sent to your verified account email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================================================
// CUSTOMER NOTIFICATION TEMPLATES
// ============================================================================

export function renderWelcomeEmail(payload: { name: string; email: string; couponCode?: string }): EmailRenderResult {
  const coupon = payload.couponCode || "NEXUFIRST";
  const title = `Welcome to NEXU ATELIER, ${payload.name}`;
  const preheader = "Discover authentic heirloom craft directly from master Indian craft studios.";

  const contentHtml = `
    <p>We are delighted to welcome you to the NEXU ATELIER community. Our platform bridges discerning patrons directly with vetted master artisan guilds across India, eliminating middlemen to preserve cultural heritage.</p>
    <div style="margin: 24px 0; padding: 20px; background-color: #F8F9FA; border-left: 3px solid #2457C5; border-radius: 4px;">
      <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #717684; margin-bottom: 4px;">Your Patron Welcome Privilege</span>
      <span style="font-size: 18px; font-weight: 700; color: #17191F; font-family: monospace; letter-spacing: 0.05em;">${coupon}</span>
      <span style="display: block; font-size: 12px; color: #414651; margin-top: 4px;">Enjoy 15% off your inaugural artisan acquisition.</span>
    </div>
    <p>Every piece in our catalog is cataloged with origin provenance, artisan lineage, and strict quality verification.</p>
  `;

  return {
    subject: `Welcome to NEXU ATELIER — Exclusive Patron Privileges`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "Explore The Collections",
      ctaUrl: `${APP_URL}/catalog`,
    }),
    text: `Welcome to NEXU ATELIER, ${payload.name}!\nDiscover authentic heirloom craft directly from master Indian craft studios.\nYour welcome code: ${coupon} (15% off inaugural order).\nExplore: ${APP_URL}/catalog`,
  };
}

export function renderAccountVerifiedEmail(payload: { name: string; identifier: string }): EmailRenderResult {
  const title = "Account Verified — NEXU ATELIER";
  const preheader = "Your security credentials have been successfully authenticated.";

  const contentHtml = `
    <p>Dear ${payload.name},</p>
    <p>Your NEXU ATELIER account security credentials associated with <strong>${payload.identifier}</strong> have been successfully verified.</p>
    <p>You now enjoy full patron privileges including express multi-store checkout, instant UPI verification, and dedicated tracking concierge.</p>
  `;

  return {
    subject: `Account Credential Verified | NEXU ATELIER`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "View Your Account",
      ctaUrl: `${APP_URL}/account`,
    }),
    text: `Dear ${payload.name},\nYour account credentials (${payload.identifier}) have been successfully verified at NEXU ATELIER.\nManage account: ${APP_URL}/account`,
  };
}

export function renderOrderConfirmedEmail(payload: {
  orderId: string;
  customerName: string;
  totalINR: string | number;
  itemsCount?: number;
  estimatedDeliveryDate?: string;
  shippingAddress?: string;
}): EmailRenderResult {
  const title = `Commission Confirmed — Order ${payload.orderId}`;
  const preheader = `Your order of ₹${payload.totalINR} has been confirmed and routed to artisan studios.`;

  const contentHtml = `
    <p>Dear ${payload.customerName},</p>
    <p>Thank you for acquiring authentic craftsmanship. Your order <strong>${payload.orderId}</strong> has been received and routed directly to the designated artisan studios for preparation.</p>
    <div style="margin: 20px 0; padding: 18px; background-color: #F8F9FA; border-radius: 8px; border: 1px solid #EAECF0;">
      <table role="presentation" width="100%" style="font-size: 13px; color: #414651;">
        <tr>
          <td style="padding: 4px 0; color: #717684;">Order Reference:</td>
          <td align="right" style="font-weight: 600; color: #17191F; font-family: monospace;">${payload.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #717684;">Total Investment:</td>
          <td align="right" style="font-weight: 700; color: #17191F;">₹${payload.totalINR}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #717684;">Estimated Dispatch:</td>
          <td align="right" style="color: #17191F;">${payload.estimatedDeliveryDate || "2-3 business days"}</td>
        </tr>
      </table>
    </div>
    <p>You will receive dispatch confirmation and 3PL courier tracking as soon as master craftspeople package your parcel.</p>
  `;

  return {
    subject: `Order Confirmed: ${payload.orderId} | NEXU ATELIER`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "Track Your Order",
      ctaUrl: `${APP_URL}/track-order?orderId=${payload.orderId}`,
    }),
    text: `Dear ${payload.customerName},\nYour order ${payload.orderId} of ₹${payload.totalINR} is confirmed.\nTrack live: ${APP_URL}/track-order?orderId=${payload.orderId}`,
  };
}

export function renderPaymentConfirmedEmail(payload: {
  orderId: string;
  customerName: string;
  totalINR: string | number;
  paymentMethod: string;
  transactionRef: string;
}): EmailRenderResult {
  const title = `Payment Verified — ₹${payload.totalINR}`;
  const preheader = `Receipt for order ${payload.orderId}. Transaction ref: ${payload.transactionRef}.`;

  const contentHtml = `
    <p>Dear ${payload.customerName},</p>
    <p>We have successfully verified your payment for order <strong>${payload.orderId}</strong>.</p>
    <div style="margin: 20px 0; padding: 18px; background-color: #F8F9FA; border-radius: 8px; border: 1px solid #EAECF0;">
      <table role="presentation" width="100%" style="font-size: 13px; color: #414651;">
        <tr>
          <td style="padding: 4px 0; color: #717684;">Amount Paid:</td>
          <td align="right" style="font-weight: 700; color: #17191F;">₹${payload.totalINR}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #717684;">Payment Gateway / Method:</td>
          <td align="right" style="color: #17191F;">${payload.paymentMethod}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #717684;">Transaction Reference (UTR):</td>
          <td align="right" style="font-family: monospace; color: #17191F;">${payload.transactionRef}</td>
        </tr>
      </table>
    </div>
    <p>Your itemized GST tax invoice is available for download in your customer account history.</p>
  `;

  return {
    subject: `Payment Receipt: Order ${payload.orderId} (₹${payload.totalINR})`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "View Invoice & Receipt",
      ctaUrl: `${APP_URL}/account/orders`,
    }),
    text: `Payment Receipt for order ${payload.orderId}:\nAmount: ₹${payload.totalINR}\nMethod: ${payload.paymentMethod}\nUTR Ref: ${payload.transactionRef}\nInvoices: ${APP_URL}/account/orders`,
  };
}

export function renderOrderShippedEmail(payload: {
  orderId: string;
  customerName: string;
  carrierName: string;
  trackingNumber: string;
  trackingUrl?: string;
}): EmailRenderResult {
  const title = "Your Artisan Parcel has Dispatched";
  const preheader = `Carrier: ${payload.carrierName} — AWB ${payload.trackingNumber}.`;

  const contentHtml = `
    <p>Dear ${payload.customerName},</p>
    <p>Your order <strong>${payload.orderId}</strong> has been carefully inspected, sealed in tamper-evident packaging, and handed over to our verified logistics partner <strong>${payload.carrierName}</strong>.</p>
    <div style="margin: 20px 0; padding: 18px; background-color: #F8F9FA; border-radius: 8px; border: 1px solid #EAECF0;">
      <p style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #717684;">Air Waybill (AWB)</p>
      <p style="margin: 0; font-size: 18px; font-weight: 700; font-family: monospace; color: #17191F;">${payload.trackingNumber}</p>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #414651;">Fulfillment Carrier: ${payload.carrierName}</p>
    </div>
    <p>Real-time milestone scans will synchronize automatically on our bidirectional tracking console.</p>
  `;

  return {
    subject: `Dispatched: Order ${payload.orderId} via ${payload.carrierName}`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "Track Parcel Live",
      ctaUrl: payload.trackingUrl || `${APP_URL}/track-order?orderId=${payload.orderId}`,
    }),
    text: `Dear ${payload.customerName},\nYour order ${payload.orderId} is dispatched via ${payload.carrierName}.\nAWB Tracking: ${payload.trackingNumber}\nTrack: ${APP_URL}/track-order?orderId=${payload.orderId}`,
  };
}

export function renderDeliveryUpdateEmail(payload: {
  orderId: string;
  customerName: string;
  status: string;
  location?: string;
  timestamp?: string;
}): EmailRenderResult {
  const title = `Delivery Update: Order ${payload.orderId}`;
  const preheader = `Status update: ${payload.status}.`;

  const contentHtml = `
    <p>Dear ${payload.customerName},</p>
    <p>We have received a logistics checkpoint update for your parcel:</p>
    <div style="margin: 18px 0; padding: 16px; background-color: #F8F9FA; border-left: 3px solid #17191F; border-radius: 4px;">
      <p style="margin: 0; font-size: 15px; font-weight: 600; color: #17191F;">${payload.status}</p>
      ${payload.location ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #717684;">Location: ${payload.location}</p>` : ""}
    </div>
    <p>Our concierge monitors every artisan parcel until safely delivered to your doorstep.</p>
  `;

  return {
    subject: `Delivery Status Update — Order ${payload.orderId}`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "Check Tracking Timeline",
      ctaUrl: `${APP_URL}/track-order?orderId=${payload.orderId}`,
    }),
    text: `Order ${payload.orderId} Update:\nStatus: ${payload.status}\nLocation: ${payload.location || "In Transit"}\nTrack: ${APP_URL}/track-order?orderId=${payload.orderId}`,
  };
}

export function renderOrderDeliveredEmail(payload: {
  orderId: string;
  customerName: string;
  deliveredAt?: string;
}): EmailRenderResult {
  const title = "Your Artisan Parcel has Arrived";
  const preheader = "Delivered safely. Thank you for supporting indigenous craftsmanship.";

  const contentHtml = `
    <p>Dear ${payload.customerName},</p>
    <p>Our courier records indicate that your NEXU ATELIER parcel for order <strong>${payload.orderId}</strong> has been successfully delivered.</p>
    <p>We trust your piece brings timeless elegance to your collection. Every acquisition directly supports master artisans and their local communities.</p>
    <p>If you have any questions or require care instructions for your natural handloom textiles or brassware, our concierge is at your service.</p>
  `;

  return {
    subject: `Delivered: Your NEXU ATELIER Parcel Has Arrived`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "Review Your Acquisition",
      ctaUrl: `${APP_URL}/account/orders`,
    }),
    text: `Dear ${payload.customerName},\nYour order ${payload.orderId} has been successfully delivered.\nLeave a review: ${APP_URL}/account/orders`,
  };
}

export function renderOrderCancelledEmail(payload: {
  orderId: string;
  customerName: string;
  reason?: string;
  refundInitiated?: boolean;
  refundAmountINR?: string | number;
}): EmailRenderResult {
  const title = `Order Cancellation — ${payload.orderId}`;
  const preheader = `Your order ${payload.orderId} has been cancelled.`;

  const contentHtml = `
    <p>Dear ${payload.customerName},</p>
    <p>Your order <strong>${payload.orderId}</strong> has been successfully cancelled.</p>
    <p>Reason: <em>${payload.reason || "Patron pre-dispatch request"}</em>.</p>
    ${
      payload.refundInitiated
        ? `<div style="margin: 18px 0; padding: 16px; background-color: #F8F9FA; border-radius: 6px; border: 1px solid #EAECF0;">
            <p style="margin: 0; font-size: 13px; font-weight: 600; color: #17191F;">Escrow Refund Initiated: ₹${payload.refundAmountINR || ""}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #717684;">Refunds typically reflect in your original payment source within 3-5 banking business days.</p>
           </div>`
        : `<p>Any pre-authorized reservations on your card or UPI have been automatically released.</p>`
    }
    <p>Reserved studio inventory has been returned to the artisan's active catalog.</p>
  `;

  return {
    subject: `Order Cancelled: ${payload.orderId} | NEXU ATELIER`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "Return to Catalog",
      ctaUrl: `${APP_URL}/catalog`,
    }),
    text: `Dear ${payload.customerName},\nYour order ${payload.orderId} has been cancelled. Reason: ${payload.reason || "Customer request"}.\nExplore catalog: ${APP_URL}/catalog`,
  };
}

export function renderRefundUpdateEmail(payload: {
  orderId: string;
  customerName: string;
  amountINR: string | number;
  refundId: string;
  status: string;
  gatewayRef?: string;
}): EmailRenderResult {
  const title = `Refund Processed — ₹${payload.amountINR}`;
  const preheader = `Refund for order ${payload.orderId} (Ref: ${payload.refundId}).`;

  const contentHtml = `
    <p>Dear ${payload.customerName},</p>
    <p>A refund of <strong>₹${payload.amountINR}</strong> has been issued for order <strong>${payload.orderId}</strong>.</p>
    <div style="margin: 20px 0; padding: 18px; background-color: #F8F9FA; border-radius: 8px; border: 1px solid #EAECF0;">
      <table role="presentation" width="100%" style="font-size: 13px; color: #414651;">
        <tr>
          <td style="padding: 4px 0; color: #717684;">Refund Identifier:</td>
          <td align="right" style="font-family: monospace; color: #17191F;">${payload.refundId}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #717684;">Refund Amount:</td>
          <td align="right" style="font-weight: 700; color: #17191F;">₹${payload.amountINR}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #717684;">Settlement Status:</td>
          <td align="right" style="font-weight: 600; color: #027A48;">${payload.status}</td>
        </tr>
      </table>
    </div>
    <p>Depending on your issuing bank, the credit will appear in your statement within 3 to 5 banking days.</p>
  `;

  return {
    subject: `Refund Notice: ₹${payload.amountINR} Processed for Order ${payload.orderId}`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "View Account Statements",
      ctaUrl: `${APP_URL}/account/orders`,
    }),
    text: `Refund Notice:\nOrder: ${payload.orderId}\nAmount: ₹${payload.amountINR}\nRef: ${payload.refundId}\nStatus: ${payload.status}`,
  };
}

export function renderPasswordResetEmail(payload: {
  name: string;
  resetUrl: string;
  expiryMinutes?: number;
}): EmailRenderResult {
  const title = "Password Recovery Instructions";
  const preheader = "Reset your NEXU ATELIER account password.";
  const expiry = payload.expiryMinutes || 60;

  const contentHtml = `
    <p>Dear ${payload.name},</p>
    <p>We received a request to reset the password for your NEXU ATELIER account. Click the secure link below to establish a new password.</p>
    <p style="font-size: 12px; color: #717684;">This link expires in <strong>${expiry} minutes</strong> and can only be used once.</p>
    <p style="font-size: 12px; color: #717684;">If you did not request this password recovery, you can safely disregard this email. Your credentials remain secure.</p>
  `;

  return {
    subject: `Password Recovery Request | NEXU ATELIER`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "Reset Password",
      ctaUrl: payload.resetUrl,
    }),
    text: `Dear ${payload.name},\nReset your NEXU ATELIER password using this link (valid for ${expiry} minutes):\n${payload.resetUrl}\nIf you did not request this, please ignore.`,
  };
}

export function renderSecurityAlertEmail(payload: {
  name: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
}): EmailRenderResult {
  const title = "Account Security Alert";
  const preheader = `Important security event on your NEXU ATELIER account: ${payload.action}.`;

  const contentHtml = `
    <p>Dear ${payload.name},</p>
    <p>We detected an important security action on your NEXU ATELIER account:</p>
    <div style="margin: 20px 0; padding: 18px; background-color: #FEF3F2; border-radius: 8px; border: 1px solid #FECDCA;">
      <p style="margin: 0; font-weight: 600; color: #B42318; font-size: 14px;">${payload.action}</p>
      ${payload.ipAddress ? `<p style="margin: 6px 0 0 0; font-size: 12px; color: #7A271A;">Origin IP: ${payload.ipAddress}</p>` : ""}
      ${payload.timestamp ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #7A271A;">Time: ${payload.timestamp}</p>` : ""}
    </div>
    <p>If you performed this action, no further steps are needed. If you did not recognize this activity, please immediately change your password and review your account privacy settings.</p>
  `;

  return {
    subject: `Security Alert: ${payload.action} | NEXU ATELIER`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "Review Account Security",
      ctaUrl: `${APP_URL}/account/privacy`,
    }),
    text: `Security Alert: ${payload.action}\nIP: ${payload.ipAddress || "Unknown"}\nIf this was not you, update your password immediately at ${APP_URL}/account/privacy`,
  };
}

// ============================================================================
// SUPPLIER / VENDOR NOTIFICATION TEMPLATES
// ============================================================================

export function renderSupplierNewOrderEmail(payload: {
  supplierName: string;
  orderId: string;
  itemsCount: number;
  totalPayoutINR: string | number;
  dispatchDeadline?: string;
}): EmailRenderResult {
  const title = `New Order Allocated — ${payload.orderId}`;
  const preheader = `Order ${payload.orderId}: ${payload.itemsCount} line items awaiting packing slip generation.`;

  const contentHtml = `
    <p>Dear ${payload.supplierName},</p>
    <p>A new customer order has been confirmed and allocated to your atelier studio:</p>
    <div style="margin: 20px 0; padding: 18px; background-color: #F8F9FA; border-radius: 8px; border: 1px solid #EAECF0;">
      <table role="presentation" width="100%" style="font-size: 13px; color: #414651;">
        <tr>
          <td style="padding: 4px 0; color: #717684;">Order Reference:</td>
          <td align="right" style="font-family: monospace; font-weight: 600; color: #17191F;">${payload.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #717684;">Allocated Line Items:</td>
          <td align="right" style="color: #17191F;">${payload.itemsCount}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #717684;">Net Supplier Settlement:</td>
          <td align="right" style="font-weight: 700; color: #027A48;">₹${payload.totalPayoutINR}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #717684;">Dispatch SLA Deadline:</td>
          <td align="right" style="color: #17191F;">${payload.dispatchDeadline || "Within 48 hours"}</td>
        </tr>
      </table>
    </div>
    <p>Please log in to your Supplier Hub, print the branded packaging slip, and schedule courier pickup.</p>
  `;

  return {
    subject: `New Order Allocated: ${payload.orderId} | Supplier Hub`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "Open Order Fulfillment Queue",
      ctaUrl: `${APP_URL}/seller/orders`,
    }),
    text: `New Order for ${payload.supplierName}:\nOrder: ${payload.orderId}\nItems: ${payload.itemsCount}\nPayout: ₹${payload.totalPayoutINR}\nFulfill now: ${APP_URL}/seller/orders`,
  };
}

export function renderSupplierOrderStatusEmail(payload: {
  supplierName: string;
  orderId: string;
  oldStatus: string;
  newStatus: string;
}): EmailRenderResult {
  const title = `Order Status Updated — ${payload.orderId}`;
  const preheader = `Status transitioned from ${payload.oldStatus} to ${payload.newStatus}.`;

  const contentHtml = `
    <p>Dear ${payload.supplierName},</p>
    <p>The status of order <strong>${payload.orderId}</strong> has been updated:</p>
    <div style="margin: 18px 0; padding: 16px; background-color: #F8F9FA; border-radius: 6px; border: 1px solid #EAECF0;">
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #17191F;">New Status: ${payload.newStatus}</p>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #717684;">Previous Status: ${payload.oldStatus}</p>
    </div>
  `;

  return {
    subject: `Order ${payload.orderId} Status: ${payload.newStatus}`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "View Order in Hub",
      ctaUrl: `${APP_URL}/seller/orders`,
    }),
    text: `Order ${payload.orderId} status changed from ${payload.oldStatus} to ${payload.newStatus}.\nView in Hub: ${APP_URL}/seller/orders`,
  };
}

export function renderSupplierProductApprovedEmail(payload: {
  supplierName: string;
  productTitle: string;
  productId: string;
  slug: string;
}): EmailRenderResult {
  const title = "Product Approved & Published to Catalog";
  const preheader = `"${payload.productTitle}" is now live on the public marketplace.`;

  const contentHtml = `
    <p>Dear ${payload.supplierName},</p>
    <p>Great news! Your product submission <strong>"${payload.productTitle}"</strong> has passed curation moderation and is now published to the public marketplace.</p>
    <p>Discerning patrons can now discover, bookmark, and commission your piece directly.</p>
  `;

  return {
    subject: `Approved: "${payload.productTitle}" is Live on NEXU ATELIER`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "View Live Product",
      ctaUrl: `${APP_URL}/product/${payload.slug}`,
    }),
    text: `Congratulations ${payload.supplierName}!\n"${payload.productTitle}" has been approved and published to NEXU ATELIER.\nView live: ${APP_URL}/product/${payload.slug}`,
  };
}

export function renderSupplierProductRejectedEmail(payload: {
  supplierName: string;
  productTitle: string;
  productId: string;
  feedback: string;
}): EmailRenderResult {
  const title = "Product Revision Requested";
  const preheader = `Curation feedback for "${payload.productTitle}".`;

  const contentHtml = `
    <p>Dear ${payload.supplierName},</p>
    <p>Our curation team reviewed your product submission <strong>"${payload.productTitle}"</strong> and requested revisions before it can be published.</p>
    <div style="margin: 20px 0; padding: 18px; background-color: #FEF3F2; border-radius: 8px; border: 1px solid #FECDCA;">
      <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #B42318; margin-bottom: 4px;">Curator Notes:</span>
      <p style="margin: 0; font-size: 13px; color: #7A271A; line-height: 1.6;">${payload.feedback}</p>
    </div>
    <p>Please open the Correction Assistant in your Supplier Hub to update your listing and re-submit for review.</p>
  `;

  return {
    subject: `Changes Requested: "${payload.productTitle}" | NEXU ATELIER`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "Edit Product in Hub",
      ctaUrl: `${APP_URL}/seller/products/${payload.productId}`,
    }),
    text: `Revision requested for "${payload.productTitle}".\nFeedback: ${payload.feedback}\nEdit now: ${APP_URL}/seller/products/${payload.productId}`,
  };
}

export function renderSupplierReturnRequestEmail(payload: {
  supplierName: string;
  orderId: string;
  reason: string;
  disputeId: string;
}): EmailRenderResult {
  const title = `Return Request Received — Order ${payload.orderId}`;
  const preheader = `Dispute ticket: ${payload.disputeId}.`;

  const contentHtml = `
    <p>Dear ${payload.supplierName},</p>
    <p>A patron has initiated a return/replacement request for order <strong>${payload.orderId}</strong>.</p>
    <div style="margin: 20px 0; padding: 18px; background-color: #F8F9FA; border-radius: 8px; border: 1px solid #EAECF0;">
      <p style="margin: 0; font-size: 13px; color: #17191F;"><strong>Ticket ID:</strong> ${payload.disputeId}</p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #414651;"><strong>Reason:</strong> ${payload.reason}</p>
    </div>
    <p>Please review the request and images within 48 hours to authorize return logistics or provide studio resolution.</p>
  `;

  return {
    subject: `Return Request: Order ${payload.orderId} (${payload.disputeId})`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "Review Dispute in Hub",
      ctaUrl: `${APP_URL}/seller`,
    }),
    text: `Return request on order ${payload.orderId} (${payload.disputeId}):\nReason: ${payload.reason}\nReview: ${APP_URL}/seller`,
  };
}

export function renderSupplierSettlementEmail(payload: {
  supplierName: string;
  payoutId: string;
  amountINR: string | number;
  utrReference: string;
  bankLast4?: string;
}): EmailRenderResult {
  const title = `Escrow Settlement Released — ₹${payload.amountINR}`;
  const preheader = `Payout ${payload.payoutId} settled to your registered account.`;

  const contentHtml = `
    <p>Dear ${payload.supplierName},</p>
    <p>We have released escrow funds for your fulfilled orders. A payout of <strong>₹${payload.amountINR}</strong> has been transferred via NEFT/IMPS to your registered bank account ${payload.bankLast4 ? `(ending in ${payload.bankLast4})` : ""}.</p>
    <div style="margin: 20px 0; padding: 18px; background-color: #F8F9FA; border-radius: 8px; border: 1px solid #EAECF0;">
      <table role="presentation" width="100%" style="font-size: 13px; color: #414651;">
        <tr>
          <td style="padding: 4px 0; color: #717684;">Settlement Ref:</td>
          <td align="right" style="font-family: monospace; color: #17191F;">${payload.payoutId}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #717684;">Bank UTR Number:</td>
          <td align="right" style="font-family: monospace; font-weight: 700; color: #027A48;">${payload.utrReference}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #717684;">Net Amount Transferred:</td>
          <td align="right" style="font-weight: 700; color: #17191F;">₹${payload.amountINR}</td>
        </tr>
      </table>
    </div>
    <p>Financial statements and tax certificates are accessible on your Seller Finances dashboard.</p>
  `;

  return {
    subject: `Settlement Paid: ₹${payload.amountINR} (UTR: ${payload.utrReference})`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "View Finances & Reports",
      ctaUrl: `${APP_URL}/seller/finances`,
    }),
    text: `Settlement Paid to ${payload.supplierName}:\nAmount: ₹${payload.amountINR}\nBank UTR: ${payload.utrReference}\nStatements: ${APP_URL}/seller/finances`,
  };
}

// ============================================================================
// ADMIN NOTIFICATION TEMPLATES
// ============================================================================

export function renderAdminSupplierApplicationEmail(payload: {
  studioName: string;
  ownerName: string;
  email: string;
  city: string;
  state: string;
}): EmailRenderResult {
  const title = `New Studio Application: ${payload.studioName}`;
  const preheader = `${payload.ownerName} from ${payload.city}, ${payload.state} submitted an onboarding application.`;

  const contentHtml = `
    <p>A new artisan studio has submitted an onboarding application for NEXU ATELIER:</p>
    <div style="margin: 20px 0; padding: 18px; background-color: #F8F9FA; border-radius: 8px; border: 1px solid #EAECF0;">
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #17191F;">${payload.studioName}</p>
      <p style="margin: 4px 0; font-size: 13px; color: #414651;">Applicant: ${payload.ownerName} (${payload.email})</p>
      <p style="margin: 0; font-size: 13px; color: #717684;">Location: ${payload.city}, ${payload.state}</p>
    </div>
    <p>Please review KYB documentation and artisan credentials in the Super Admin Command Center.</p>
  `;

  return {
    subject: `[Admin] New Studio Application: ${payload.studioName}`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "Review KYB & Onboard",
      ctaUrl: `${APP_URL}/admin/sellers`,
    }),
    text: `New Studio Application:\nStudio: ${payload.studioName}\nOwner: ${payload.ownerName} (${payload.email})\nLocation: ${payload.city}, ${payload.state}\nReview: ${APP_URL}/admin/sellers`,
  };
}

export function renderAdminPlatformAlertEmail(payload: {
  title: string;
  message: string;
  severity?: "INFO" | "WARNING" | "CRITICAL";
}): EmailRenderResult {
  const severity = payload.severity || "INFO";
  const title = `[Platform Alert] ${payload.title}`;
  const preheader = `Severity: ${severity}. ${payload.message}`;

  const contentHtml = `
    <p>An automated platform alert was triggered:</p>
    <div style="margin: 20px 0; padding: 18px; background-color: #F8F9FA; border-radius: 8px; border-left: 4px solid ${
      severity === "CRITICAL" ? "#D92D20" : severity === "WARNING" ? "#F79009" : "#2457C5"
    };">
      <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #17191F;">Severity: ${severity}</span>
      <p style="margin: 8px 0 0 0; font-size: 14px; color: #414651; line-height: 1.6;">${payload.message}</p>
    </div>
  `;

  return {
    subject: `[Platform Alert - ${severity}] ${payload.title}`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "Open Admin Center",
      ctaUrl: `${APP_URL}/admin`,
    }),
    text: `[Platform Alert - ${severity}] ${payload.title}\n${payload.message}\nAdmin Console: ${APP_URL}/admin`,
  };
}

export function renderAdminTransactionFailureEmail(payload: {
  orderId: string;
  customerEmail: string;
  amountINR: string | number;
  reason: string;
  gatewayError?: string;
}): EmailRenderResult {
  const title = `Transaction Declined — Order ${payload.orderId}`;
  const preheader = `Payment failure of ₹${payload.amountINR} for ${payload.customerEmail}.`;

  const contentHtml = `
    <p>A customer payment transaction has failed at the gateway:</p>
    <div style="margin: 20px 0; padding: 18px; background-color: #FEF3F2; border-radius: 8px; border: 1px solid #FECDCA;">
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #B42318;">Order: ${payload.orderId}</p>
      <p style="margin: 4px 0; font-size: 13px; color: #7A271A;">Customer: ${payload.customerEmail} | Amount: ₹${payload.amountINR}</p>
      <p style="margin: 0; font-size: 12px; color: #7A271A;">Gateway Error: ${payload.reason}</p>
    </div>
    <p>Inventory holds remain active for 15 minutes before automated stock restoration.</p>
  `;

  return {
    subject: `[Admin Alert] Payment Failure on Order ${payload.orderId}`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "Inspect Order in Admin",
      ctaUrl: `${APP_URL}/admin/orders`,
    }),
    text: `Payment Failure Alert:\nOrder: ${payload.orderId}\nCustomer: ${payload.customerEmail}\nAmount: ₹${payload.amountINR}\nError: ${payload.reason}`,
  };
}

export function renderAdminDisputeAlertEmail(payload: {
  disputeId: string;
  orderId: string;
  customerName: string;
  supplierName: string;
  reason: string;
}): EmailRenderResult {
  const title = `New Dispute Escalation — ${payload.disputeId}`;
  const preheader = `Dispute filed on order ${payload.orderId}.`;

  const contentHtml = `
    <p>A customer dispute has been submitted for administrative arbitration:</p>
    <div style="margin: 20px 0; padding: 18px; background-color: #F8F9FA; border-radius: 8px; border: 1px solid #EAECF0;">
      <table role="presentation" width="100%" style="font-size: 13px; color: #414651;">
        <tr>
          <td style="padding: 4px 0; color: #717684;">Dispute Ticket:</td>
          <td align="right" style="font-family: monospace; font-weight: 600; color: #17191F;">${payload.disputeId}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #717684;">Order:</td>
          <td align="right" style="font-family: monospace; color: #17191F;">${payload.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #717684;">Customer:</td>
          <td align="right" style="color: #17191F;">${payload.customerName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #717684;">Studio:</td>
          <td align="right" style="color: #17191F;">${payload.supplierName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #717684;">Reason:</td>
          <td align="right" style="color: #17191F;">${payload.reason}</td>
        </tr>
      </table>
    </div>
  `;

  return {
    subject: `[Admin Dispute] Case ${payload.disputeId} Filed on Order ${payload.orderId}`,
    html: wrapInLuxuryLayout({
      title,
      preheader,
      contentHtml,
      ctaText: "Open Arbitration Console",
      ctaUrl: `${APP_URL}/admin/disputes`,
    }),
    text: `Dispute Case ${payload.disputeId} on Order ${payload.orderId}:\nCustomer: ${payload.customerName}\nSupplier: ${payload.supplierName}\nReason: ${payload.reason}\nResolve: ${APP_URL}/admin/disputes`,
  };
}

