"use client";

/**
 * Download CSV button and per-customer note field for Your customers page.
 */

import { useState } from "react";

interface CustomersClientProps {
  csvContent: string;
  hasCustomers: boolean;
}

export function CustomersClient({ csvContent, hasCustomers }: CustomersClientProps) {
  function downloadCsv() {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "your-customers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!hasCustomers) return null;

  return (
    <button
      type="button"
      onClick={downloadCsv}
      className="rounded-lg border border-brand/20 bg-white px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light"
    >
      Export contacts
    </button>
  );
}

interface NoteFieldProps {
  buyerId: string;
  initialNote: string | null;
}

export function CustomerNoteField({ buyerId, initialNote }: NoteFieldProps) {
  const [note, setNote] = useState(initialNote ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleBlur() {
    const value = note.trim() || null;
    if (value === (initialNote ?? null)) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/dashboard/customers/note", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerId, note: value }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full sm:w-56 shrink-0">
      <label htmlFor={`note-${buyerId}`} className="sr-only">
        Note for this customer
      </label>
      <input
        id={`note-${buyerId}`}
        type="text"
        placeholder="e.g. CSA pickup, egg customer"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={handleBlur}
        className="w-full rounded-lg border border-brand/20 bg-white px-3 py-2 text-sm text-brand placeholder:text-brand/50 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
      />
      {saving && <p className="mt-1 text-xs text-brand/60">Saving…</p>}
      {saved && !saving && <p className="mt-1 text-xs text-brand-accent">Saved.</p>}
    </div>
  );
}
