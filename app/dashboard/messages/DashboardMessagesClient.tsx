"use client";

/**
 * Messages: list conversations and thread view with send.
 * Use ?conversationId=<id> to open a thread. "View" opens thread in same page.
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiGet, apiPost } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export interface ConversationRow {
  id: string;
  other: { id: string; name: string | null; email: string };
  orderId: string | null;
  lastMessage: { body: string; createdAt: string; fromMe: boolean } | null;
  updatedAt: string;
}

interface MessageRow {
  id: string;
  body: string;
  createdAt: string;
  fromMe: boolean;
  senderName: string | null;
}

interface ThreadData {
  id: string;
  orderId: string | null;
  careBookingId: string | null;
  other: { id: string; name: string | null };
  messages: MessageRow[];
  updatedAt: string;
}

interface DashboardMessagesClientProps {
  initialConversations?: ConversationRow[];
}

export function DashboardMessagesClient({ initialConversations = [] }: DashboardMessagesClientProps) {
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get("conversationId") ?? searchParams.get("conversation");
  const [conversations, setConversations] = useState<ConversationRow[]>(initialConversations);
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const highlightedRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (initialConversations.length === 0) {
      setLoading(true);
      apiGet<{ conversations?: ConversationRow[] }>("/api/dashboard/conversations")
        .then((data) => setConversations(data.conversations ?? []))
        .catch((e) => setError(e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Failed to load")))
        .finally(() => setLoading(false));
    }
  }, [initialConversations.length]);

  useEffect(() => {
    if (!conversationIdFromUrl) {
      setThread(null);
      setThreadError(null);
      return;
    }
    setThreadLoading(true);
    setThreadError(null);
    apiGet<ThreadData>(`/api/dashboard/conversations/${conversationIdFromUrl}`)
      .then(setThread)
      .catch((e) => setThreadError(e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Failed to load thread")))
      .finally(() => setThreadLoading(false));
  }, [conversationIdFromUrl]);

  useEffect(() => {
    if (thread?.messages.length) threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  useEffect(() => {
    if (conversationIdFromUrl && conversations.length > 0 && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [conversationIdFromUrl, conversations.length]);

  async function handleSendMessage() {
    const body = messageDraft.trim();
    if (!body || !conversationIdFromUrl) return;
    setSending(true);
    try {
      const data = await apiPost<{ id: string; body: string; createdAt: string; fromMe: boolean }>(
        `/api/dashboard/conversations/${conversationIdFromUrl}/messages`,
        { body }
      );
      setThread((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...prev.messages,
                { id: data.id, body: data.body, createdAt: data.createdAt, fromMe: true, senderName: null },
              ],
              updatedAt: data.createdAt,
            }
          : null
      );
      setMessageDraft("");
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationIdFromUrl
            ? {
                ...c,
                lastMessage: { body: data.body, createdAt: data.createdAt, fromMe: true },
                updatedAt: data.createdAt,
              }
            : c
        )
      );
    } catch (e) {
      setThreadError(e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Failed to send"));
    } finally {
      setSending(false);
    }
  }

  if (loading) return <LoadingSkeleton rows={5} className="mt-6" />;
  if (error) return <InlineAlert variant="error" className="mt-6">{error}</InlineAlert>;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
      <div>
        {conversations.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            body="When buyers contact you about an order, or you message from a booking or review, they will appear here."
            className="mt-0"
          />
        ) : (
          <ul className="space-y-2">
            {conversations.map((c) => (
              <li
                key={c.id}
                ref={c.id === conversationIdFromUrl ? highlightedRef : undefined}
                className={`rounded-xl border bg-white p-3 shadow-sm hover:border-brand/30 ${c.id === conversationIdFromUrl ? "border-brand-accent ring-2 ring-brand-accent/30" : "border-brand/20"}`}
              >
                <Link
                  href={`/dashboard/messages?conversationId=${c.id}`}
                  className="block focus:outline-none focus:ring-2 focus:ring-brand-accent/30 rounded-lg"
                >
                  <p className="font-medium text-brand truncate">{c.other.name ?? c.other.email ?? "Customer"}</p>
                  <p className="text-sm text-brand/70 truncate">{c.other.email}</p>
                  {c.lastMessage && (
                    <p className="mt-1 line-clamp-2 text-sm text-brand/80">
                      {c.lastMessage.fromMe && <span className="text-brand/60">You: </span>}
                      {c.lastMessage.body}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-brand/60">
                    {c.lastMessage
                      ? new Date(c.lastMessage.createdAt).toLocaleString()
                      : new Date(c.updatedAt).toLocaleString()}
                  </p>
                </Link>
                <div className="mt-2 flex gap-2">
                  <Link
                    href={`/dashboard/messages?conversationId=${c.id}`}
                    className="rounded border border-brand/30 px-2 py-1 text-xs font-medium text-brand hover:bg-brand-light"
                  >
                    Open
                  </Link>
                  {c.orderId && (
                    <Link
                      href="/dashboard/orders"
                      className="rounded border border-brand/30 px-2 py-1 text-xs font-medium text-brand hover:bg-brand-light"
                    >
                      Order
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="min-h-[200px] rounded-xl border border-brand/20 bg-white p-4 shadow-sm">
        {!conversationIdFromUrl ? (
          <p className="text-brand/70 py-8 text-center">Select a conversation to view messages.</p>
        ) : threadLoading ? (
          <LoadingSkeleton rows={6} className="mt-4" />
        ) : threadError ? (
          <InlineAlert variant="error">{threadError}</InlineAlert>
        ) : thread ? (
          <>
            <div className="flex items-center justify-between border-b border-brand/10 pb-2">
              <p className="font-medium text-brand">{thread.other.name ?? "Customer"}</p>
              {(thread.orderId || thread.careBookingId) && (
                <div className="flex gap-2">
                  {thread.orderId && (
                    <Link href="/dashboard/orders" className="text-sm text-brand-accent hover:underline">View order</Link>
                  )}
                  {thread.careBookingId && (
                    <Link href="/dashboard/care-bookings" className="text-sm text-brand-accent hover:underline">View booking</Link>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto">
              {thread.messages.length === 0 ? (
                <p className="text-brand/60 text-sm">No messages yet. Say hello.</p>
              ) : (
                thread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg px-3 py-2 max-w-[85%] ${m.fromMe ? "ml-auto bg-brand/10" : "bg-brand-light/50"}`}
                  >
                    {!m.fromMe && m.senderName && (
                      <p className="text-xs font-medium text-brand/70 mb-0.5">{m.senderName}</p>
                    )}
                    <p className="text-sm text-brand whitespace-pre-wrap">{m.body}</p>
                    <p className="text-xs text-brand/50 mt-1">{new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
              <div ref={threadEndRef} />
            </div>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <textarea
                value={messageDraft}
                onChange={(e) => setMessageDraft(e.target.value)}
                placeholder="Type a message..."
                rows={2}
                className="flex-1 rounded-lg border border-brand/20 px-3 py-2 text-sm text-brand placeholder:text-brand/50 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !messageDraft.trim()}
                className="self-end rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
