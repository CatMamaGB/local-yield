/**
 * Order status badge — uses Warm Farmhouse Badge (PENDING amber, FULFILLED green, etc.).
 */

import { Badge, type BadgeStatus } from "@/components/ui/Badge";

export type OrderStatus = BadgeStatus;

export interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className = "" }: OrderStatusBadgeProps) {
  return <Badge variant={status} className={className}>{status}</Badge>;
}
