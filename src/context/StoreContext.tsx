"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

export type RoleType = "customer" | "supplier" | "admin";

export interface SupplierInfo {
  id: string;
  name: string;
  location: string;
  rating: number;
  fulfillmentRate: string;
  verified: boolean;
  payoutOnHold?: boolean;
  joinedDate?: string;
  totalProductsCount?: number;
  totalSalesINR?: number;
}

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export interface StoreProduct {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: "Electronics" | "Fashion & Apparel" | "Home & Kitchen" | "B2B Wholesale Packs";
  price: number; // INR
  mrpPrice: number; // INR
  rating: number;
  reviewCount: number;
  stock: number;
  badge?: string;
  supplier: SupplierInfo;
  images: string[];
  colors?: { name: string; hex: string; image: string }[];
  sizes?: string[];
  specs: Record<string, string>;
  reviews: ReviewItem[];
  b2bMinMoq?: number;
}

export interface StoreCartItem {
  id: string;
  productId: string;
  product: StoreProduct;
  quantity: number;
  selectedColor?: { name: string; hex: string };
  selectedSize?: string;
}

export interface StoreOrder {
  id: string;
  items: StoreCartItem[];
  total: number;
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  discount: number;
  couponCode?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: string;
  paymentDetails: {
    method: string;
    upiId?: string;
    bankRef: string;
    utrNumber: string;
    paidAt: string;
    status: string;
  };
  deliveryStage: number; // 1 to 5
  deliveryStageName: string;
  awbNumber: string;
  courierPartner: string;
  estimatedDelivery: string;
  status: "CONFIRMED" | "PACKED" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED";
  createdAt: string;
}

export interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "info" | "warning";
}

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "info" | "warning";
  timestamp: number;
}

export interface B2BQuoteRequest {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  targetPriceINR?: number;
  companyName: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  gstin?: string;
  requirements: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

interface StoreContextType {
  products: StoreProduct[];
  cart: StoreCartItem[];
  wishlist: string[];
  orders: StoreOrder[];
  b2bQuotes: B2BQuoteRequest[];
  isB2BModalOpen: boolean;
  b2bModalProduct: StoreProduct | null;
  activeRole: RoleType;
  searchQuery: string;
  selectedCategory: string;
  sortBy: "featured" | "price-low" | "price-high" | "rating" | "discount";
  priceRange: [number, number];
  minRating: number;
  quickViewProduct: StoreProduct | null;
  toast: ToastState;
  toasts: ToastItem[];
  isCartDrawerOpen: boolean;
  // Actions
  openB2BModal: (product: StoreProduct) => void;
  closeB2BModal: () => void;
  submitB2BQuote: (quote: Omit<B2BQuoteRequest, "id" | "status" | "createdAt">) => void;
  updateB2BQuoteStatus: (quoteId: string, status: "APPROVED" | "REJECTED") => void;
  setActiveRole: (role: RoleType) => void;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (cat: string) => void;
  setSortBy: (sort: "featured" | "price-low" | "price-high" | "rating" | "discount") => void;
  setPriceRange: (range: [number, number]) => void;
  setMinRating: (r: number) => void;
  setQuickViewProduct: (p: StoreProduct | null) => void;
  setIsCartDrawerOpen: (open: boolean) => void;
  addToCart: (product: StoreProduct, options?: { size?: string; color?: { name: string; hex: string }; quantity?: number }) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  showToast: (message: string, type?: "success" | "info" | "warning") => void;
  dismissToast: (id: string) => void;
  addOrder: (order: StoreOrder) => void;
  advanceOrderDeliveryStage: (orderId: string) => { currentStage: number; stageName: string };
  getOrderById: (orderId: string) => StoreOrder | undefined;
  suppliers: SupplierInfo[];
  addProduct: (product: Omit<StoreProduct, "id" | "slug" | "rating" | "reviewCount"> & { rating?: number; reviewCount?: number }) => StoreProduct;
  updateProductStock: (productId: string, newStock: number) => void;
  updateProductPrice: (productId: string, newPrice: number) => void;
  toggleProductStatus: (productId: string) => void;
  toggleSupplierVerification: (supplierId: string) => void;
  toggleSupplierPayoutHold: (supplierId: string) => void;
  markOrderDispatched: (orderId: string) => void;
  generateShippingManifest: (orderId: string) => { awb: string; manifestId: string; generatedAt: string };
  loadSampleOrders: () => void;
  resetDemoData: () => void;
  filteredProducts: StoreProduct[];
  cartTotalCount: number;
  cartSubtotal: number;
}

export const PRELOADED_PRODUCTS: StoreProduct[] = [
  // --- 1. ELECTRONICS ---
  {
    id: "prod_elec_01",
    slug: "sony-wh-1000xm5-studio-wireless-headphones",
    title: "Sony WH-1000XM5 Studio Wireless Noise-Cancelling Headphones",
    subtitle: "Flagship 30mm Carbon Drivers with Dual QN1 Noise Processors",
    description: "Industry-leading active noise cancellation powered by two processors and eight microphones. Features precision voice pickup, LDAC Hi-Res Wireless Audio, and ultra-comfortable soft-fit leather headband for marathon production sessions.",
    category: "Electronics",
    price: 26990,
    mrpPrice: 34990,
    rating: 4.9,
    reviewCount: 428,
    stock: 8,
    badge: "Best Seller",
    supplier: {
      id: "sup_voxel",
      name: "Voxel Acoustics Tokyo",
      location: "Tokyo / Mumbai Air Cargo Hub",
      rating: 4.98,
      fulfillmentRate: "99.8%",
      verified: true,
    },
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=80",
    ],
    colors: [
      { name: "Silver Alabaster", hex: "#E2E8F0", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80" },
      { name: "Matte Obsidian", hex: "#0F172A", image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=80" },
      { name: "Midnight Navy", hex: "#1E293B", image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80" },
    ],
    specs: {
      "Battery Life": "30 Hours ANC Active (Quick Charge: 3min = 3hrs)",
      "Driver Unit": "30mm Precision Engineered Carbon Fiber",
      "Frequency Response": "4Hz - 40,000Hz (Hi-Res Audio Certified)",
      "Bluetooth": "v5.2 with Multipoint Connect (2 Devices)",
      "Warranty": "2 Years Official Manufacturer Warranty",
    },
    reviews: [
      {
        id: "rev_1",
        author: "Devang M.",
        rating: 5,
        date: "2 days ago",
        comment: "The noise cancellation creates an absolute bubble of silence in Mumbai traffic. Pristine soundstage.",
        verified: true,
      },
      {
        id: "rev_2",
        author: "Kavita S.",
        rating: 5,
        date: "1 week ago",
        comment: "Flawless build quality. Packaging was immaculate with double bubble-wrap.",
        verified: true,
      },
    ],
  },
  {
    id: "prod_elec_02",
    slug: "apple-macbook-air-m3-15-inch-liquid-retina",
    title: "Apple MacBook Air M3 15-Inch Liquid Retina (Midnight)",
    subtitle: "8-Core CPU, 10-Core GPU, 16GB Unified Memory, 512GB SSD",
    description: "Strikingly thin design with the lightning-fast M3 chip. Delivers up to 18 hours of battery life, expansive 15.3-inch Liquid Retina display with 500 nits brightness, MagSafe 3 charging, and 1080p FaceTime HD camera.",
    category: "Electronics",
    price: 124900,
    mrpPrice: 134900,
    rating: 4.95,
    reviewCount: 310,
    stock: 4,
    badge: "Only 4 Left",
    supplier: {
      id: "sup_aerotech",
      name: "AeroTech Systems Mumbai",
      location: "Bandra Kurla Complex, Mumbai",
      rating: 4.95,
      fulfillmentRate: "100%",
      verified: true,
    },
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80",
    ],
    colors: [
      { name: "Midnight", hex: "#182232", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80" },
      { name: "Starlight", hex: "#F3EEE7", image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80" },
      { name: "Space Grey", hex: "#64748B", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80" },
    ],
    specs: {
      "Processor": "Apple M3 Chip (8-Core CPU / 10-Core GPU)",
      "Memory": "16GB High-Bandwidth Unified Memory",
      "Storage": "512GB High-Speed NVMe Solid State Drive",
      "Display": "15.3-inch Liquid Retina Display with True Tone",
      "Weight": "1.51 kg Ultra-Portable Aluminum Unibody",
    },
    reviews: [
      {
        id: "rev_3",
        author: "Rohan V.",
        rating: 5,
        date: "3 days ago",
        comment: "Silent fanless thermals. Handles Docker, Next.js builds, and 4K Figma files without breaking a sweat.",
        verified: true,
      },
    ],
  },
  {
    id: "prod_elec_03",
    slug: "keychron-q1-pro-wireless-custom-mechanical-keyboard",
    title: "Keychron Q1 Pro Wireless QMK Custom Mechanical Keyboard",
    subtitle: "Full CNC Anodized Aluminum Body with Hot-Swappable Gateron Jupiter Bananas",
    description: "Engineered for keyboard purists. Features double-gasket acoustic mount design, south-facing RGB illumination, screw-in PCB stabilizers, and seamless macOS & Windows toggle with custom VIA key-remapping.",
    category: "Electronics",
    price: 16499,
    mrpPrice: 19999,
    rating: 4.85,
    reviewCount: 194,
    stock: 12,
    badge: "Architect Favorite",
    supplier: {
      id: "sup_keeb",
      name: "Studio Keeb Works",
      location: "Bengaluru Tech Corridor",
      rating: 4.9,
      fulfillmentRate: "99.2%",
      verified: true,
    },
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1000&q=80",
    ],
    colors: [
      { name: "Silver Grey", hex: "#94A3B8", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80" },
      { name: "Carbon Black", hex: "#0F172A", image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1000&q=80" },
    ],
    specs: {
      "Case Material": "6063 Precision CNC Machined Aluminum",
      "Switch Type": "Pre-lubed Gateron Jupiter Banana (Tactile 59gf)",
      "Keycaps": "KSA Profile Double-Shot PBT (Oil Resistant)",
      "Battery": "4000mAh Rechargable (Up to 300 Hours)",
      "Connectivity": "Bluetooth 5.1 / 1000Hz Type-C Wired",
    },
    reviews: [
      {
        id: "rev_4",
        author: "Arjun K.",
        rating: 5,
        date: "5 days ago",
        comment: "The heavy aluminum weight prevents any desk sliding. The deep acoustic thock is intoxicating.",
        verified: true,
      },
    ],
  },

  // --- 2. FASHION & APPAREL ---
  {
    id: "prod_fash_01",
    slug: "loom-spindle-100-mulberry-raw-silk-kimono-jacket",
    title: "Loom & Spindle 100% Mulberry Raw Silk Minimalist Kimono Jacket",
    subtitle: "Hand-Spun Natural Ahimsa Silk with Architectural Drop Shoulder",
    description: "Crafted by master handloom weavers in Jaipur. Tailored from undyed, chemical-free mulberry silk with natural slub textures, deep interior pockets, and self-tying minimalist waistband.",
    category: "Fashion & Apparel",
    price: 8499,
    mrpPrice: 12999,
    rating: 4.92,
    reviewCount: 187,
    stock: 5,
    badge: "35% OFF",
    supplier: {
      id: "sup_solstice",
      name: "Solstice Loom Heritage Jaipur",
      location: "Jaipur Handloom Cluster",
      rating: 4.97,
      fulfillmentRate: "100%",
      verified: true,
    },
    images: [
      "https://images.unsplash.com/photo-1539533018447-63fcce667883?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Raw Ecru", hex: "#FAF8F5", image: "https://images.unsplash.com/photo-1539533018447-63fcce667883?auto=format&fit=crop&w=1000&q=80" },
      { name: "Mineral Sage", hex: "#CBD5E1", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80" },
    ],
    specs: {
      "Fabric Composition": "100% Organic Peace Silk (Ahimsa)",
      "Weave Type": "Single-Thread Pit-Loom Handloom Weave",
      "Dye": "Zero Harsh Chemicals • Certified Botanical Extracts",
      "Fit": "Relaxed Architectural Genderless Cut",
      "Care Instructions": "Dry Clean Recommended or Cold Silk Wash",
    },
    reviews: [
      {
        id: "rev_5",
        author: "Meera D.",
        rating: 5,
        date: "Yesterday",
        comment: "Drapes like water. The natural raw silk texture looks stunning in gallery light.",
        verified: true,
      },
    ],
  },
  {
    id: "prod_fash_02",
    slug: "heritage-hand-knitted-merino-wool-turtleneck-sweater",
    title: "Heritage Hand-Knitted Merino Wool Turtleneck Sweater (Oatmeal)",
    subtitle: "19.5 Micron Extra-Fine Australian Wool Spun in Kashmir",
    description: "An everyday luxury layer. Ultra-soft against bare skin with zero itchiness, thermal breathability, raglan sleeve detailing, and ribbed cuffs that retain shape through years of wear.",
    category: "Fashion & Apparel",
    price: 4299,
    mrpPrice: 6499,
    rating: 4.88,
    reviewCount: 240,
    stock: 9,
    badge: "Trending Piece",
    supplier: {
      id: "sup_kashmir",
      name: "Kashmir Loom Collective",
      location: "Srinagar Craft Hub",
      rating: 4.92,
      fulfillmentRate: "98.9%",
      verified: true,
    },
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1000&q=80",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Oatmeal Heather", hex: "#E2E8F0", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80" },
      { name: "Charcoal Slate", hex: "#334155", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1000&q=80" },
    ],
    specs: {
      "Yarn Weight": "2-Ply Extra-Fine Grade Merino Wool",
      "Gauge": "7-Gauge Fisherman Knit",
      "Temperature Range": "Comfortable from 5°C to 20°C",
      "Origin": "Srinagar Heritage Weavers Collective",
    },
    reviews: [
      {
        id: "rev_6",
        author: "Aman T.",
        rating: 5,
        date: "3 days ago",
        comment: "Genuinely doesn't itch. Fits true to size with an elevated studio profile.",
        verified: true,
      },
    ],
  },
  {
    id: "prod_fash_03",
    slug: "artisan-full-grain-italian-leather-weekender-duffle",
    title: "Artisan Full-Grain Italian Leather Weekender Travel Duffle",
    subtitle: "Vegetable-Tanned Tuscan Calfskin with Solid Antiqued Brass Hardware",
    description: "Built for a lifetime of exploration. Features Japanese YKK Excella zippers, reinforced double-riveted handles, water-resistant waxed canvas lining, and a dedicated ventilated footwear compartment.",
    category: "Fashion & Apparel",
    price: 14999,
    mrpPrice: 21999,
    rating: 4.96,
    reviewCount: 165,
    stock: 3,
    badge: "Only 3 Left",
    supplier: {
      id: "sup_leather",
      name: "Tuscan Leather Guild Florence",
      location: "Florence / New Delhi Warehouse",
      rating: 4.99,
      fulfillmentRate: "100%",
      verified: true,
    },
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=80",
    ],
    colors: [
      { name: "Saddle Tan", hex: "#B45309", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80" },
      { name: "Espresso Brown", hex: "#451A03", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=80" },
    ],
    specs: {
      "Leather Grade": "Grade-A Full-Grain Vegetable-Tanned Cowhide",
      "Dimensions": "52cm x 28cm x 26cm (IATA Cabin Compliant)",
      "Capacity": "42 Liters Optimal Weekend Packing",
      "Hardware": "100% Solid Brass in Antique Finish",
    },
    reviews: [
      {
        id: "rev_7",
        author: "Siddharth R.",
        rating: 5,
        date: "4 days ago",
        comment: "The leather smells amazing and develops an incredible patina with every trip.",
        verified: true,
      },
    ],
  },

  // --- 3. HOME & KITCHEN ---
  {
    id: "prod_home_01",
    slug: "baratza-encore-esp-conical-burr-precision-espresso-grinder",
    title: "Baratza Encore ESP Conical Burr Precision Espresso Grinder",
    subtitle: "M2 40mm Hardened Steel Burrs with High-Resolution Micro-Steps",
    description: "The gold standard for home baristas. Engineered with macro and micro adjustment steps for dialed-in espresso down to 15 microns, with low grind retention and anti-static dosing cup.",
    category: "Home & Kitchen",
    price: 18990,
    mrpPrice: 23500,
    rating: 4.9,
    reviewCount: 312,
    stock: 6,
    badge: "Barista Choice",
    supplier: {
      id: "sup_coffee",
      name: "Craft Coffee Gear Berlin",
      location: "Berlin / Bengaluru Hub",
      rating: 4.96,
      fulfillmentRate: "99.5%",
      verified: true,
    },
    images: [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80",
    ],
    colors: [
      { name: "Matte Alabaster", hex: "#FFFFFF", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80" },
      { name: "Pitch Black", hex: "#0F172A", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80" },
    ],
    specs: {
      "Burrs": "Liechtenstein 40mm Conical M2 Steel Burrs",
      "Grind Range": "200 to 1200 Microns (Espresso to French Press)",
      "Motor": "High Torque DC Motor with Thermal Overload Cutoff",
      "Hopper Capacity": "300g Whole Roasted Coffee Beans",
    },
    reviews: [
      {
        id: "rev_8",
        author: "Pranay N.",
        rating: 5,
        date: "1 week ago",
        comment: "Dialing in light roasts on my Gaggia Classic took only 2 shots. Uniform particle distribution.",
        verified: true,
      },
    ],
  },
  {
    id: "prod_home_02",
    slug: "aesthetic-hand-poured-ceramic-table-lamp-with-linen-shade",
    title: "Aesthetic Hand-Poured Ceramic Table Lamp with Linen Shade",
    subtitle: "Wheel-Thrown Stoneware Base with Raw Mineral Glaze & Dimmable LED",
    description: "Each lamp is individually hand-thrown by ceramicists in Khurja. Paired with a warm woven linen drum shade that diffuses an ambient, soothing 2700K golden glow across desks and living spaces.",
    category: "Home & Kitchen",
    price: 3799,
    mrpPrice: 5499,
    rating: 4.82,
    reviewCount: 94,
    stock: 11,
    badge: "Handcrafted",
    supplier: {
      id: "sup_terra",
      name: "Studio Terra Khurja",
      location: "Khurja Pottery Cluster, UP",
      rating: 4.89,
      fulfillmentRate: "98.7%",
      verified: true,
    },
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80",
    ],
    colors: [
      { name: "Speckled Sand", hex: "#F1F5F9", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80" },
      { name: "Terracotta Earth", hex: "#C2410C", image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80" },
    ],
    specs: {
      "Base Material": "High-Fired 1280°C Ceramic Stoneware",
      "Shade Material": "Natural Organic Belgian Linen",
      "Switch": "In-line Solid Brass Stepless Dimmer Wheel",
      "Bulb Type": "Warm 2700K Filament LED Included (E27 Socket)",
    },
    reviews: [
      {
        id: "rev_9",
        author: "Ananya S.",
        rating: 5,
        date: "5 days ago",
        comment: "The organic ceramic imperfections give it so much architectural warmth.",
        verified: true,
      },
    ],
  },
  {
    id: "prod_home_03",
    slug: "kurogane-hand-forged-damascus-vg10-chef-santoku-knife",
    title: "Kurogane Hand-Forged Damascus VG-10 Chef Santoku Knife",
    subtitle: "67-Layer Hammered Tsuchime Damascus Steel with Octagonal Ebony Handle",
    description: "Forged in the historic blade city of Seki. Features a Japanese VG-10 super-steel core hardened to 60-62 HRC for razor edge retention, paired with a moisture-resistant buffalo horn bolster.",
    category: "Home & Kitchen",
    price: 9499,
    mrpPrice: 13999,
    rating: 4.98,
    reviewCount: 410,
    stock: 4,
    badge: "Only 4 Left",
    supplier: {
      id: "sup_seki",
      name: "Seki Blades Workshop Japan",
      location: "Gifu Prefecture, Japan",
      rating: 4.99,
      fulfillmentRate: "100%",
      verified: true,
    },
    images: [
      "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1000&q=80",
    ],
    specs: {
      "Core Steel": "Takefu VG-10 Cobalt Alloy Stainless Steel",
      "Cladding": "67-Layer High-Carbon Damascus Pattern",
      "Hardness": "61 ± 1 HRC (Rockwell Scale)",
      "Edge Angle": "15° Honbazuke Hand-Sharpened Razor Edge",
      "Handle": "Traditional Japanese Wa-Style Octagonal Ebony Wood",
    },
    reviews: [
      {
        id: "rev_10",
        author: "Chef Vikram",
        rating: 5,
        date: "2 days ago",
        comment: "Glides through ripe tomatoes with zero pressure. Perfectly balanced at the pinch grip.",
        verified: true,
      },
    ],
  },

  // --- 4. B2B WHOLESALE PACKS ---
  {
    id: "prod_b2b_01",
    slug: "wholesale-case-matte-amber-glass-apothecary-bottles-500ml",
    title: "Wholesale Case (x50): Matte Amber Glass Apothecary Bottles (500ml)",
    subtitle: "Pack of 50 Heavyweight UV-Blocking Bottles with Black Pump Dispensers",
    description: "Designed for premium boutique cosmetics, hotel amenities, and botanical labs. Thickened lead-free soda-lime glass protects light-sensitive serums. Includes GST tax invoice for 18% input credit.",
    category: "B2B Wholesale Packs",
    price: 12500,
    mrpPrice: 18000,
    rating: 4.9,
    reviewCount: 88,
    stock: 40,
    badge: "B2B Bulk Price",
    b2bMinMoq: 1,
    supplier: {
      id: "sup_glass",
      name: "Industrial Glass Packaging Solutions",
      location: "Firozabad / Navi Mumbai Terminal",
      rating: 4.94,
      fulfillmentRate: "99.8%",
      verified: true,
    },
    images: [
      "https://images.unsplash.com/photo-1608248597359-bb436a539fa9?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
    ],
    specs: {
      "Pack Quantity": "50 Glass Bottles + 50 Matte Black Lotion Pumps",
      "Capacity per Unit": "500ml (16.9 oz) Standard Volume",
      "Neck Finish": "28/410 Leakproof Thread Specification",
      "UV Protection": "99% Protection against UV Degradation",
      "B2B Pricing": "₹250 per piece (vs ₹360 retail standard)",
    },
    reviews: [
      {
        id: "rev_11",
        author: "Aura Botanicals Ltd.",
        rating: 5,
        date: "1 week ago",
        comment: "Zero breakage across 4 cases shipped to Bangalore. Excellent industrial pallet boxing.",
        verified: true,
      },
    ],
  },
  {
    id: "prod_b2b_02",
    slug: "bulk-artisan-linen-tote-bags-pack-of-100",
    title: "Bulk Artisan Linen Tote Bags (Pack of 100 Units)",
    subtitle: "Heavyweight 380 GSM Organic Cotton-Linen with Reinforced X-Stitched Handles",
    description: "Wholesale procurement for retail brands, architectural galleries, and corporate gifting. Features wide gusset base, interior zippered phone pocket, and unprinted canvas ready for custom branding.",
    category: "B2B Wholesale Packs",
    price: 19800,
    mrpPrice: 28500,
    rating: 4.94,
    reviewCount: 142,
    stock: 25,
    badge: "GST Input Ready",
    b2bMinMoq: 1,
    supplier: {
      id: "sup_ecoweave",
      name: "EcoWeave Textiles Ahmedabad",
      location: "Ahmedabad Textile SEZ",
      rating: 4.93,
      fulfillmentRate: "100%",
      verified: true,
    },
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?auto=format&fit=crop&w=1000&q=80",
    ],
    specs: {
      "Case Quantity": "100 Heavyweight Finished Tote Bags",
      "Fabric Weight": "380 GSM Heavy Cotton-Linen Canvas",
      "Dimensions": "42cm Height x 38cm Width x 12cm Base Gusset",
      "Carrying Capacity": "Tested for up to 18kg per bag",
      "B2B Unit Rate": "₹198 per tote bag (Wholesale Direct)",
    },
    reviews: [
      {
        id: "rev_12",
        author: "Kala Academy",
        rating: 5,
        date: "3 days ago",
        comment: "Ordered for our design summit. The stitching quality and handle thickness exceeded our expectation.",
        verified: true,
      },
    ],
  },
  {
    id: "prod_b2b_03",
    slug: "master-acoustic-bass-trap-panels-bundle-of-24",
    title: "Master Acoustic Bass Trap Panels (Industrial Bundle of 24 Units)",
    subtitle: "High-Density Rockwool Core with Fire-Retardant Acoustic Fabric (NRC 0.95)",
    description: "Enterprise acoustic absorption treatment for commercial sound recording studios, podcast studios, and listening rooms. Targets troublesome low-frequency modal resonance between 60Hz and 250Hz.",
    category: "B2B Wholesale Packs",
    price: 48000,
    mrpPrice: 65000,
    rating: 4.96,
    reviewCount: 67,
    stock: 8,
    badge: "Only 8 Left",
    b2bMinMoq: 1,
    supplier: {
      id: "sup_acoustix",
      name: "Acoustix Pro Engineering Bengaluru",
      location: "Whitefield Audio Labs, Bengaluru",
      rating: 4.97,
      fulfillmentRate: "99.0%",
      verified: true,
    },
    images: [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519683109079-d5f539e1542f?auto=format&fit=crop&w=1000&q=80",
    ],
    specs: {
      "Bundle Quantity": "24 Professional Wall & Corner Acoustic Panels",
      "Acoustic Rating": "Noise Reduction Coefficient (NRC) 0.95 Tested",
      "Dimensions per Unit": "60cm x 60cm x 10cm Depth",
      "Fire Safety": "Class A Fire-Retardant Certified ASTM E84",
      "Mounting Hardware": "Industrial Z-Clips & Wall Anchors Included",
    },
    reviews: [
      {
        id: "rev_13",
        author: "Studio Resonance",
        rating: 5,
        date: "2 weeks ago",
        comment: "Tamed the low-end resonance in our Dolby Atmos mix room immediately. Measurement graphs don't lie.",
        verified: true,
      },
    ],
  },
];

export const INITIAL_SUPPLIERS: SupplierInfo[] = [
  {
    id: "sup_apex",
    name: "Apex Electronics Hub",
    location: "Bangalore, KA",
    rating: 4.96,
    fulfillmentRate: "99.8%",
    verified: true,
    payoutOnHold: false,
    joinedDate: "12 Jan 2025",
    totalProductsCount: 14,
    totalSalesINR: 489200,
  },
  {
    id: "sup_optiview",
    name: "OptiView Labs",
    location: "Hyderabad, TS",
    rating: 4.94,
    fulfillmentRate: "99.2%",
    verified: true,
    payoutOnHold: false,
    joinedDate: "03 Feb 2025",
    totalProductsCount: 8,
    totalSalesINR: 842000,
  },
  {
    id: "sup_sartorial",
    name: "Sartorial Atelier Mumbai",
    location: "Mumbai, MH",
    rating: 4.98,
    fulfillmentRate: "99.9%",
    verified: true,
    payoutOnHold: false,
    joinedDate: "10 Nov 2024",
    totalProductsCount: 22,
    totalSalesINR: 1250000,
  },
  {
    id: "sup_verdant",
    name: "Verdant Raw Mills",
    location: "Jaipur, RJ",
    rating: 4.85,
    fulfillmentRate: "98.1%",
    verified: false,
    payoutOnHold: false,
    joinedDate: "29 Mar 2025",
    totalProductsCount: 11,
    totalSalesINR: 320000,
  },
  {
    id: "sup_ceramics",
    name: "Atelier Ceramics Khurja",
    location: "Khurja, UP",
    rating: 4.93,
    fulfillmentRate: "98.7%",
    verified: true,
    payoutOnHold: false,
    joinedDate: "05 Dec 2024",
    totalProductsCount: 15,
    totalSalesINR: 295000,
  },
  {
    id: "sup_nordic",
    name: "Nordic Craft Studio",
    location: "Bengaluru, KA",
    rating: 4.95,
    fulfillmentRate: "99.4%",
    verified: true,
    payoutOnHold: false,
    joinedDate: "22 Jan 2025",
    totalProductsCount: 7,
    totalSalesINR: 520000,
  },
  {
    id: "sup_barista",
    name: "Barista Craft Tech",
    location: "Coorg, KA",
    rating: 4.89,
    fulfillmentRate: "98.2%",
    verified: true,
    payoutOnHold: false,
    joinedDate: "18 Jan 2025",
    totalProductsCount: 5,
    totalSalesINR: 185000,
  },
  {
    id: "sup_titan",
    name: "Titan Bulk Pack Hub",
    location: "Surat, GJ",
    rating: 4.92,
    fulfillmentRate: "99.5%",
    verified: true,
    payoutOnHold: false,
    joinedDate: "08 Dec 2024",
    totalProductsCount: 18,
    totalSalesINR: 1940000,
  },
];

export const INITIAL_B2B_QUOTES: B2BQuoteRequest[] = [
  {
    id: "quote_2026_8812",
    productId: "prod_elec_01",
    productTitle: "Sony WH-1000XM5 Studio Wireless Noise-Cancelling Headphones",
    productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    supplierId: "sup_apex",
    supplierName: "Apex Electronics Hub",
    quantity: 50,
    targetPriceINR: 21500,
    companyName: "Nexus Soundworks Studio Pvt Ltd",
    buyerName: "Vikram Malhotra",
    buyerEmail: "procurement@nexussound.in",
    buyerPhone: "+91 98201 44521",
    gstin: "27AAACN1245D1Z8",
    requirements: "Need 50 units for our flagship audio engineering studio suites. Custom laser engraving if possible.",
    status: "PENDING",
    createdAt: "2026-11-02 18:30:00",
  },
  {
    id: "quote_2026_8813",
    productId: "prod_b2b_01",
    productTitle: "Wholesale Case (x50): Matte Amber Glass Apothecary Bottles (500ml)",
    productImage: "https://images.unsplash.com/photo-1608248597359-bb436a539fa9?auto=format&fit=crop&w=800&q=80",
    supplierId: "sup_glass",
    supplierName: "Industrial Glass Packaging Solutions",
    quantity: 120,
    targetPriceINR: 9800,
    companyName: "Botanical Essence Labs Mumbai",
    buyerName: "Pooja Singhania",
    buyerEmail: "ops@botanicalessence.com",
    buyerPhone: "+91 98711 02938",
    gstin: "27AABCB8901R1ZE",
    requirements: "Scheduled recurring quarterly delivery for luxury organic cold-pressed oil bottling line.",
    status: "APPROVED",
    createdAt: "2026-11-01 14:15:00",
  },
];

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<StoreProduct[]>(PRELOADED_PRODUCTS);
  const [suppliers, setSuppliers] = useState<SupplierInfo[]>(INITIAL_SUPPLIERS);
  const [cart, setCart] = useState<StoreCartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [b2bQuotes, setB2bQuotes] = useState<B2BQuoteRequest[]>(INITIAL_B2B_QUOTES);
  const [isB2BModalOpen, setIsB2BModalOpen] = useState(false);
  const [b2bModalProduct, setB2bModalProduct] = useState<StoreProduct | null>(null);
  const [activeRole, setActiveRole] = useState<RoleType>("customer");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"featured" | "price-low" | "price-high" | "rating" | "discount">("featured");
  const [priceRange, setPriceRange] = useState<[number, number]>([1000, 150000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [quickViewProduct, setQuickViewProduct] = useState<StoreProduct | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: "", type: "info" });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem("nexu_saas_products");
      if (savedProducts) setProducts(JSON.parse(savedProducts));

      const savedSuppliers = localStorage.getItem("nexu_saas_suppliers");
      if (savedSuppliers) setSuppliers(JSON.parse(savedSuppliers));

      const savedCart = localStorage.getItem("nexu_saas_cart");
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedWishlist = localStorage.getItem("nexu_saas_wishlist");
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

      const savedOrders = localStorage.getItem("nexu_saas_orders");
      if (savedOrders) setOrders(JSON.parse(savedOrders));

      const savedRole = localStorage.getItem("nexu_saas_role");
      if (savedRole && ["customer", "supplier", "admin"].includes(savedRole)) {
        setActiveRole(savedRole as RoleType);
      }
    } catch {
      // LocalStorage access restricted or unavailable
    }
  }, []);

  // Save products to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("nexu_saas_products", JSON.stringify(products));
    } catch {}
  }, [products]);

  // Save suppliers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("nexu_saas_suppliers", JSON.stringify(suppliers));
    } catch {}
  }, [suppliers]);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("nexu_saas_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Save wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("nexu_saas_wishlist", JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  // Save role to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("nexu_saas_role", activeRole);
    } catch {}
  }, [activeRole]);

  // Save orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("nexu_saas_orders", JSON.stringify(orders));
    } catch {}
  }, [orders]);

  const showToast = (message: string, type: "success" | "info" | "warning" = "info") => {
    setToast({ show: true, message, type });
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastItem = { id, message, type, timestamp: Date.now() };
    setToasts((prev) => [...prev.slice(-3), newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);

    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  const openB2BModal = (product: StoreProduct) => {
    setB2bModalProduct(product);
    setIsB2BModalOpen(true);
  };

  const closeB2BModal = () => {
    setIsB2BModalOpen(false);
    setB2bModalProduct(null);
  };

  const submitB2BQuote = (quote: Omit<B2BQuoteRequest, "id" | "status" | "createdAt">) => {
    const newQuote: B2BQuoteRequest = {
      ...quote,
      id: `quote_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      status: "PENDING",
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 19),
    };
    setB2bQuotes((prev) => [newQuote, ...prev]);
    showToast(`B2B Bulk Quote Request Dispatched to ${quote.supplierName} 📋`, "success");
    closeB2BModal();
  };

  const updateB2BQuoteStatus = (quoteId: string, status: "APPROVED" | "REJECTED") => {
    setB2bQuotes((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, status } : q))
    );
    showToast(
      status === "APPROVED"
        ? `Wholesale Allocation APPROVED for Quote #${quoteId} 🎉`
        : `Wholesale Quote #${quoteId} Declined`,
      status === "APPROVED" ? "success" : "info"
    );
  };

  const addToCart = (
    product: StoreProduct,
    options?: { size?: string; color?: { name: string; hex: string }; quantity?: number }
  ) => {
    const qty = options?.quantity || 1;
    const selectedSize = options?.size || product.sizes?.[0];
    const selectedColor = options?.color || (product.colors?.[0] ? { name: product.colors[0].name, hex: product.colors[0].hex } : undefined);

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.productId === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor?.name === selectedColor?.name
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += qty;
        return updated;
      }

      const newItem: StoreCartItem = {
        id: `cart_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        productId: product.id,
        product,
        quantity: qty,
        selectedSize,
        selectedColor,
      };
      return [...prev, newItem];
    });

    showToast(`Added to Cart 🛍️: "${product.title}"`, "success");
    setIsCartDrawerOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
    showToast("Piece removed from shopping bag", "info");
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast("Removed from Wishlist 💔", "info");
        return prev.filter((id) => id !== productId);
      } else {
        showToast("Saved to Wishlist ❤️", "success");
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const addOrder = (newOrder: StoreOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
    showToast(`Order #${newOrder.id} logged & secured via Escrow`, "success");
  };

  const advanceOrderDeliveryStage = (orderId: string) => {
    let nextStage = 1;
    let nextStageName = "Order Confirmed & Invoice Generated";
    let nextStatus: StoreOrder["status"] = "CONFIRMED";

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        nextStage = Math.min(5, (order.deliveryStage || 1) + 1);
        if (nextStage === 2) {
          nextStageName = "Packed at Supplier Warehouse";
          nextStatus = "PACKED";
        } else if (nextStage === 3) {
          nextStageName = "Shipped via Express Logistics";
          nextStatus = "SHIPPED";
        } else if (nextStage === 4) {
          nextStageName = "Out for Delivery";
          nextStatus = "OUT_FOR_DELIVERY";
        } else if (nextStage === 5) {
          nextStageName = "Delivered";
          nextStatus = "DELIVERED";
        }
        return {
          ...order,
          deliveryStage: nextStage,
          deliveryStageName: nextStageName,
          status: nextStatus,
        };
      })
    );
    showToast(`Fulfillment: ${nextStageName} (Stage ${nextStage}/5)`, "success");
    return { currentStage: nextStage, stageName: nextStageName };
  };

  const getOrderById = (orderId: string) => {
    return orders.find((o) => o.id === orderId);
  };

  const addProduct = (
    productData: Omit<StoreProduct, "id" | "slug" | "rating" | "reviewCount"> & {
      rating?: number;
      reviewCount?: number;
    }
  ): StoreProduct => {
    const id = `prod_custom_${Date.now()}`;
    const slug = productData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const newProduct: StoreProduct = {
      ...productData,
      id,
      slug,
      rating: productData.rating || 5.0,
      reviewCount: productData.reviewCount || 1,
      reviews: productData.reviews || [
        {
          id: `rev_${Date.now()}`,
          author: "Verified Patron",
          rating: 5,
          date: "Just now",
          comment: "Authentic studio craftsmanship. Verified by platform escrow.",
          verified: true,
        },
      ],
    };

    setProducts((prev) => [newProduct, ...prev]);
    showToast(`✨ Product "${newProduct.title}" is now LIVE on Storefront!`, "success");
    return newProduct;
  };

  const updateProductStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p))
    );
    showToast(`Stock updated to ${Math.max(0, newStock)} units`, "info");
  };

  const updateProductPrice = (productId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, price: Math.max(1, newPrice) } : p))
    );
    showToast(`Price adjusted to ₹${newPrice.toLocaleString("en-IN")}`, "success");
  };

  const toggleProductStatus = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const newStock = p.stock > 0 ? 0 : 10;
        showToast(
          newStock > 0 ? `Product "${p.title}" set to In-Stock` : `Product "${p.title}" marked Out-of-Stock`,
          "info"
        );
        return { ...p, stock: newStock };
      })
    );
  };

  const toggleSupplierVerification = (supplierId: string) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== supplierId) return s;
        const updated = !s.verified;
        showToast(
          updated ? `🛡️ Verified Badge granted to ${s.name}` : `Verification removed for ${s.name}`,
          "info"
        );
        return { ...s, verified: updated };
      })
    );
  };

  const toggleSupplierPayoutHold = (supplierId: string) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== supplierId) return s;
        const onHold = !s.payoutOnHold;
        showToast(
          onHold
            ? `⚠️ Financial Payout HOLD placed on ${s.name}`
            : `✅ Escrow Payouts RELEASED for ${s.name}`,
          onHold ? "warning" : "success"
        );
        return { ...s, payoutOnHold: onHold };
      })
    );
  };

  const markOrderDispatched = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          deliveryStage: 3,
          deliveryStageName: "Shipped via Express Logistics",
          status: "SHIPPED",
          awbNumber: o.awbNumber || `BD-${Math.floor(10000000 + Math.random() * 90000000)}IN`,
        };
      })
    );
    showToast(`Order Status Updated by Supplier 📦 (Dispatched #${orderId} via Blue Dart Air)`, "success");
  };

  const generateShippingManifest = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    const awb = target?.awbNumber || `BD-${Math.floor(10000000 + Math.random() * 90000000)}IN`;
    const manifestId = `MNF-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    showToast(`📄 Air Cargo Manifest generated for Order #${orderId}`, "success");
    return { awb, manifestId, generatedAt: new Date().toLocaleString("en-IN") };
  };

  const loadSampleOrders = () => {
    const sampleOrders: StoreOrder[] = [
      {
        id: "ORD-2026-928410",
        items: [
          {
            id: "sample_item_1",
            productId: "prod_elec_01",
            quantity: 1,
            product: PRELOADED_PRODUCTS[0],
          },
        ],
        total: 26990,
        subtotal: 26990,
        shippingFee: 0,
        taxAmount: 4117,
        discount: 0,
        customerName: "Aarav Mehta",
        customerPhone: "+91 98765 43210",
        customerEmail: "aarav.mehta@enterprise-demo.com",
        shippingAddress: {
          fullName: "Aarav Mehta",
          phone: "+91 98765 43210",
          street: "Flat 402, Highline Horizon, Nariman Point",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
        },
        paymentMethod: "UPI",
        paymentDetails: {
          method: "UPI",
          upiId: "aarav@okaxis",
          bankRef: "UPI/2026/894210",
          utrNumber: "UPI/2026/894210",
          paidAt: "02 Nov 2026, 18:30:15 IST",
          status: "PAID & ESCROW VERIFIED",
        },
        deliveryStage: 1,
        deliveryStageName: "Order Confirmed & Invoice Generated",
        awbNumber: "BD-89472910IN",
        courierPartner: "Ramesh Sharma (+91 98200 12345) • Blue Dart Express",
        estimatedDelivery: "Thursday, Nov 6 • by 8:00 PM",
        status: "CONFIRMED",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "ORD-2026-581923",
        items: [
          {
            id: "sample_item_2",
            productId: "prod_b2b_01",
            quantity: 2,
            product: PRELOADED_PRODUCTS[9],
          },
        ],
        total: 71980,
        subtotal: 71980,
        shippingFee: 0,
        taxAmount: 10980,
        discount: 0,
        customerName: "Priya Sharma",
        customerPhone: "+91 98192 83746",
        customerEmail: "priya.sharma@designcraft.in",
        shippingAddress: {
          fullName: "Priya Sharma",
          phone: "+91 98192 83746",
          street: "Studio 12, Indiranagar 100ft Road",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560038",
        },
        paymentMethod: "UPI",
        paymentDetails: {
          method: "UPI",
          upiId: "priya@ybl",
          bankRef: "UPI/2026/492105",
          utrNumber: "UPI/2026/492105",
          paidAt: "02 Nov 2026, 16:15:00 IST",
          status: "PAID & ESCROW VERIFIED",
        },
        deliveryStage: 2,
        deliveryStageName: "Packed at Supplier Warehouse",
        awbNumber: "BD-49210518IN",
        courierPartner: "Sunil Verma • Blue Dart Air",
        estimatedDelivery: "Friday, Nov 7 • by 5:00 PM",
        status: "PACKED",
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: "ORD-2026-381042",
        items: [
          {
            id: "sample_item_3",
            productId: "prod_fash_01",
            quantity: 1,
            product: PRELOADED_PRODUCTS[3],
          },
        ],
        total: 18450,
        subtotal: 20500,
        shippingFee: 0,
        taxAmount: 2814,
        discount: 2050,
        couponCode: "ATELIER10",
        customerName: "Rohan Gupta",
        customerPhone: "+91 98250 31706",
        customerEmail: "rohan.gupta@atelier.org",
        shippingAddress: {
          fullName: "Rohan Gupta",
          phone: "+91 98250 31706",
          street: "Plot 88, Vasant Vihar Sector 4",
          city: "New Delhi",
          state: "Delhi",
          pincode: "110057",
        },
        paymentMethod: "UPI",
        paymentDetails: {
          method: "UPI",
          upiId: "rohan@okhdfcbank",
          bankRef: "UPI/2026/782910",
          utrNumber: "UPI/2026/782910",
          paidAt: "01 Nov 2026, 20:45:22 IST",
          status: "PAID & ESCROW VERIFIED",
        },
        deliveryStage: 3,
        deliveryStageName: "Shipped via Express Logistics",
        awbNumber: "BD-78291034IN",
        courierPartner: "Mahesh Kumar • Blue Dart Air Cargo",
        estimatedDelivery: "Wednesday, Nov 5 • by 2:00 PM",
        status: "SHIPPED",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "ORD-2026-291845",
        items: [
          {
            id: "sample_item_4",
            productId: "prod_home_01",
            quantity: 1,
            product: PRELOADED_PRODUCTS[6],
          },
        ],
        total: 14500,
        subtotal: 14500,
        shippingFee: 0,
        taxAmount: 2212,
        discount: 0,
        customerName: "Ananya Iyer",
        customerPhone: "+91 98334 11223",
        customerEmail: "ananya.iyer@decorlabs.com",
        shippingAddress: {
          fullName: "Ananya Iyer",
          phone: "+91 98334 11223",
          street: "Flat 801, Sea Breeze Residences, Worli",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400018",
        },
        paymentMethod: "UPI",
        paymentDetails: {
          method: "UPI",
          upiId: "ananya@icici",
          bankRef: "UPI/2026/381920",
          utrNumber: "UPI/2026/381920",
          paidAt: "01 Nov 2026, 14:10:00 IST",
          status: "PAID & ESCROW VERIFIED",
        },
        deliveryStage: 4,
        deliveryStageName: "Out for Delivery",
        awbNumber: "BD-38192091IN",
        courierPartner: "Ramesh Sharma (+91 98200 12345) • Blue Dart Express",
        estimatedDelivery: "Today • by 4:30 PM",
        status: "OUT_FOR_DELIVERY",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: "ORD-2026-109482",
        items: [
          {
            id: "sample_item_5",
            productId: "prod_elec_03",
            quantity: 1,
            product: PRELOADED_PRODUCTS[2],
          },
        ],
        total: 18999,
        subtotal: 18999,
        shippingFee: 0,
        taxAmount: 2898,
        discount: 0,
        customerName: "Vikramaditya Rao",
        customerPhone: "+91 98450 99887",
        customerEmail: "vikram@raomedia.com",
        shippingAddress: {
          fullName: "Vikramaditya Rao",
          phone: "+91 98450 99887",
          street: "Skyline Villa 4, Banjara Hills Road 3",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500034",
        },
        paymentMethod: "UPI",
        paymentDetails: {
          method: "UPI",
          upiId: "vikram@axisbank",
          bankRef: "UPI/2026/109482",
          utrNumber: "UPI/2026/109482",
          paidAt: "31 Oct 2026, 11:20:45 IST",
          status: "PAID & ESCROW VERIFIED",
        },
        deliveryStage: 5,
        deliveryStageName: "Delivered",
        awbNumber: "BD-10948273IN",
        courierPartner: "Kishore Reddy • Blue Dart Express",
        estimatedDelivery: "Delivered on 02 Nov",
        status: "DELIVERED",
        createdAt: new Date(Date.now() - 259200000).toISOString(),
      },
    ];

    setOrders(sampleOrders);
    showToast("✨ Loaded 5 verified sample showcase orders into global state!", "success");
  };

  const resetDemoData = () => {
    setProducts(PRELOADED_PRODUCTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setCart([]);
    setWishlist([]);
    setOrders([]);
    try {
      localStorage.removeItem("nexu_saas_products");
      localStorage.removeItem("nexu_saas_suppliers");
      localStorage.removeItem("nexu_saas_cart");
      localStorage.removeItem("nexu_saas_wishlist");
      localStorage.removeItem("nexu_saas_orders");
      localStorage.removeItem("nexu_active_coupon");
    } catch {}
    showToast("🔄 Platform state reset to pristine factory defaults", "info");
  };

  // Filtered & Sorted products computation
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        if (selectedCategory !== "All" && p.category !== selectedCategory) {
          return false;
        }
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchSub = p.subtitle.toLowerCase().includes(q);
          const matchCat = p.category.toLowerCase().includes(q);
          const matchSupplier = p.supplier.name.toLowerCase().includes(q);
          if (!matchTitle && !matchSub && !matchCat && !matchSupplier) {
            return false;
          }
        }
        // Price range filter
        if (p.price < priceRange[0] || p.price > priceRange[1]) {
          return false;
        }
        // Rating filter
        if (minRating > 0 && p.rating < minRating) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "discount") {
          const discountA = ((a.mrpPrice - a.price) / a.mrpPrice) * 100;
          const discountB = ((b.mrpPrice - b.price) / b.mrpPrice) * 100;
          return discountB - discountA;
        }
        // "featured" default
        return 0;
      });
  }, [products, selectedCategory, searchQuery, priceRange, minRating, sortBy]);

  const cartTotalCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0), [cart]);

  return (
    <StoreContext.Provider
      value={{
        products,
        cart,
        wishlist,
        orders,
        suppliers,
        b2bQuotes,
        isB2BModalOpen,
        b2bModalProduct,
        activeRole,
        searchQuery,
        selectedCategory,
        sortBy,
        priceRange,
        minRating,
        quickViewProduct,
        toast,
        toasts,
        dismissToast,
        isCartDrawerOpen,
        openB2BModal,
        closeB2BModal,
        submitB2BQuote,
        updateB2BQuoteStatus,
        setActiveRole,
        setSearchQuery,
        setSelectedCategory,
        setSortBy,
        setPriceRange,
        setMinRating,
        setQuickViewProduct,
        setIsCartDrawerOpen,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        showToast,
        addOrder,
        advanceOrderDeliveryStage,
        getOrderById,
        addProduct,
        updateProductStock,
        updateProductPrice,
        toggleProductStatus,
        toggleSupplierVerification,
        toggleSupplierPayoutHold,
        markOrderDispatched,
        generateShippingManifest,
        loadSampleOrders,
        resetDemoData,
        filteredProducts,
        cartTotalCount,
        cartSubtotal,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}

