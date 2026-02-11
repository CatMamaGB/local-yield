"use client";

/**
 * Producer products: list, add, edit, delete. Uses /api/products.
 */

import { useState, useEffect } from "react";
import Link from "next/link";

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
  createdAt: string;
}

export function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/products");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load products");
      }
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (loading) return <p className="text-brand/70">Loading products…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-brand/80">Add and edit your listings. Minimum: title, price.</p>
        <button
          type="button"
          onClick={() => { setShowAdd(true); setEditingId(null); }}
          className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
        >
          Add product
        </button>
      </div>

      {showAdd && (
        <AddProductForm
          onDone={() => { setShowAdd(false); load(); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {editingId && (
        <EditProductForm
          productId={editingId}
          onDone={() => { setEditingId(null); load(); }}
          onCancel={() => setEditingId(null)}
        />
      )}

      {products.length === 0 ? (
        <p className="rounded-xl border border-brand/20 bg-white p-8 text-center text-brand/70">
          No products yet. Click &quot;Add product&quot; to list your first item.
        </p>
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
                  {p.category} · ${p.price.toFixed(2)}
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
                  onClick={() => setEditingId(p.id)}
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

function AddProductForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [imageUrl, setImageUrl] = useState("");
  const [delivery, setDelivery] = useState(false);
  const [pickup, setPickup] = useState(true);
  const [quantityAvailable, setQuantityAvailable] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = parseFloat(price);
    if (!title.trim() || Number.isNaN(p) || p < 0) {
      alert("Title and a valid price are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          price: p,
          description: description.trim() || undefined,
          category: category.trim() || "Other",
          imageUrl: imageUrl.trim() || undefined,
          delivery,
          pickup,
          quantityAvailable: quantityAvailable === "" ? undefined : parseInt(quantityAvailable, 10),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create");
      }
      onDone();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-brand/20 bg-white p-6 space-y-4">
      <h3 className="font-display font-semibold text-brand">New product</h3>
      <div>
        <label className="block text-sm font-medium text-brand">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand">Price *</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
          rows={2}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand">Category</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
          placeholder="e.g. Produce, Dairy"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand">Image URL</label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
          placeholder="https://..."
        />
      </div>
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
      <div className="flex gap-2">
        <label className="flex items-center gap-2 text-sm text-brand">
          <input type="checkbox" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} />
          Delivery available
        </label>
        <label className="flex items-center gap-2 text-sm text-brand">
          <input type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)} />
          Pickup available
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="rounded bg-brand px-4 py-2 text-white hover:bg-brand/90 disabled:opacity-50">
          {submitting ? "Saving…" : "Add product"}
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
  onDone: () => void;
  onCancel: () => void;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [imageUrl, setImageUrl] = useState("");
  const [delivery, setDelivery] = useState(false);
  const [pickup, setPickup] = useState(true);
  const [quantityAvailable, setQuantityAvailable] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((r) => r.json())
      .then((data) => {
        const p = data.product;
        if (p) {
          setProduct(p);
          setTitle(p.title);
          setPrice(String(p.price));
          setDescription(p.description ?? "");
          setCategory(p.category ?? "Other");
          setImageUrl(p.imageUrl ?? "");
          setDelivery(Boolean(p.delivery));
          setPickup(Boolean(p.pickup));
          setQuantityAvailable(p.quantityAvailable != null ? String(p.quantityAvailable) : "");
        }
      })
      .catch(() => setProduct(null));
  }, [productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = parseFloat(price);
    if (!title.trim() || Number.isNaN(p) || p < 0) {
      alert("Title and a valid price are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          price: p,
          description: description.trim() || undefined,
          category: category.trim() || "Other",
          imageUrl: imageUrl.trim() || null,
          delivery,
          pickup,
          quantityAvailable: quantityAvailable === "" ? null : parseInt(quantityAvailable, 10),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update");
      }
      onDone();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!product) return <p className="text-brand/70">Loading…</p>;

  return (
    <form onSubmit={submit} className="rounded-xl border border-brand/20 bg-white p-6 space-y-4">
      <h3 className="font-display font-semibold text-brand">Edit product</h3>
      <div>
        <label className="block text-sm font-medium text-brand">Title *</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand">Price *</label>
        <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand" rows={2} />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand">Category</label>
        <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand" />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand">Image URL</label>
        <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand" />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand">Quantity available</label>
        <input type="number" min="0" value={quantityAvailable} onChange={(e) => setQuantityAvailable(e.target.value)} className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand" placeholder="Leave empty for unlimited" />
      </div>
      <div className="flex gap-2">
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
