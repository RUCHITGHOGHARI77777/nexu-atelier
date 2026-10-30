import { OrderStatus } from "@/types/order";

export function getStatusBadgeVariant(
  status: OrderStatus
): "success" | "warning" | "neutral" | "outline" {
  switch (status) {
    case "confirmed":
      return "neutral";
    case "in_production":
      return "warning";
    case "shipped":
      return "neutral";
    case "delivered":
      return "success";
    case "cancelled":
      return "outline";
    default:
      return "neutral";
  }
}

export function formatStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "confirmed":
      return "Confirmed & Verified";
    case "in_production":
      return "In Studio Production";
    case "shipped":
      return "Dispatched via Courier";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
  }
}
