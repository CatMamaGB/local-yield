/**
 * Community feed: upcoming events and open help-exchange postings (server-rendered when zip available).
 */

import Link from "next/link";

interface FeedItem {
  events: Array<{
    id: string;
    type: "event";
    name: string;
    location: string;
    eventDate: string;
    eventHours: string | null;
    producerName: string | null;
    distance: number | null;
  }>;
  postings: Array<{
    id: string;
    type: "posting";
    title: string;
    category: string;
    createdAt: string;
    createdByName: string | null;
    distance: number | null;
  }>;
  products: Array<{
    id: string;
    type: "product";
    title: string;
    price: number;
    producerName: string | null;
    distance: number | null;
  }>;
}

interface CommunityFeedSectionProps {
  feed: FeedItem | null;
  zip: string;
}

export function CommunityFeedSection({ feed, zip }: CommunityFeedSectionProps) {
  if (!feed || (feed.events.length === 0 && feed.postings.length === 0 && feed.products.length === 0)) {
    return null;
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <h2 className="font-display text-2xl font-semibold text-brand">What&apos;s happening near you</h2>
      <p className="mt-1 text-brand/80">Upcoming events, farm help jobs, and new listings.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {feed.events.slice(0, 3).map((e) => (
          <Link
            key={e.id}
            href="/market/browse"
            className="rounded-xl border border-brand/20 bg-white p-4 shadow-sm hover:border-brand/40"
          >
            <span className="text-xs font-medium text-brand/70">Event</span>
            <p className="font-semibold text-brand mt-0.5">{e.name}</p>
            <p className="text-sm text-brand/80 mt-1">{e.location}</p>
            <p className="text-xs text-brand/60 mt-1">
              {new Date(e.eventDate).toLocaleDateString()}
              {e.distance != null && ` · ${e.distance} mi`}
            </p>
          </Link>
        ))}
        {feed.postings.slice(0, 3).map((p) => (
          <Link
            key={p.id}
            href="/care/browse?view=help-exchange"
            className="rounded-xl border border-brand/20 bg-white p-4 shadow-sm hover:border-brand/40"
          >
            <span className="text-xs font-medium text-brand/70">Farm help</span>
            <p className="font-semibold text-brand mt-0.5">{p.title}</p>
            <p className="text-sm text-brand/80 mt-1">{p.category.replace(/_/g, " ")}</p>
            <p className="text-xs text-brand/60 mt-1">
              {p.createdByName ?? "Someone"}
              {p.distance != null && ` · ${p.distance} mi`}
            </p>
          </Link>
        ))}
        {feed.products.slice(0, 3).map((p) => (
          <Link
            key={p.id}
            href="/market/browse"
            className="rounded-xl border border-brand/20 bg-white p-4 shadow-sm hover:border-brand/40"
          >
            <span className="text-xs font-medium text-brand/70">New listing</span>
            <p className="font-semibold text-brand mt-0.5">{p.title}</p>
            <p className="text-sm text-brand/80 mt-1">${p.price.toFixed(2)}</p>
            <p className="text-xs text-brand/60 mt-1">
              {p.producerName ?? "Producer"}
              {p.distance != null && ` · ${p.distance} mi`}
            </p>
          </Link>
        ))}
      </div>
      <p className="mt-4 text-sm text-brand/70">
        <Link href="/market/browse" className="text-brand-accent hover:underline">Browse market</Link>
        {" · "}
        <Link href="/care/browse" className="text-brand-accent hover:underline">Browse care & jobs</Link>
      </p>
    </section>
  );
}
