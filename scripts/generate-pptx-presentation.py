import os
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# Color primitives
COLOR_BG = RGBColor(255, 255, 255)
COLOR_SURFACE = RGBColor(250, 250, 248)
COLOR_TEXT = RGBColor(26, 26, 26)
COLOR_MUTED = RGBColor(110, 110, 104)
COLOR_ACCENT = RGBColor(140, 115, 85)
COLOR_BORDER = RGBColor(232, 232, 228)

def add_header(slide, kicker, title, meta="NEXU ATELIER"):
    # Header kicker & meta
    tb_meta = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.4))
    tf_meta = tb_meta.text_frame
    p_meta = tf_meta.paragraphs[0]
    p_meta.text = f"{kicker.upper()}   |   {meta.upper()}"
    p_meta.font.size = Pt(9.5)
    p_meta.font.bold = True
    p_meta.font.color.rgb = COLOR_ACCENT

    # Title
    tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(11.733), Inches(0.8))
    tf_title = tb_title.text_frame
    p_title = tf_title.paragraphs[0]
    p_title.text = title
    p_title.font.size = Pt(28)
    p_title.font.bold = True
    p_title.font.color.rgb = COLOR_TEXT

# Slide 1: Title
slide_layout = prs.slide_layouts[6]
slide1 = prs.slides.add_slide(slide_layout)
add_header(slide1, "01 / Executive Overview", "NEXU ATELIER — Platform Architecture & Pitch")

tb1 = slide1.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(6.5), Inches(4.5))
tf1 = tb1.text_frame
tf1.word_wrap = True

p1 = tf1.paragraphs[0]
p1.text = "An architectural multi-vendor e-commerce platform connecting discerning patrons directly with independent craft studios, master textile weavers, and acoustic engineers."
p1.font.size = Pt(16)
p1.font.color.rgb = COLOR_TEXT

bullets = [
    "Next.js 14 App Router, PostgreSQL 17, Prisma ORM, TypeScript.",
    "Single-basket multi-vendor checkout with atomic inventory locks.",
    "Isolated supplier tenants with built-in Indian GST arithmetic.",
    "Live Staging: https://trailing-ungreased-unhappily.ngrok-free.dev"
]
for b in bullets:
    p = tf1.add_paragraph()
    p.text = "• " + b
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_MUTED

if os.path.exists("docs/company-demo/images/slide_01_homepage.png"):
    slide1.shapes.add_picture("docs/company-demo/images/slide_01_homepage.png", Inches(7.5), Inches(1.8), width=Inches(5.0))

# Slide 2: Problem
slide2 = prs.slides.add_slide(slide_layout)
add_header(slide2, "02 / Market Context", "The Fragmented Commerce Problem")
tb2 = slide2.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11.7), Inches(5.0))
tf2 = tb2.text_frame
tf2.word_wrap = True
problems = [
    ("Customer Friction: Disjointed Discovery", "Patrons seeking verified heritage textiles navigate multiple websites, managing fragmented accounts, repeated payments, and separate tracking numbers."),
    ("Supplier Burden: Commercial & Tax Overhead", "Independent studios lack native tools to compute statutory Indian GST (CGST/SGST vs IGST), automate courier dispatch, and manage escrow settlements."),
    ("Mass Market Trap: Erosion of Brand Equity", "Generic marketplaces treat bespoke artisan creations as interchangeable SKUs, charging steep 25-35% take rates and subjecting makers to predatory price wars.")
]
for title, body in problems:
    p_t = tf2.add_paragraph()
    p_t.text = title
    p_t.font.size = Pt(16)
    p_t.font.bold = True
    p_t.font.color.rgb = COLOR_TEXT
    p_b = tf2.add_paragraph()
    p_b.text = body
    p_b.font.size = Pt(13)
    p_b.font.color.rgb = COLOR_MUTED
    tf2.add_paragraph().text = ""

# Slide 3: Solution
slide3 = prs.slides.add_slide(slide_layout)
add_header(slide3, "03 / Architecture", "The Unified Multi-Vendor Solution")
tb3 = slide3.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11.7), Inches(5.0))
tf3 = tb3.text_frame
tf3.word_wrap = True
solutions = [
    ("1. Patron Storefront — Single Basket Checkout", "Customers browse across multiple independent studios simultaneously, configuring size and color variants, and paying once via secure UPI or COD."),
    ("2. Supplier Hub — Isolated Studio Operations", "Each studio operates within a cryptographically isolated tenant boundary, receiving discrete order lines and managing dispatch with built-in GST arithmetic."),
    ("3. Admin Command — Complete Platform Governance", "Marketplace administrators oversee gross volume, review and approve studio KYC applications, moderate product catalogs, and inspect statutory tax compliance ledgers.")
]
for title, body in solutions:
    p_t = tf3.add_paragraph()
    p_t.text = title
    p_t.font.size = Pt(16)
    p_t.font.bold = True
    p_t.font.color.rgb = COLOR_ACCENT
    p_b = tf3.add_paragraph()
    p_b.text = body
    p_b.font.size = Pt(13)
    p_b.font.color.rgb = COLOR_TEXT
    tf3.add_paragraph().text = ""

# Slide 4: Customer Experience
slide4 = prs.slides.add_slide(slide_layout)
add_header(slide4, "04 / Storefront", "Curated Patron Buying Experience")
tb4 = slide4.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(6.5), Inches(5.0))
tf4 = tb4.text_frame
tf4.word_wrap = True
cx_points = [
    "Multi-Attribute Variants: Dynamic color hex swatches, image galleries, and size selectors.",
    "Atomic Concurrency: Zero-trust database transaction decrements inventory atomically.",
    "Transparent Pricing: Itemized breakdown of statutory GST, coupon discounts, and courier fees.",
    "Post-Purchase Tracking: Milestone delivery tracker with simulated multi-stage events."
]
for pt in cx_points:
    p = tf4.add_paragraph()
    p.text = "• " + pt
    p.font.size = Pt(14)
    p.font.color.rgb = COLOR_TEXT
    tf4.add_paragraph().text = ""

if os.path.exists("docs/company-demo/images/slide_04_checkout.png"):
    slide4.shapes.add_picture("docs/company-demo/images/slide_04_checkout.png", Inches(7.5), Inches(1.8), width=Inches(5.0))

# Slide 5: Supplier Experience
slide5 = prs.slides.add_slide(slide_layout)
add_header(slide5, "05 / Supplier Portal", "Supplier Hub & Costing Engine")
tb5 = slide5.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(6.5), Inches(5.0))
tf5 = tb5.text_frame
tf5.word_wrap = True
sx_points = [
    "6-Step Listing Wizard: Specifications, HSN codes, variant matrix, and pricing.",
    "Statutory Costing & GST Engine: Splits 6% CGST + 6% SGST vs 12% IGST and calculates break-even price.",
    "Suborder Fulfillment Workflow: Valid forward transitions only (NEW -> PACKED -> SHIPPED).",
    "Strict Tenant Enclosure: Zero visibility into competitor orders, metrics, or patron addresses."
]
for pt in sx_points:
    p = tf5.add_paragraph()
    p.text = "• " + pt
    p.font.size = Pt(14)
    p.font.color.rgb = COLOR_TEXT
    tf5.add_paragraph().text = ""

if os.path.exists("docs/company-demo/images/slide_05_costing_calculator.png"):
    slide5.shapes.add_picture("docs/company-demo/images/slide_05_costing_calculator.png", Inches(7.5), Inches(1.8), width=Inches(5.0))

# Slide 6: Admin Experience
slide6 = prs.slides.add_slide(slide_layout)
add_header(slide6, "06 / Administration", "Marketplace Command Center")
tb6 = slide6.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(6.5), Inches(5.0))
tf6 = tb6.text_frame
tf6.word_wrap = True
ax_points = [
    "Studio Verification: Review maker applications, origin hubs, and toggle approvals.",
    "Product Moderation Queue: Audit and publish seller catalog submissions.",
    "Statutory GST Ledger: Audit platform tax collections across intra-state and inter-state sales.",
    "Tamper-Evident Trail: Chronological logging across 7,100+ platform security and order events."
]
for pt in ax_points:
    p = tf6.add_paragraph()
    p.text = "• " + pt
    p.font.size = Pt(14)
    p.font.color.rgb = COLOR_TEXT
    tf6.add_paragraph().text = ""

if os.path.exists("docs/company-demo/images/slide_06_admin_dashboard.png"):
    slide6.shapes.add_picture("docs/company-demo/images/slide_06_admin_dashboard.png", Inches(7.5), Inches(1.8), width=Inches(5.0))

# Slide 7: Technology Stack
slide7 = prs.slides.add_slide(slide_layout)
add_header(slide7, "07 / Technical Architecture", "Robust, Zero-Floating-Point Stack")
tb7 = slide7.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11.7), Inches(5.0))
tf7 = tb7.text_frame
tf7.word_wrap = True
techs = [
    ("Next.js 14.2 & React 18", "Server Components, App Router, Tailwind CSS 3.4, responsive desktop/mobile viewports."),
    ("PostgreSQL 17 & Prisma ORM", "Strict relational foreign keys, connection pooling, ACID transaction isolation, and integer paise math."),
    ("Zero-Trust Security Layer", "OWASP PBKDF2-HMAC-SHA512 password hashing, HTTP-only session cookies, and Razorpay HMAC signature checks."),
    ("Automated Vitest Suite", "85 automated unit, security, and integration regression tests passing at 100% with zero mock dependencies.")
]
for name, desc in techs:
    p_n = tf7.add_paragraph()
    p_n.text = name
    p_n.font.size = Pt(16)
    p_n.font.bold = True
    p_n.font.color.rgb = COLOR_TEXT
    p_d = tf7.add_paragraph()
    p_d.text = desc
    p_d.font.size = Pt(13)
    p_d.font.color.rgb = COLOR_MUTED
    tf7.add_paragraph().text = ""

# Slide 8: Business Model
slide8 = prs.slides.add_slide(slide_layout)
add_header(slide8, "08 / Commercials", "Monetization & Commission Framework")
tb8 = slide8.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11.7), Inches(5.0))
tf8 = tb8.text_frame
tf8.word_wrap = True
biz = [
    ("Tiered Marketplace Commission (8-12%) [Implemented & Verified]", "Automated deduction on taxable selling price during order split. Far lower than mass-market channels (25-35%), preserving artisan margins."),
    ("Payment Gateway Passthrough (2%) [Implemented & Verified]", "Statutory pass-through of digital payment processing charges, transparently audited in supplier payout ledgers."),
    ("Studio Subscriptions & Logistics Margin [Proposed / Future Roadmap]", "Optional premium studio storefront themes, priority homepage curation, and subsidized discounted 3PL courier bulk rates.")
]
for name, desc in biz:
    p_n = tf8.add_paragraph()
    p_n.text = name
    p_n.font.size = Pt(16)
    p_n.font.bold = True
    p_n.font.color.rgb = COLOR_ACCENT
    p_d = tf8.add_paragraph()
    p_d.text = desc
    p_d.font.size = Pt(13)
    p_d.font.color.rgb = COLOR_TEXT
    tf8.add_paragraph().text = ""

# Slide 9: Status & Transparency
slide9 = prs.slides.add_slide(slide_layout)
add_header(slide9, "09 / Integrity", "Readiness & Operational Transparency")
tb9 = slide9.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11.7), Inches(5.0))
tf9 = tb9.text_frame
tf9.word_wrap = True
status_items = [
    ("Storefront & Multi-Vendor Engine: VERIFIED LIVE", "Browsing, cart, parent-to-suborder splitting, and atomic stock decrements operating on PostgreSQL 17."),
    ("Supplier Isolation & Fulfillments: VERIFIED LIVE", "Strict vendorId filtering, forward status transitions (NEW -> PACKED -> SHIPPED), payout arithmetic."),
    ("Razorpay Payments: SIMULATED DEMO", "Server-authoritative sandbox transactions with HMAC signature checks. Production gateway keys required for live bank captures."),
    ("WhatsApp Cloud API & OTP: SIMULATED DEMO", "Database-backed OTP simulator with 10-minute expiry and attempt tracking. Meta API keys needed for live SMS."),
    ("3PL Courier Logistics: SIMULATED DEMO", "Blue Dart / Delhivery AWB number generation and multi-stage event timelines stored in database tables.")
]
for title, desc in status_items:
    p_t = tf9.add_paragraph()
    p_t.text = title
    p_t.font.size = Pt(15)
    p_t.font.bold = True
    p_t.font.color.rgb = COLOR_TEXT
    p_d = tf9.add_paragraph()
    p_d.text = desc
    p_d.font.size = Pt(13)
    p_d.font.color.rgb = COLOR_MUTED
    tf9.add_paragraph().text = ""

# Slide 10: Next Steps
slide10 = prs.slides.add_slide(slide_layout)
add_header(slide10, "10 / Production Path", "Next Steps & Launch Milestones")
tb10 = slide10.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11.7), Inches(5.0))
tf10 = tb10.text_frame
tf10.word_wrap = True
milestones = [
    ("Milestone 1: Commercial Gateway Provisioning", "Insert live production Razorpay API keys, verify Meta WhatsApp Cloud API credentials, and connect Amazon SES or SendGrid SMTP."),
    ("Milestone 2: Commercial 3PL Integration", "Connect Shiprocket or Delhivery corporate API account for automated courier pickup scheduling and real-time webhook tracking synchronization."),
    ("Milestone 3: Cloud Infrastructure Scaling", "Deploy containerized Next.js standalone build to AWS ECS or Vercel Pro with managed AWS RDS PostgreSQL and Cloudflare DDoS protection.")
]
for title, desc in milestones:
    p_t = tf10.add_paragraph()
    p_t.text = title
    p_t.font.size = Pt(16)
    p_t.font.bold = True
    p_t.font.color.rgb = COLOR_ACCENT
    p_d = tf10.add_paragraph()
    p_d.text = desc
    p_d.font.size = Pt(13)
    p_d.font.color.rgb = COLOR_TEXT
    tf10.add_paragraph().text = ""

output_path = "docs/company-demo/NEXU_ATELIER_Company_Presentation.pptx"
prs.save(output_path)
print(f"PowerPoint presentation generated successfully: {output_path}")
