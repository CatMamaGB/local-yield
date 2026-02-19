"use client";

/**
 * List of user's bids on help exchange postings.
 */

import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

interface PostingInfo {
  id: string;
  title: string;
  category: string;
  zipCode: string;
  status: string;
  createdBy: { id: string; name: string | null };
}

interface BidRow {
  id: string;
  message: string | null;
  status: string;
  createdAt: string;
  posting: PostingInfo;
}

interface MyBidsClientProps {
  initialBids: BidRow[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
};

export function MyBidsClient({ initialBids }: MyBidsClientProps) {
  if (initialBids.length === 0) {
    return (
      <EmptyState
        title="No bids yet"
        body="Apply to farm help jobs from Care browse to see them here."
        action={{ label: "Browse jobs", href: "/care/browse" }}
        className="mt-6"
      />
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <ul className="space-y-4">
        {initialBids.map((b) => (
          <li key={b.id} className="rounded-xl border border-brand/20 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-brand">{b.posting.title}</h3>
                <p className="text-sm text-brand/70">
                  {b.posting.category.replace(/_/g, " ")} · {b.posting.zipCode}
                  {b.posting.createdBy.name && ` · ${b.posting.createdBy.name}`}
                </p>
                {b.message && <p className="text-sm text-brand/80 mt-2 line-clamp-2">{b.message}</p>}
                <p className="text-xs text-brand/60 mt-2">Applied {new Date(b.createdAt).toLocaleDateString()}</p>
              </div>
              <span className="rounded px-2 py-1 text-xs font-medium bg-brand/10 text-brand">
                {STATUS_LABELS[b.status] ?? b.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-sm text-brand/70">
        <Link href="/care/browse" className="text-brand-accent hover:underline">Browse more jobs</Link>
      </p>
    </div>
  );
}
