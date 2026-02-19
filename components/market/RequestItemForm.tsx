"use client";

/**
 * "Request an item" form: buyers ask for eggs, honey, etc. POST /api/item-requests.
 */

import { useState } from "react";
import { apiPost } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";

interface RequestItemFormProps {
  defaultZip?: string;
}

export function RequestItemForm({ defaultZip = "" }: RequestItemFormProps) {
  const [description, setDescription] = useState("");
  const [zipCode, setZipCode] = useState(defaultZip);
  const [radiusMiles, setRadiusMiles] = useState(25);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      await apiPost("/api/item-requests", {
        description: description.trim(),
        zipCode: zipCode.trim().slice(0, 5) || undefined,
        radiusMiles: radiusMiles || undefined,
      });
      setStatus("success");
      setMessage("Request posted. Producers in your area will see it.");
      setDescription("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof ApiError ? apiErrorMessage(err) : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="request-description" className="block text-sm font-medium text-brand">
          What are you looking for?
        </label>
        <input
          id="request-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. eggs, honey, weekly veggie box"
          required
          minLength={2}
          className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand placeholder:text-brand/50"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="request-zip" className="block text-sm font-medium text-brand">
            Your ZIP
          </label>
          <input
            id="request-zip"
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="90210"
            maxLength={5}
            className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
          />
        </div>
        <div>
          <label htmlFor="request-radius" className="block text-sm font-medium text-brand">
            Radius (mi)
          </label>
          <input
            id="request-radius"
            type="number"
            min={1}
            max={150}
            value={radiusMiles}
            onChange={(e) => setRadiusMiles(Number(e.target.value) || 25)}
            className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
          />
        </div>
      </div>
      {message && (
        <InlineAlert variant={status === "error" ? "error" : "success"}>
          {message}
        </InlineAlert>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded bg-brand px-4 py-2 font-medium text-white hover:bg-brand/90 disabled:opacity-70"
      >
        {status === "loading" ? "Posting…" : "Request item"}
      </button>
    </form>
  );
}
