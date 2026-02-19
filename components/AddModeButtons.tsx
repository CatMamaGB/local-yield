"use client";

/**
 * Add mode buttons for Profile / Settings. Calls POST /api/account/modes (idempotent) and redirects.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/client/api-client";

interface AddModeButtonsProps {
  canSell: boolean;
  isCaregiver: boolean;
  isHomesteadOwner: boolean;
}

export function AddModeButtons({ canSell, isCaregiver, isHomesteadOwner }: AddModeButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function addMode(mode: "SELL" | "HELPER" | "HIRE") {
    setLoading(mode);
    try {
      const data = await apiPost<{ redirect: string }>("/api/account/modes", { mode });
      if (data?.redirect) {
        router.push(data.redirect);
        router.refresh();
      }
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {!canSell && (
        <button
          type="button"
          onClick={() => addMode("SELL")}
          disabled={loading !== null}
          className="rounded-lg border-2 border-brand/30 bg-white px-4 py-2 text-sm font-medium text-brand transition hover:border-brand hover:bg-brand-light/30 disabled:opacity-50"
        >
          {loading === "SELL" ? "Adding…" : "Add Seller"}
        </button>
      )}
      {!isCaregiver && (
        <button
          type="button"
          onClick={() => addMode("HELPER")}
          disabled={loading !== null}
          className="rounded-lg border-2 border-brand/30 bg-white px-4 py-2 text-sm font-medium text-brand transition hover:border-brand hover:bg-brand-light/30 disabled:opacity-50"
        >
          {loading === "HELPER" ? "Adding…" : "Add Helper"}
        </button>
      )}
      {!isHomesteadOwner && (
        <button
          type="button"
          onClick={() => addMode("HIRE")}
          disabled={loading !== null}
          className="rounded-lg border-2 border-brand/30 bg-white px-4 py-2 text-sm font-medium text-brand transition hover:border-brand hover:bg-brand-light/30 disabled:opacity-50"
        >
          {loading === "HIRE" ? "Adding…" : "Add Hire help"}
        </button>
      )}
    </div>
  );
}
