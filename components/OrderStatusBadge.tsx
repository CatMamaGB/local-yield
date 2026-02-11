/**
 * Order status badge for display in order rows.
 */

type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELED" | "REFUNDED";

export interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-blue-100 text-blue-800",
  FULFILLED: "bg-green-100 text-green-800",
  CANCELED: "bg-gray-100 text-gray-600",
  REFUNDED: "bg-gray-100 text-gray-600",
};

export function OrderStatusBadge({ status, className = "" }: OrderStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${STYLES[status] ?? "bg-gray-100 text-gray-700"} ${className}`}
    >
      {status}
    </span>
  );
}
