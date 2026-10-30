import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = (body.orderId || body.orderNumber || "").trim();
    const contact = (body.contact || body.phone || body.email || "").trim().toLowerCase();

    if (!orderId || !contact) {
      return NextResponse.json(
        { error: "Please provide both Order Number and Email or Phone." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            email: true,
            profile: {
              select: {
                phone: true,
              },
            },
          },
        },
        items: {
          select: {
            id: true,
            title: true,
            productSlug: true,
            quantity: true,
            selectedColorName: true,
            selectedSize: true,
            unitPricePaise: true,
            vendorName: true,
            imageSnapshot: true,
            fulfillmentStatus: true,
          },
        },
        shipments: {
          include: {
            trackingEvents: {
              orderBy: { timestamp: "desc" },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "No order found matching the provided details." },
        { status: 404 }
      );
    }

    // Parse shipping address snapshot to verify phone if supplied
    let addressPhone = "";
    let city = "";
    let state = "";
    let postalCode = "";
    try {
      const parsedAddress = JSON.parse(order.shippingAddressSnapshot);
      addressPhone = (parsedAddress.phone || "").trim().toLowerCase();
      city = parsedAddress.city || "";
      state = parsedAddress.state || "";
      postalCode = parsedAddress.postalCode || "";
    } catch {}

    const orderEmail = order.customerEmail.toLowerCase();
    const customerPhone = (order.customer.profile?.phone || "").trim().toLowerCase();

    // Verify contact matches email or phone
    const cleanDigits = contact.replace(/\D/g, "");
    const cleanAddrPhone = addressPhone.replace(/\D/g, "");
    const cleanCustPhone = customerPhone.replace(/\D/g, "");

    const isEmailMatch = orderEmail === contact;
    const isPhoneMatch =
      cleanDigits.length >= 10 &&
      (cleanAddrPhone.includes(cleanDigits) || cleanCustPhone.includes(cleanDigits));

    if (!isEmailMatch && !isPhoneMatch) {
      return NextResponse.json(
        { error: "The contact details do not match the records for this order." },
        { status: 403 }
      );
    }

    // Mask patron name for privacy
    const nameParts = order.customerName.split(" ");
    const maskedName =
      nameParts.length > 1
        ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}***`
        : order.customerName;

    return NextResponse.json({
      order: {
        id: order.id,
        createdAt: order.createdAt,
        status: order.status,
        paymentStatus: order.paymentStatus,
        isCod: order.isCod,
        deliveryMethodName: order.deliveryMethodName,
        estimatedDeliveryDate: order.estimatedDeliveryDate,
        totalPaise: order.totalPaise,
        recipient: {
          name: maskedName,
          destination: `${city}${city && state ? ", " : ""}${state} ${postalCode}`.trim(),
        },
        items: order.items.map((item) => ({
          id: item.id,
          title: item.title,
          slug: item.productSlug,
          quantity: item.quantity,
          selectedColor: item.selectedColorName,
          selectedSize: item.selectedSize,
          vendorName: item.vendorName || "Verified Atelier",
          image: item.imageSnapshot,
          fulfillmentStatus: item.fulfillmentStatus,
        })),
        shipments: order.shipments.map((s) => ({
          id: s.id,
          carrierName: s.carrierName,
          trackingNumber: s.trackingNumber,
          status: s.status,
          dispatchedAt: s.dispatchedAt,
          deliveredAt: s.deliveredAt,
          events: s.trackingEvents.map((evt) => ({
            id: evt.id,
            status: evt.status,
            location: evt.location,
            description: evt.description,
            timestamp: evt.timestamp,
          })),
        })),
      },
    });
  } catch (error) {
    console.error("Order tracking error:", error);
    return NextResponse.json({ error: "Failed to retrieve order status." }, { status: 500 });
  }
}
