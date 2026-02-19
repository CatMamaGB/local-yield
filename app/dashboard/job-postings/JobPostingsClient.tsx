"use client";

/**
 * List of user's help exchange postings with status and Mark Filled / Close.
 */

import { useState } from "react";
import Link from "next/link";
import { apiGet, apiPatch } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { EmptyState } from "@/components/ui/EmptyState";

interface Posting {
  id: string;
  title: string;
  description: string;
  category: string;
  zipCode: string;
  radiusMiles: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface JobPostingsClientProps {
  initialPostings: Posting[];
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  FILLED: "Filled",
  CLOSED: "Closed",
};

export function JobPostingsClient({ initialPostings }: JobPostingsClientProps) {
  const [postings, setPostings] = useState<Posting[]>(initialPostings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadMine() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ postings: Posting[] }>("/api/help-exchange/postings?mine=1");
      setPostings(data.postings);
    } catch (e) {
      setError(e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Failed to load"));
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: "FILLED" | "CLOSED") {
    setUpdatingId(id);
    setError(null);
    try {
      await apiPatch(`/api/help-exchange/postings/${id}`, { status });
      setPostings((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    } catch (e) {
      setError(e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Failed to update"));
    } finally {
      setUpdatingId(null);
    }
  }

  if (postings.length === 0 && !loading) {
    return (
      <EmptyState
        title="No job postings yet"
        body="Post a farm help job from Care to get started."
        action={{ label: "Post a job", href: "/care/post-job" }}
        className="mt-6"
      />
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {error && <InlineAlert variant="error">{error}</InlineAlert>}
      <ul className="space-y-4">
        {postings.map((p) => (
          <li key={p.id} className="rounded-xl border border-brand/20 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-brand">{p.title}</h3>
                <p className="text-sm text-brand/70 mt-0.5">{p.category.replace(/_/g, " ")} · {p.zipCode}</p>
                <p className="text-sm text-brand/80 mt-2 line-clamp-2">{p.description}</p>
                <p className="text-xs text-brand/60 mt-2">Posted {new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded px-2 py-1 text-xs font-medium bg-brand/10 text-brand">
                  {STATUS_LABELS[p.status] ?? p.status}
                </span>
                {p.status === "OPEN" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(p.id, "FILLED")}
                      disabled={updatingId === p.id}
                      className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {updatingId === p.id ? "…" : "Mark filled"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(p.id, "CLOSED")}
                      disabled={updatingId === p.id}
                      className="rounded border border-brand/30 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-light disabled:opacity-50"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
      </li>
        ))}
      </ul>
      <p className="text-sm text-brand/70">
        <Link href="/care/post-job" className="text-brand-accent hover:underline">Post a new job</Link>
        {" · "}
        <Link href="/care/browse" className="text-brand-accent hover:underline">Browse care & jobs</Link>
      </p>
    </div>
  );
}
