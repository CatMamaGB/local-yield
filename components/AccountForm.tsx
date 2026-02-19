"use client";

/**
 * Shared account form for all users (buyer, producer, care).
 * Edits: name, phone, ZIP, address (line1, city, state).
 * Email is display-only; password/email change note for Clerk or dev mode.
 * Used on dashboard profile page for everyone; delivery address note for buyers.
 */

import { useState, useEffect } from "react";
import { apiGet, apiPatch } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";

export interface AccountData {
  name: string;
  email: string;
  phone: string;
  zipCode: string;
  addressLine1: string;
  city: string;
  state: string;
  allowProducerExport?: boolean;
}

export function AccountForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<AccountData>({
    name: "",
    email: "",
    phone: "",
    zipCode: "",
    addressLine1: "",
    city: "",
    state: "",
    allowProducerExport: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<AccountData>("/api/account");
        if (!cancelled) {
          setForm({
            name: data.name ?? "",
            email: data.email ?? "",
            phone: data.phone ?? "",
            zipCode: data.zipCode ?? "",
            addressLine1: data.addressLine1 ?? "",
            city: data.city ?? "",
            state: data.state ?? "",
            allowProducerExport: (data as { allowProducerExport?: boolean }).allowProducerExport ?? true,
          });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? apiErrorMessage(e) : "Failed to load account");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      await apiPatch("/api/account", {
        name: form.name.trim() || undefined,
        phone: form.phone.trim() || undefined,
        zipCode: form.zipCode.trim().match(/^\d{5}$/) ? form.zipCode.trim() : undefined,
        addressLine1: form.addressLine1.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        allowProducerExport: form.allowProducerExport,
      });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof ApiError ? apiErrorMessage(e) : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
        <p className="text-brand/80">Loading account…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="account-name" className="block text-sm font-medium text-brand mb-1">
          Name
        </label>
        <input
          id="account-name"
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full rounded-lg border border-brand/20 bg-white px-3 py-2 text-brand shadow-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
          placeholder="Your name"
        />
      </div>
      <div>
        <label htmlFor="account-email" className="block text-sm font-medium text-brand mb-1">
          Email
        </label>
        <input
          id="account-email"
          type="email"
          value={form.email}
          readOnly
          className="w-full rounded-lg border border-brand/10 bg-brand-light/30 px-3 py-2 text-brand/80"
          aria-describedby="account-email-note"
        />
        <p id="account-email-note" className="mt-1 text-xs text-brand/70">
          To change email or password, use your sign-in provider settings or contact support.
        </p>
      </div>
      <div>
        <label htmlFor="account-phone" className="block text-sm font-medium text-brand mb-1">
          Phone
        </label>
        <input
          id="account-phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="w-full rounded-lg border border-brand/20 bg-white px-3 py-2 text-brand shadow-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
          placeholder="Phone number"
          required
        />
      </div>
      <div>
        <label htmlFor="account-zip" className="block text-sm font-medium text-brand mb-1">
          ZIP code
        </label>
        <input
          id="account-zip"
          type="text"
          inputMode="numeric"
          maxLength={5}
          value={form.zipCode}
          onChange={(e) => setForm((f) => ({ ...f, zipCode: e.target.value.replace(/\D/g, "").slice(0, 5) }))}
          className="w-full rounded-lg border border-brand/20 bg-white px-3 py-2 text-brand shadow-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
          placeholder="12345"
          required
        />
      </div>
      <div>
        <label htmlFor="account-address" className="block text-sm font-medium text-brand mb-1">
          Street address (for delivery)
        </label>
        <input
          id="account-address"
          type="text"
          value={form.addressLine1}
          onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
          className="w-full rounded-lg border border-brand/20 bg-white px-3 py-2 text-brand shadow-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
          placeholder="123 Main St"
        />
        <p className="mt-1 text-xs text-brand/70">
          This address is used as your default for delivery at checkout. You can change it per order if needed.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="account-allow-export"
          type="checkbox"
          checked={form.allowProducerExport ?? true}
          onChange={(e) => setForm((f) => ({ ...f, allowProducerExport: e.target.checked }))}
          className="h-4 w-4 rounded border-brand/30 text-brand-accent focus:ring-brand-accent"
        />
        <label htmlFor="account-allow-export" className="text-sm text-brand">
          Allow producers I&apos;ve ordered from to include my contact in their export (e.g. CSV)
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="account-city" className="block text-sm font-medium text-brand mb-1">
            City
          </label>
          <input
            id="account-city"
            type="text"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className="w-full rounded-lg border border-brand/20 bg-white px-3 py-2 text-brand shadow-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            placeholder="City"
          />
        </div>
        <div>
          <label htmlFor="account-state" className="block text-sm font-medium text-brand mb-1">
            State
          </label>
          <input
            id="account-state"
            type="text"
            value={form.state}
            onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            className="w-full rounded-lg border border-brand/20 bg-white px-3 py-2 text-brand shadow-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            placeholder="State"
          />
        </div>
      </div>
      {error && (
        <p className="text-sm text-brand-terracotta" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-700" role="status">
          Saved.
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-medium text-white shadow-farmhouse transition hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
