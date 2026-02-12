/**
 * Messages — producer/buyer: list conversations with customers or producers.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { DashboardMessagesClient } from "./DashboardMessagesClient";

async function getConversations(userId: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/dashboard/conversations`, {
    cache: "no-store",
    headers: { cookie: "" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.conversations ?? [];
}

export default async function DashboardMessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  // Server-side we don't have cookies in fetch; load conversations in client instead.
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-brand">Messages</h1>
      <p className="mt-2 text-brand/80">
        Customer communications. Start a conversation from an order or here.
      </p>
      <DashboardMessagesClient />
    </div>
  );
}
