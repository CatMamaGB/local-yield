"use client";

/**
 * Producers: see "Demand in your area" — open item requests within radius of producer ZIP.
 */

import { useState, useEffect } from "react";

interface RequestRow {
  id: string;
  description: string;
  zipCode: string;
  distance: number;
  createdAt: string;
  requesterName: string | null;
}

interface DemandNearYouProps {
  producerZip: string;
  radiusMiles?: number;
}

export function DemandNearYou({ producerZip, radiusMiles = 25 }: DemandNearYouProps) {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const zip = producerZip.trim().slice(0, 5);
    if (!zip) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/item-requests?zip=${encodeURIComponent(zip)}&radius=${radiusMiles}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.requests) setRequests(data.requests);
        else setRequests([]);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [producerZip, radiusMiles]);

  if (loading) return <p className="text-sm text-brand/70">Loading demand…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (requests.length === 0) {
    return (
      <p className="text-sm text-brand/70">
        No open requests in your area yet. Buyers can post &quot;Request an item&quot; on the Market page.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {requests.map((r) => (
        <li
          key={r.id}
          className="rounded-lg border border-brand/20 bg-white p-3 text-sm"
        >
          <span className="font-medium text-brand">{r.description}</span>
          <span className="ml-2 text-brand/70">
            {r.distance} mi · {r.zipCode}
            {r.requesterName ? ` · ${r.requesterName}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
