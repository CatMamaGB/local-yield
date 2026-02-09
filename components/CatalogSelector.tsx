"use client";

/**
 * Catalog selector for producers: choose from prebuilt catalog or custom.
 * Optional photo upload fallback (Cloudinary later).
 */

import { useState } from "react";

export interface CatalogItem {
  id: string;
  title: string;
  description: string;
  category: string;
  suggestedPrice?: number;
  stockImage?: string;
}

export interface CatalogSelectorProps {
  catalogItems?: CatalogItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  allowCustom?: boolean;
}

const DEFAULT_CATALOG: CatalogItem[] = [
  { id: "tomatoes", title: "Tomatoes", description: "Fresh tomatoes", category: "Produce", suggestedPrice: 4 },
  { id: "eggs", title: "Eggs", description: "Farm eggs", category: "Produce", suggestedPrice: 6 },
  { id: "greens", title: "Mixed greens", description: "Salad mix", category: "Produce", suggestedPrice: 5 },
];

export function CatalogSelector({
  catalogItems = DEFAULT_CATALOG,
  selectedIds,
  onSelectionChange,
  allowCustom = true,
}: CatalogSelectorProps) {
  const [customTitle, setCustomTitle] = useState("");

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  }

  return (
    <div className="rounded-xl border border-brand/20 bg-white p-4">
      <h3 className="font-display font-semibold text-brand">Add from catalog</h3>
      <p className="text-sm text-brand/80">Select items to add to your shop (optional photo upload later).</p>
      <ul className="mt-4 space-y-2">
        {catalogItems.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded bg-brand-light p-2">
            <div>
              <span className="font-medium text-brand">{item.title}</span>
              <span className="ml-2 text-sm text-brand/70">{item.category}</span>
            </div>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className={`rounded px-3 py-1 text-sm ${
                selectedIds.includes(item.id)
                  ? "bg-brand-accent text-white"
                  : "bg-white text-brand border border-brand/30"
              }`}
            >
              {selectedIds.includes(item.id) ? "Added" : "Add"}
            </button>
          </li>
        ))}
      </ul>
      {allowCustom && (
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Custom product name"
            className="flex-1 rounded border border-brand/30 px-3 py-2 text-sm text-brand"
          />
          <span className="text-sm text-brand/60">(Custom add coming soon)</span>
        </div>
      )}
    </div>
  );
}
