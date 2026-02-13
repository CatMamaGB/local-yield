"use client";

/**
 * Messages list: fetch conversations and show other participant + last message.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

interface ConversationRow {
  id: string;
  other: { id: string; name: string | null; email: string };
  orderId: string | null;
  lastMessage: { body: string; createdAt: string; fromMe: boolean } | null;
  updatedAt: string;
}

export function DashboardMessagesClient() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ conversations?: ConversationRow[] }>("/api/dashboard/conversations")
      .then((data) => setConversations(data.conversations ?? []))
      .catch((e) => setError(e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Failed to load")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton rows={5} className="mt-6" />;
  if (error) return <InlineAlert variant="error" className="mt-6">{error}</InlineAlert>;

  if (conversations.length === 0) {
    return (
      <EmptyState
        title="No conversations yet"
        body="When buyers contact you about an order, they will appear here."
        className="mt-6"
      />
    );
  }

  return (
    <ul className="mt-6 space-y-3">
      {conversations.map((c) => (
        <li
          key={c.id}
          className="rounded-xl border border-brand/20 bg-white p-4 shadow-sm hover:border-brand/30"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-brand">
                {c.other.name ?? c.other.email ?? "Customer"}
              </p>
              <p className="text-sm text-brand/70">{c.other.email}</p>
              {c.lastMessage && (
                <p className="mt-2 line-clamp-2 text-sm text-brand/80">
                  {c.lastMessage.fromMe && <span className="text-brand/60">You: </span>}
                  {c.lastMessage.body}
                </p>
              )}
              <p className="mt-1 text-xs text-brand/60">
                {c.lastMessage
                  ? new Date(c.lastMessage.createdAt).toLocaleString()
                  : new Date(c.updatedAt).toLocaleString()}
              </p>
            </div>
            <Link
              href={c.orderId ? `/dashboard/orders` : "#"}
              className="rounded border border-brand/30 px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-light"
            >
              {c.orderId ? "View order" : "View"}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
