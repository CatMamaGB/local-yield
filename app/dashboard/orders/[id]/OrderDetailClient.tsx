"use client";

/**
 * Order detail actions: Message (buyer), Mark fulfilled (producer).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, apiPatch } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { MarkFulfilledButton } from "@/components/MarkFulfilledButton";
import { ReportDialog } from "@/components/ReportDialog";

type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELED" | "REFUNDED";

interface OrderDetailClientProps {
  orderId: string;
  isBuyer: boolean;
  isProducer: boolean;
  status: OrderStatus;
}

export function OrderDetailClient({ orderId, isBuyer, isProducer, status }: OrderDetailClientProps) {
  const [messageLoading, setMessageLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const router = useRouter();

  async function handleMessage() {
    setMessageLoading(true);
    try {
      const data = await apiPost<{ conversationId: string }>(`/api/orders/${orderId}/conversation`, {});
      router.push(`/dashboard/messages?conversationId=${data.conversationId}`);
    } catch (e) {
      alert(e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Failed to open messages"));
    } finally {
      setMessageLoading(false);
    }
  }

  const isPending = status === "PENDING" || status === "PAID";

  return (
    <>
      {isBuyer && (
        <button
          type="button"
          onClick={handleMessage}
          disabled={messageLoading}
          className="rounded border border-brand/30 px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light disabled:opacity-50"
        >
          {messageLoading ? "Opening…" : "Message producer"}
        </button>
      )}
      {isProducer && isPending && (
        <MarkFulfilledButton
          orderId={orderId}
          onFulfilled={() => router.refresh()}
        />
      )}
      <button
        type="button"
        onClick={() => setShowReport(true)}
        className="rounded border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
      >
        Report a problem
      </button>
      {showReport && (
        <ReportDialog
          entityType="order"
          entityId={orderId}
          onClose={() => setShowReport(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
