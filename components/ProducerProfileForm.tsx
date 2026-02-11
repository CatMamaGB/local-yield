"use client";

/**
 * ProducerProfileForm — farm/maker name, bio, pickup notes, delivery toggle, delivery fee.
 */

import { useState, useEffect } from "react";
import { PickupNotesField } from "./PickupNotesField";
import { DeliverySettings } from "./DeliverySettings";

export interface ProducerProfileFormProps {
  onSaved?: () => void;
}

interface ProfileData {
  user: { name: string | null; bio: string | null; zipCode: string };
  producerProfile: {
    offersDelivery: boolean;
    deliveryFeeCents: number;
    pickupNotes: string | null;
    pickupZipCode: string | null;
  } | null;
}

export function ProducerProfileForm({ onSaved }: ProducerProfileFormProps) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");
  const [pickupZipCode, setPickupZipCode] = useState("");
  const [offersDelivery, setOffersDelivery] = useState(false);
  const [deliveryFeeCents, setDeliveryFeeCents] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/profile")
      .then((r) => r.json())
      .then((res) => {
        if (res.error) throw new Error(res.error);
        setData(res);
        setName(res.user?.name ?? "");
        setBio(res.user?.bio ?? "");
        setZipCode(res.user?.zipCode ?? "");
        setPickupNotes(res.producerProfile?.pickupNotes ?? "");
        setPickupZipCode(res.producerProfile?.pickupZipCode ?? "");
        setOffersDelivery(res.producerProfile?.offersDelivery ?? false);
        setDeliveryFeeCents(res.producerProfile?.deliveryFeeCents ?? 0);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          bio: bio.trim() || null,
          zipCode: zipCode.trim().slice(0, 5) || undefined,
          pickupNotes: pickupNotes.trim() || null,
          pickupZipCode: pickupZipCode.trim().slice(0, 5) || null,
          offersDelivery,
          deliveryFeeCents: Number(deliveryFeeCents) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-brand/70">Loading profile…</p>;
  if (error && !data) return <p className="text-red-600">{error}</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-brand">Display name / Farm name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
          placeholder="e.g. Green Valley Farm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
          placeholder="Tell buyers about your farm or products."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand">ZIP code</label>
        <input
          type="text"
          inputMode="numeric"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value.slice(0, 5))}
          className="mt-1 w-full max-w-[8rem] rounded border border-brand/30 px-3 py-2 text-brand"
          placeholder="90210"
        />
      </div>
      <PickupNotesField value={pickupNotes} onChange={setPickupNotes} />
      <div>
        <label className="block text-sm font-medium text-brand">Pickup location ZIP (optional)</label>
        <input
          type="text"
          inputMode="numeric"
          value={pickupZipCode}
          onChange={(e) => setPickupZipCode(e.target.value.slice(0, 5))}
          className="mt-1 w-full max-w-[8rem] rounded border border-brand/30 px-3 py-2 text-brand"
          placeholder="Same as above if blank"
        />
      </div>
      <DeliverySettings
        offersDelivery={offersDelivery}
        onOffersDeliveryChange={setOffersDelivery}
        deliveryFeeCents={deliveryFeeCents}
        onDeliveryFeeCentsChange={setDeliveryFeeCents}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-brand px-4 py-2 font-medium text-white hover:bg-brand/90 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
