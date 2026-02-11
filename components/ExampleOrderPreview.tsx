"use client";

/**
 * First 10 min win: show producers how a sale would look when they have no orders yet.
 * "See how a sale would look" — example order preview. Reduces anxiety, builds confidence.
 */

import { formatPrice } from "@/lib/utils";

export function ExampleOrderPreview() {
  return (
    <div className="rounded-xl border-2 border-dashed border-brand/30 bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-brand">See how a sale would look</h2>
      <p className="mt-1 text-sm text-brand/80">
        When someone orders from you, you&apos;ll see something like this. Add a product to get started.
      </p>
      <div className="mt-4 rounded-lg border border-brand/20 bg-brand-light/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand/60">Example order</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-display font-semibold text-brand">Your product name</p>
            <p className="text-sm text-brand/70">Customer name · Pickup Saturday, Mar 15</p>
          </div>
          <div className="rounded-lg border-2 border-dashed border-brand/30 bg-white px-4 py-2 text-center">
            <p className="text-xs font-medium text-brand/70 uppercase tracking-wider">Pickup code</p>
            <p className="font-mono text-xl font-bold text-brand">ABC123</p>
            <p className="text-xs text-brand/60">They show this at pickup</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-brand/70">
          Total: {formatPrice(12.5)} (card or cash — you choose at checkout)
        </p>
      </div>
    </div>
  );
}
