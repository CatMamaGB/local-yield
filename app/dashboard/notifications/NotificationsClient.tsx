"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiPatch } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatDate } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationsClient() {
  const [data, setData] = useState<{ items: NotificationItem[]; unreadCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function fetchNotifications() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ items: NotificationItem[]; unreadCount: number }>("/api/dashboard/notifications?pageSize=50");
      setData({ items: res.items ?? [], unreadCount: res.unreadCount ?? 0 });
    } catch (e) {
      setError(e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Failed to load"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function markRead(id: string, link: string | null) {
    try {
      await apiPatch(`/api/dashboard/notifications/${id}/read`, {});
      setData((prev) =>
        prev
          ? {
              items: prev.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
              unreadCount: Math.max(0, prev.unreadCount - 1),
            }
          : null
      );
      if (link) {
        router.push(link);
        return;
      }
    } catch {
      // best effort
    }
  }

  if (loading) return <LoadingSkeleton rows={5} />;
  if (error) return <InlineAlert variant="error">{error}</InlineAlert>;
  if (!data) return null;

  if (data.items.length === 0) {
    return <p className="text-brand/70">No notifications yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {data.items.map((n) => (
        <li
          key={n.id}
          className={`rounded-lg border p-4 ${n.read ? "border-brand/10 bg-white" : "border-brand/20 bg-brand-light/30"}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-brand">{n.title}</p>
              <p className="mt-1 text-sm text-brand/80">{n.body}</p>
              <p className="mt-1 text-xs text-brand/60">{formatDate(n.createdAt)}</p>
            </div>
            {!n.read && (
              <button
                type="button"
                onClick={() => markRead(n.id, n.link)}
                className="shrink-0 rounded border border-brand/30 px-2 py-1 text-xs font-medium text-brand hover:bg-brand-light"
              >
                {n.link ? "View" : "Mark read"}
              </button>
            )}
            {n.read && n.link && (
              <Link href={n.link} className="shrink-0 text-sm text-brand-accent hover:underline">
                View
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
