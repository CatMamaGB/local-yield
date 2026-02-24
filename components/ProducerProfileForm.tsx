"use client";

/**
 * ProducerProfileForm — business page: name, About Us, Story, image, delivery/pickup,
 * Upcoming Events, Contact (email, location, hours, in-app vs email toggle).
 * Editable anytime; displayed on public storefront.
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { PickupNotesField } from "./PickupNotesField";
import { DeliverySettings } from "./DeliverySettings";
import { apiGet, apiPatch } from "@/lib/client/api-client";

export interface ProducerProfileFormProps {
  onSaved?: () => void;
}

interface UpcomingEvent {
  id: string;
  name: string;
  location: string;
  eventDate: string;
  eventHours: string | null;
}

interface ProfileData {
  user: { name: string | null; bio: string | null; zipCode: string };
  producerProfile: {
    offersDelivery: boolean;
    deliveryFeeCents: number;
    pickupNotes: string | null;
    pickupZipCode: string | null;
    aboutUs: string | null;
    story: string | null;
    profileImageUrl: string | null;
    contactEmail: string | null;
    generalLocation: string | null;
    availabilityHours: string | null;
    acceptInAppMessagesOnly: boolean;
  } | null;
  upcomingEvents: UpcomingEvent[];
}

export function ProducerProfileForm({ onSaved }: ProducerProfileFormProps) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [aboutUs, setAboutUs] = useState("");
  const [story, setStory] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");
  const [pickupZipCode, setPickupZipCode] = useState("");
  const [offersDelivery, setOffersDelivery] = useState(false);
  const [deliveryFeeCents, setDeliveryFeeCents] = useState(0);
  const [contactEmail, setContactEmail] = useState("");
  const [generalLocation, setGeneralLocation] = useState("");
  const [availabilityHours, setAvailabilityHours] = useState("");
  const [acceptInAppMessagesOnly, setAcceptInAppMessagesOnly] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<ProfileData>("/api/dashboard/profile")
      .then((res) => {
        setData(res);
        setName(res.user?.name ?? "");
        setBio(res.user?.bio ?? "");
        setZipCode(res.user?.zipCode ?? "");
        const p = res.producerProfile;
        setPickupNotes(p?.pickupNotes ?? "");
        setPickupZipCode(p?.pickupZipCode ?? "");
        setOffersDelivery(p?.offersDelivery ?? false);
        setDeliveryFeeCents(p?.deliveryFeeCents ?? 0);
        setAboutUs(p?.aboutUs ?? "");
        setStory(p?.story ?? "");
        setProfileImageUrl(p?.profileImageUrl ?? "");
        setContactEmail(p?.contactEmail ?? "");
        setGeneralLocation(p?.generalLocation ?? "");
        setAvailabilityHours(p?.availabilityHours ?? "");
        setAcceptInAppMessagesOnly(p?.acceptInAppMessagesOnly ?? true);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiPatch("/api/dashboard/profile", {
        name: name.trim() || null,
        bio: bio.trim() || null,
        zipCode: zipCode.trim().slice(0, 5) || undefined,
        pickupNotes: pickupNotes.trim() || null,
        pickupZipCode: pickupZipCode.trim().slice(0, 5) || null,
        offersDelivery,
        deliveryFeeCents: Number(deliveryFeeCents) || 0,
        aboutUs: aboutUs.trim() || null,
        story: story.trim() || null,
        profileImageUrl: profileImageUrl.trim() || null,
        contactEmail: contactEmail.trim() || null,
        generalLocation: generalLocation.trim() || null,
        availabilityHours: availabilityHours.trim() || null,
        acceptInAppMessagesOnly,
      });
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-brand/70">Loading profile…</p>;
  if (error && !data) return <p className="text-red-600">{error}</p>;

  const upcomingEvents = (data?.upcomingEvents ?? []) as UpcomingEvent[];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic info */}
      <section className="rounded-xl border border-brand/20 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-brand">Basic info</h2>
        <div className="mt-4 space-y-4">
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
            <label className="block text-sm font-medium text-brand">Short bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
              placeholder="One line for cards and headers."
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
        </div>
      </section>

      {/* About Us */}
      <section className="rounded-xl border border-brand/20 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-brand">About Us</h2>
        <p className="mt-1 text-sm text-brand/70">Rich description for your business page.</p>
        <textarea
          value={aboutUs}
          onChange={(e) => setAboutUs(e.target.value)}
          rows={5}
          className="mt-4 w-full rounded border border-brand/30 px-3 py-2 text-brand"
          placeholder="Tell customers about your farm, values, and what you offer."
        />
      </section>

      {/* Story */}
      <section className="rounded-xl border border-brand/20 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-brand">Story</h2>
        <p className="mt-1 text-sm text-brand/70">Your journey, how you started, or what makes you unique.</p>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          rows={4}
          className="mt-4 w-full rounded border border-brand/30 px-3 py-2 text-brand"
          placeholder="Optional: your story in your own words."
        />
      </section>

      {/* Business image */}
      <section className="rounded-xl border border-brand/20 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-brand">Business / hero image</h2>
        <p className="mt-1 text-sm text-brand/70">Optional image URL for your storefront header.</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <input
            type="url"
            value={profileImageUrl}
            onChange={(e) => setProfileImageUrl(e.target.value)}
            className="flex-1 min-w-[12rem] rounded border border-brand/30 px-3 py-2 text-brand"
            placeholder="https://..."
          />
          {profileImageUrl && (
            <Image
              src={profileImageUrl}
              alt="Preview"
              width={96}
              height={96}
              className="h-24 w-24 rounded border border-brand/20 object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
              unoptimized
            />
          )}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="rounded-xl border border-brand/20 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-brand">Upcoming Events</h2>
        <p className="mt-1 text-sm text-brand/70">Markets, pop-ups: dates, locations, and hours. Shown on your storefront.</p>
        {upcomingEvents.length === 0 ? (
          <p className="mt-4 text-brand/60">No upcoming events. Add events to show them here and on your storefront.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {upcomingEvents.map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline gap-2 rounded-lg border border-brand/10 bg-brand-light/30 px-3 py-2 text-sm text-brand">
                <span className="font-medium">{e.name}</span>
                <span className="text-brand/70">· {e.location}</span>
                <span className="text-brand/70">{new Date(e.eventDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                {e.eventHours && <span className="text-brand/70">{e.eventHours}</span>}
              </li>
            ))}
          </ul>
        )}
        <Link href="/dashboard/events" className="mt-4 inline-block text-sm font-medium text-brand-accent hover:underline">
          Manage events →
        </Link>
      </section>

      {/* Contact */}
      <section className="rounded-xl border border-brand/20 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-brand">Contact</h2>
        <p className="mt-1 text-sm text-brand/70">How customers can reach you. Choose whether to show email on your storefront or use in-app messages only.</p>
        <div className="mt-4 space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium text-brand">
            <input
              type="checkbox"
              checked={acceptInAppMessagesOnly}
              onChange={(e) => setAcceptInAppMessagesOnly(e.target.checked)}
              className="rounded border-brand/30 text-brand"
            />
            In-app messages only (do not show my email on storefront)
          </label>
          {!acceptInAppMessagesOnly && (
            <div>
              <label className="block text-sm font-medium text-brand">Contact email (shown on storefront)</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="mt-1 w-full max-w-md rounded border border-brand/30 px-3 py-2 text-brand"
                placeholder="you@example.com"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-brand">General location (optional)</label>
            <input
              type="text"
              value={generalLocation}
              onChange={(e) => setGeneralLocation(e.target.value)}
              className="mt-1 w-full max-w-md rounded border border-brand/30 px-3 py-2 text-brand"
              placeholder="e.g. North County, Downtown Market"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand">Availability hours (optional)</label>
            <input
              type="text"
              value={availabilityHours}
              onChange={(e) => setAvailabilityHours(e.target.value)}
              className="mt-1 w-full max-w-md rounded border border-brand/30 px-3 py-2 text-brand"
              placeholder="e.g. Sat 9am–2pm, or By appointment"
            />
          </div>
        </div>
      </section>

      {/* Pickup & delivery */}
      <section className="rounded-xl border border-brand/20 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-brand">Pickup & delivery</h2>
        <div className="mt-4 space-y-4">
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
        </div>
      </section>

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
