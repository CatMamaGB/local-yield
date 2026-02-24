"use client";

/**
 * Producer products: list, add, edit, delete. Uses /api/products.
 * Create flow: name → category (auto-suggest) → price → quantity → organic → photos → fulfillment → publish.
 * Category suggestion never overwrites after manual change; success toast and redirect on save.
 */

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PRODUCT_CATEGORY_GROUPS, getGroupIdForCategoryId, PRODUCT_UNIT_OPTIONS, getProductDisplayImage } from "@/lib/product-categories";
import { getSuggestionForName } from "@/lib/catalog-suggestions";

const PRICE_MAX = 999_999.99;

type SuccessState = {
  type: "created" | "updated" | "deleted";
  message: string;
};

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: string;
  delivery: boolean;
  pickup: boolean;
  quantityAvailable: number | null;
  unit?: string | null;
  isOrganic?: boolean | null;
  createdAt: string;
}

const OTHER_GROUP_ID = "other";
const OTHER_CATEGORY_ID = "other";

function categoryOptionsForGroup(groupId: string): { id: string; label: string }[] {
  if (groupId === OTHER_GROUP_ID) return [{ id: OTHER_CATEGORY_ID, label: "Other" }];
  const group = PRODUCT_CATEGORY_GROUPS.find((g) => g.id === groupId);
  return group ? group.subcategories.map((s) => ({ id: s.id, label: s.label })) : [{ id: OTHER_CATEGORY_ID, label: "Other" }];
}

function suggestionDisplayName(groupId: string, categoryId: string): string {
  if (groupId === OTHER_GROUP_ID || categoryId === OTHER_CATEGORY_ID) return "Other";
  const group = PRODUCT_CATEGORY_GROUPS.find((g) => g.id === groupId);
  const sub = group?.subcategories.find((s) => s.id === categoryId);
  return group && sub ? `${group.label} → ${sub.label}` : "Other";
}

export function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successState, setSuccessState] = useState<SuccessState | null>(null);
  const [deleteError, setDeleteError] = useState<{ message: string; requestId?: string } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!successState) return;
    const t = setTimeout(() => setSuccessState(null), 5000);
    return () => clearTimeout(t);
  }, [successState]);

  useEffect(() => {
    if (!deleteError) return;
    const t = setTimeout(() => setDeleteError(null), 8000);
    return () => clearTimeout(t);
  }, [deleteError]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ products?: Product[] }>("/api/products");
      setProducts(data.products ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Failed to load"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    setDeleteError(null);
    try {
      await apiDelete(`/api/products/${id}`);
      setSuccessState({ type: "deleted", message: "Product deleted" });
      await load();
    } catch (e) {
      const message = e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Delete failed");
      const requestId = e instanceof ApiError ? e.requestId : undefined;
      setDeleteError({ message, requestId });
    }
  }

  if (loading) return <LoadingSkeleton rows={5} />;
  if (error) return <InlineAlert variant="error">{error}</InlineAlert>;

  return (
    <div className="space-y-6">
      {successState && (
        <InlineAlert variant="success">{successState.message}</InlineAlert>
      )}
      {deleteError && (
        <InlineAlert variant="error" title="Could not delete">
          {deleteError.message}
          {deleteError.requestId && (
            <span className="mt-1 block text-xs opacity-80">Request ID: {deleteError.requestId}</span>
          )}
        </InlineAlert>
      )}
      <div className="flex items-center justify-between">
        <p className="text-brand/80">Add and edit your listings. Name, category, and price required.</p>
        <button
          type="button"
          onClick={() => { setShowAdd(true); setEditingId(null); setDeleteError(null); }}
          className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
        >
          Add product
        </button>
      </div>

      {showAdd && (
        <AddProductForm
          onDone={(state) => {
            setShowAdd(false);
            if (state) setSuccessState(state);
            load();
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {editingId && (
        <EditProductForm
          productId={editingId}
          onDone={(state) => {
            setEditingId(null);
            if (state) setSuccessState(state);
            load();
          }}
          onCancel={() => setEditingId(null)}
        />
      )}

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          body="Click Add product to list your first item."
          className="mt-4"
        />
      ) : (
        <ul className="space-y-3">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand/20 bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold text-brand">{p.title}</p>
                <p className="text-sm text-brand/70">
                  {p.category}
                  {p.isOrganic === true && (
                    <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Organic</span>
                  )}
                  {" · "}
                  ${p.price.toFixed(2)}
                  {p.unit ? ` / ${p.unit}` : ""}
                  {p.quantityAvailable !== null && (
                    <span> · {p.quantityAvailable === 0 ? "Sold out" : `${p.quantityAvailable} available`}</span>
                  )}
                  {p.delivery && " · Delivery"}
                  {p.pickup && " · Pickup"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setEditingId(p.id); setDeleteError(null); }}
                  className="rounded border border-brand/30 px-3 py-1.5 text-sm text-brand hover:bg-brand-light"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center">
        <Link href="/dashboard" className="text-sm text-brand-accent hover:underline">← Back to dashboard</Link>
      </p>
    </div>
  );
}

function UploadPhotoButton({
  onUploaded,
  onError,
}: {
  onUploaded: (url: string) => void;
  onError: (message: string, requestId?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const json = await res.json();
      if (json?.ok && json?.data?.url) {
        onUploaded(json.data.url);
      } else {
        onError(json?.error ?? "Upload failed", json?.requestId);
      }
    } catch {
      onError("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="shrink-0 rounded border border-brand/40 bg-brand/10 px-3 py-2 text-sm font-medium text-brand hover:bg-brand/20 disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "Upload photo"}
      </button>
    </>
  );
}

function AddProductForm({ onDone, onCancel }: { onDone: (state?: SuccessState) => void; onCancel: () => void }) {
  const categorySectionRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState(OTHER_GROUP_ID);
  const [categoryId, setCategoryId] = useState(OTHER_CATEGORY_ID);
  const [categoryManuallyChanged, setCategoryManuallyChanged] = useState(false);
  const [suggestionNote, setSuggestionNote] = useState<string | null>(null);
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [delivery, setDelivery] = useState(false);
  const [pickup, setPickup] = useState(true);
  const [isOrganic, setIsOrganic] = useState<boolean | null>(null);
  const [quantityAvailable, setQuantityAvailable] = useState("");
  const [unit, setUnit] = useState("each");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ message: string; requestId?: string } | null>(null);

  const categoryOptions = categoryOptionsForGroup(groupId);

  useEffect(() => {
    if (categoryManuallyChanged) return;
    const suggestion = getSuggestionForName(title);
    if (suggestion) {
      setGroupId(suggestion.groupId);
      const opts = categoryOptionsForGroup(suggestion.groupId);
      const hasCategory = opts.some((o) => o.id === suggestion.categoryId);
      setCategoryId(hasCategory ? suggestion.categoryId : opts[0]?.id ?? OTHER_CATEGORY_ID);
      setSuggestedCategoryId(suggestion.categoryId);
      setSuggestionNote(suggestionDisplayName(suggestion.groupId, suggestion.categoryId));
    } else {
      setSuggestionNote(null);
      setSuggestedCategoryId(null);
    }
  }, [title, categoryManuallyChanged]);

  useEffect(() => {
    const opts = categoryOptionsForGroup(groupId);
    // Intentionally exclude categoryId from deps: only reset when groupId changes, not when categoryId changes
    if (!opts.some((o) => o.id === categoryId)) setCategoryId(opts[0]?.id ?? OTHER_CATEGORY_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const p = parseFloat(price);
    if (!title.trim()) {
      setSubmitError({ message: "Product name is required." });
      return;
    }
    if (Number.isNaN(p) || p <= 0 || p > PRICE_MAX) {
      setSubmitError({ message: `Price must be greater than 0 and at most ${PRICE_MAX.toLocaleString()}.` });
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/api/products", {
        title: title.trim(),
        price: p,
        description: description.trim() || undefined,
        category: categoryId,
        groupId,
        imageUrl: imageUrl.trim() || undefined,
        delivery,
        pickup,
        isOrganic: isOrganic ?? undefined,
        quantityAvailable: quantityAvailable === "" ? undefined : parseInt(quantityAvailable, 10),
        unit: unit || undefined,
        ...(suggestedCategoryId != null && {
          suggestedCategoryId,
          suggestionAccepted: categoryId === suggestedCategoryId,
        }),
      });
      onDone({ type: "created", message: "Product created" });
    } catch (err) {
      const message = err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to save");
      const requestId = err instanceof ApiError ? err.requestId : undefined;
      setSubmitError({ message, requestId });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-brand/20 bg-white p-6 space-y-4">
      <h3 className="font-display font-semibold text-brand">New product</h3>

      {submitError && (
        <InlineAlert variant="error" title="Could not save">
          {submitError.message}
          {submitError.requestId && (
            <span className="mt-1 block text-xs opacity-80">Request ID: {submitError.requestId}</span>
          )}
        </InlineAlert>
      )}

      <div>
        <label className="block text-sm font-medium text-brand">Product name *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setSubmitError(null); }}
          className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
          placeholder="e.g. Carrots, Dozen Eggs"
          required
        />
        {suggestionNote && (
          <p className="mt-1 text-xs text-brand/70">
            Suggested category: {suggestionNote}
            {" · "}
            <button
              type="button"
              onClick={() => categorySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className="underline hover:no-underline"
            >
              Change
            </button>
          </p>
        )}
      </div>

      <div ref={categorySectionRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-brand">Group *</label>
          <select
            value={groupId}
            onChange={(e) => { setGroupId(e.target.value); setCategoryManuallyChanged(true); setSubmitError(null); }}
            className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand bg-white"
          >
            {PRODUCT_CATEGORY_GROUPS.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
            <option value={OTHER_GROUP_ID}>Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-brand">Category *</label>
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setCategoryManuallyChanged(true); setSubmitError(null); }}
            className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand bg-white"
          >
            {categoryOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand">Price *</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          max={PRICE_MAX}
          value={price}
          onChange={(e) => { setPrice(e.target.value); setSubmitError(null); }}
          className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
          placeholder="0.00"
          required
        />
        <p className="mt-0.5 text-xs text-brand/60">USD. Min 0.01, max 999,999.99</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-brand">Quantity available</label>
          <input
            type="number"
            min="0"
            value={quantityAvailable}
            onChange={(e) => setQuantityAvailable(e.target.value)}
            className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
            placeholder="Leave empty for unlimited"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand">Unit</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand bg-white"
          >
            {PRODUCT_UNIT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <p className="mt-0.5 text-xs text-brand/60">Price is per this unit (e.g. per lb, per dozen).</p>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-brand">
          <input type="checkbox" checked={isOrganic === true} onChange={(e) => setIsOrganic(e.target.checked ? true : null)} />
          Organic
        </label>
        <p className="mt-0.5 text-xs text-brand/60">Mark if certified or sold as organic.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand">Photo (optional)</label>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="min-w-0 flex-1 rounded border border-brand/30 px-3 py-2 text-brand"
            placeholder="https://... or upload below"
          />
          <UploadPhotoButton
            onUploaded={(url) => setImageUrl(url)}
            onError={(msg, requestId) => setSubmitError({ message: msg, requestId })}
          />
        </div>
        {imageUrl && (
          <div className="mt-2 flex items-center gap-2">
            <Image
              src={getProductDisplayImage(imageUrl, categoryId)}
              alt="Preview"
              width={64}
              height={64}
              className="h-16 w-16 rounded-lg border border-brand/20 object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="text-sm text-brand/70 hover:text-red-600 underline"
            >
              Remove
            </button>
          </div>
        )}
        <p className="mt-0.5 text-xs text-brand/60">Upload a photo or paste an image URL. A placeholder is used if left blank.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand mb-2">Fulfillment</label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-brand">
            <input type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)} />
            Pickup available
          </label>
          <label className="flex items-center gap-2 text-sm text-brand">
            <input type="checkbox" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} />
            Delivery available
          </label>
        </div>
        <p className="mt-0.5 text-xs text-brand/60">Pickup is on by default. Enable delivery if you offer it.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
          rows={2}
          placeholder="Brief description for buyers"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={submitting} className="rounded bg-brand px-4 py-2 text-white hover:bg-brand/90 disabled:opacity-50">
          {submitting ? "Saving…" : "Publish product"}
        </button>
        <button type="button" onClick={onCancel} className="rounded border border-brand/30 px-4 py-2 text-brand hover:bg-brand-light">
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditProductForm({
  productId,
  onDone,
  onCancel,
}: {
  productId: string;
  onDone: (state?: SuccessState) => void;
  onCancel: () => void;
}) {
  const categorySectionRef = useRef<HTMLDivElement>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState(OTHER_GROUP_ID);
  const [categoryId, setCategoryId] = useState(OTHER_CATEGORY_ID);
  const [categoryManuallyChanged, setCategoryManuallyChanged] = useState(false);
  const [suggestionNote, setSuggestionNote] = useState<string | null>(null);
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [delivery, setDelivery] = useState(false);
  const [pickup, setPickup] = useState(true);
  const [isOrganic, setIsOrganic] = useState<boolean | null>(null);
  const [quantityAvailable, setQuantityAvailable] = useState("");
  const [unit, setUnit] = useState("each");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ message: string; requestId?: string } | null>(null);

  const categoryOptions = categoryOptionsForGroup(groupId);

  useEffect(() => {
    apiGet<{ product: Product }>(`/api/products/${productId}`)
      .then((data) => {
        const p = data.product;
        if (p) {
          setProduct(p);
          setTitle(p.title);
          setPrice(String(p.price));
          setDescription(p.description ?? "");
          const cat = p.category ?? OTHER_CATEGORY_ID;
          setCategoryId(cat);
          setGroupId(getGroupIdForCategoryId(cat));
          setImageUrl(p.imageUrl ?? "");
          setDelivery(Boolean(p.delivery));
          setPickup(Boolean(p.pickup));
          setIsOrganic(p.isOrganic ?? null);
          setQuantityAvailable(p.quantityAvailable != null ? String(p.quantityAvailable) : "");
          setUnit(p.unit && PRODUCT_UNIT_OPTIONS.some((o) => o.id === p.unit) ? p.unit : "each");
        }
      })
      .catch(() => setProduct(null));
  }, [productId]);

  useEffect(() => {
    if (categoryManuallyChanged) return;
    const suggestion = getSuggestionForName(title);
    if (suggestion) {
      setGroupId(suggestion.groupId);
      const opts = categoryOptionsForGroup(suggestion.groupId);
      const hasCategory = opts.some((o) => o.id === suggestion.categoryId);
      setCategoryId(hasCategory ? suggestion.categoryId : opts[0]?.id ?? OTHER_CATEGORY_ID);
      setSuggestedCategoryId(suggestion.categoryId);
      setSuggestionNote(suggestionDisplayName(suggestion.groupId, suggestion.categoryId));
    } else {
      setSuggestionNote(null);
      setSuggestedCategoryId(null);
    }
  }, [title, categoryManuallyChanged]);

  useEffect(() => {
    const opts = categoryOptionsForGroup(groupId);
    // Intentionally exclude categoryId from deps: only reset when groupId changes, not when categoryId changes
    if (!opts.some((o) => o.id === categoryId)) setCategoryId(opts[0]?.id ?? OTHER_CATEGORY_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const p = parseFloat(price);
    if (!title.trim()) {
      setSubmitError({ message: "Product name is required." });
      return;
    }
    if (Number.isNaN(p) || p <= 0 || p > PRICE_MAX) {
      setSubmitError({ message: `Price must be greater than 0 and at most ${PRICE_MAX.toLocaleString()}.` });
      return;
    }
    setSubmitting(true);
    try {
      await apiPatch(`/api/products/${productId}`, {
        title: title.trim(),
        price: p,
        description: description.trim() || undefined,
        category: categoryId,
        groupId,
        imageUrl: imageUrl.trim() || null,
        delivery,
        pickup,
        isOrganic: isOrganic ?? undefined,
        quantityAvailable: quantityAvailable === "" ? null : parseInt(quantityAvailable, 10),
        unit: unit || null,
        ...(suggestedCategoryId != null && {
          suggestedCategoryId,
          suggestionAccepted: categoryId === suggestedCategoryId,
        }),
      });
      onDone({ type: "updated", message: "Product updated" });
    } catch (err) {
      const message = err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to save");
      const requestId = err instanceof ApiError ? err.requestId : undefined;
      setSubmitError({ message, requestId });
    } finally {
      setSubmitting(false);
    }
  }

  if (!product) return <p className="text-brand/70">Loading…</p>;

  return (
    <form onSubmit={submit} className="rounded-xl border border-brand/20 bg-white p-6 space-y-4">
      <h3 className="font-display font-semibold text-brand">Edit product</h3>

      {submitError && (
        <InlineAlert variant="error" title="Could not save">
          {submitError.message}
          {submitError.requestId && (
            <span className="mt-1 block text-xs opacity-80">Request ID: {submitError.requestId}</span>
          )}
        </InlineAlert>
      )}

      <div>
        <label className="block text-sm font-medium text-brand">Product name *</label>
        <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setSubmitError(null); }} className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand" required />
        {suggestionNote && (
          <p className="mt-1 text-xs text-brand/70">
            Suggested category: {suggestionNote}
            {" · "}
            <button
              type="button"
              onClick={() => categorySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className="underline hover:no-underline"
            >
              Change
            </button>
          </p>
        )}
      </div>
      <div ref={categorySectionRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-brand">Group *</label>
          <select
            value={groupId}
            onChange={(e) => { setGroupId(e.target.value); setCategoryManuallyChanged(true); setSubmitError(null); }}
            className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand bg-white"
          >
            {PRODUCT_CATEGORY_GROUPS.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
            <option value={OTHER_GROUP_ID}>Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-brand">Category *</label>
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setCategoryManuallyChanged(true); setSubmitError(null); }}
            className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand bg-white"
          >
            {categoryOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-brand">Price *</label>
        <input type="number" step="0.01" min="0.01" max={PRICE_MAX} value={price} onChange={(e) => { setPrice(e.target.value); setSubmitError(null); }} className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand" rows={2} />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand">Image URL</label>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="min-w-0 flex-1 rounded border border-brand/30 px-3 py-2 text-brand" placeholder="https://... or upload below" />
          <UploadPhotoButton onUploaded={(url) => setImageUrl(url)} onError={(msg, requestId) => setSubmitError({ message: msg, requestId })} />
        </div>
        {imageUrl && (
          <div className="mt-2 flex items-center gap-2">
            <Image src={getProductDisplayImage(imageUrl, categoryId)} alt="Preview" width={64} height={64} className="h-16 w-16 rounded-lg border border-brand/20 object-cover" unoptimized />
            <button type="button" onClick={() => setImageUrl("")} className="text-sm text-brand/70 hover:text-red-600 underline">Remove</button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-brand">Quantity available</label>
          <input type="number" min="0" value={quantityAvailable} onChange={(e) => setQuantityAvailable(e.target.value)} className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand" placeholder="Leave empty for unlimited" />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand">Unit</label>
          <select value={unit} onChange={(e) => setUnit(e.target.value)} className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand bg-white">
            {PRODUCT_UNIT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-brand">
          <input type="checkbox" checked={isOrganic === true} onChange={(e) => setIsOrganic(e.target.checked ? true : null)} />
          Organic
        </label>
        <label className="flex items-center gap-2 text-sm text-brand">
          <input type="checkbox" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} />
          Delivery
        </label>
        <label className="flex items-center gap-2 text-sm text-brand">
          <input type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)} />
          Pickup
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="rounded bg-brand px-4 py-2 text-white hover:bg-brand/90 disabled:opacity-50">{submitting ? "Saving…" : "Save"}</button>
        <button type="button" onClick={onCancel} className="rounded border border-brand/30 px-4 py-2 text-brand hover:bg-brand-light">Cancel</button>
      </div>
    </form>
  );
}
