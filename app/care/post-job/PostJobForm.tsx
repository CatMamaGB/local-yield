"use client";

/**
 * Form for creating a help exchange posting.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ZipCodeInput } from "@/components/ZipCodeInput";
import { RADIUS_OPTIONS } from "@/lib/geo/constants";
import type { HelpExchangeCategory } from "@prisma/client";
import { apiPost } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";

const HELP_EXCHANGE_CATEGORIES: { value: HelpExchangeCategory; label: string }[] = [
  { value: "FENCE_REPAIRS", label: "Fence and Repairs" },
  { value: "GARDEN_HARVEST", label: "Garden and Harvest Help" },
  { value: "EQUIPMENT_HELP", label: "Equipment Help" },
];

export function PostJobForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<HelpExchangeCategory | "">("");
  const [zipCode, setZipCode] = useState("");
  const [radiusMiles, setRadiusMiles] = useState<number | undefined>(25);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !category || !zipCode || zipCode.trim().length !== 5) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const data = await apiPost<{ posting: { id: string } }>("/api/help-exchange/postings", {
        title: title.trim(),
        description: description.trim(),
        category,
        zipCode: zipCode.trim(),
        radiusMiles: radiusMiles ?? undefined,
      });
      router.push(`/care/browse?category=${category}`);
    } catch (err) {
      setError(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to post job"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-brand mb-1.5">
          Job title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Need help repairing pasture fence"
          className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand placeholder:text-brand/50 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-brand mb-1.5">
          Description *
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the work needed, timeline, and any requirements..."
          rows={6}
          className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand placeholder:text-brand/50 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          required
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-brand mb-1.5">
          Category *
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as HelpExchangeCategory | "")}
          className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          required
        >
          <option value="">Select category</option>
          {HELP_EXCHANGE_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="zipCode" className="block text-sm font-medium text-brand mb-1.5">
          Location ZIP code *
        </label>
        <ZipCodeInput
          value={zipCode}
          onChange={setZipCode}
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="radius" className="block text-sm font-medium text-brand mb-1.5">
          Service radius (miles)
        </label>
        <select
          id="radius"
          value={radiusMiles ?? ""}
          onChange={(e) => setRadiusMiles(e.target.value ? parseInt(e.target.value, 10) : undefined)}
          className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
        >
          <option value="">No limit</option>
          {RADIUS_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r} miles
            </option>
          ))}
        </select>
      </div>

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Posting..." : "Post job"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-brand/20 px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
