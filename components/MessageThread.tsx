"use client";

/**
 * Order messaging / notes between buyer and producer.
 * TODO: Wire to real messages API (e.g. order notes or chat).
 */

import { useState } from "react";

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface MessageThreadProps {
  orderId: string;
  messages?: Message[];
  onSend?: (body: string) => Promise<void>;
}

export function MessageThread({
  orderId,
  messages = [],
  onSend,
}: MessageThreadProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !onSend) return;
    setSending(true);
    try {
      await onSend(input.trim());
      setInput("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-brand/20 bg-white p-4">
      <h3 className="font-display font-semibold text-brand">Order notes</h3>
      <p className="text-sm text-brand/80">Order #{orderId.slice(-6)}</p>
      <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
        {messages.length === 0 && (
          <li className="text-sm text-brand/60">No messages yet.</li>
        )}
        {messages.map((m) => (
          <li key={m.id} className="rounded bg-brand-light p-2 text-sm">
            <span className="font-medium text-brand">{m.senderName}:</span>{" "}
            {m.body}
          </li>
        ))}
      </ul>
      {onSend && (
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 rounded border border-brand/30 px-3 py-2 text-sm text-brand"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
