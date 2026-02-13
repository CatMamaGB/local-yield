"use client";

/**
 * ProductCatalogForm — producers add catalog items with category, optional custom image,
 * unit, price, and quantity. Categories are grouped; custom categories are available
 * to the creator immediately (pending admin review) and to all producers once approved.
 */

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRef, useState, useEffect, useMemo } from "react";
import { apiGet, apiPost } from "@/lib/client/api-client";

// ——— Nested category structure: groups contain subcategories ———
export interface ProductSubcategory {
  id: string;
  label: string;
  defaultImageUrl: string;
}

export interface ProductCategoryGroup {
  id: string;
  label: string;
  subcategories: ProductSubcategory[];
}

/**
 * Farmers market catalog: top-level groups and subcategories for grouped selections.
 * Add new groups or subcategories here; the form dropdown uses optgroups to render them.
 */
export const PRODUCT_CATEGORY_GROUPS: ProductCategoryGroup[] = [
  {
    id: "produce",
    label: "Produce",
    subcategories: [
      { id: "fruits", label: "Fruits", defaultImageUrl: "https://placehold.co/200x200?text=Fruits" },
      { id: "vegetables", label: "Vegetables", defaultImageUrl: "https://placehold.co/200x200?text=Vegetables" },
      { id: "herbs", label: "Herbs", defaultImageUrl: "https://placehold.co/200x200?text=Herbs" },
    ],
  },
  {
    id: "dairy",
    label: "Dairy",
    subcategories: [
      { id: "milk", label: "Milk", defaultImageUrl: "https://placehold.co/200x200?text=Milk" },
      { id: "cheese", label: "Cheese", defaultImageUrl: "https://placehold.co/200x200?text=Cheese" },
      { id: "yogurt", label: "Yogurt", defaultImageUrl: "https://placehold.co/200x200?text=Yogurt" },
    ],
  },
  {
    id: "meat",
    label: "Meat",
    subcategories: [
      { id: "poultry", label: "Poultry", defaultImageUrl: "https://placehold.co/200x200?text=Poultry" },
      { id: "beef", label: "Beef", defaultImageUrl: "https://placehold.co/200x200?text=Beef" },
      { id: "pork", label: "Pork", defaultImageUrl: "https://placehold.co/200x200?text=Pork" },
    ],
  },
  {
    id: "baked_goods",
    label: "Baked Goods",
    subcategories: [
      { id: "bread", label: "Bread", defaultImageUrl: "https://placehold.co/200x200?text=Bread" },
      { id: "pastries", label: "Pastries", defaultImageUrl: "https://placehold.co/200x200?text=Pastries" },
      { id: "cakes", label: "Cakes", defaultImageUrl: "https://placehold.co/200x200?text=Cakes" },
    ],
  },
  {
    id: "beverages",
    label: "Beverages",
    subcategories: [
      { id: "juices", label: "Juices", defaultImageUrl: "https://placehold.co/200x200?text=Juices" },
      { id: "coffee", label: "Coffee", defaultImageUrl: "https://placehold.co/200x200?text=Coffee" },
      { id: "tea", label: "Tea", defaultImageUrl: "https://placehold.co/200x200?text=Tea" },
    ],
  },
  {
    id: "preserves",
    label: "Preserves",
    subcategories: [
      { id: "jams", label: "Jams", defaultImageUrl: "https://placehold.co/200x200?text=Jams" },
      { id: "pickles", label: "Pickles", defaultImageUrl: "https://placehold.co/200x200?text=Pickles" },
      { id: "honey", label: "Honey", defaultImageUrl: "https://placehold.co/200x200?text=Honey" },
    ],
  },
  {
    id: "handcrafted",
    label: "Handcrafted",
    subcategories: [
      { id: "jewelry", label: "Jewelry", defaultImageUrl: "https://placehold.co/200x200?text=Jewelry" },
      { id: "pottery", label: "Pottery", defaultImageUrl: "https://placehold.co/200x200?text=Pottery" },
      { id: "candles", label: "Candles", defaultImageUrl: "https://placehold.co/200x200?text=Candles" },
    ],
  },
  {
    id: "prepared_foods",
    label: "Prepared Foods",
    subcategories: [
      { id: "sauces", label: "Sauces", defaultImageUrl: "https://placehold.co/200x200?text=Sauces" },
      { id: "meals", label: "Meals", defaultImageUrl: "https://placehold.co/200x200?text=Meals" },
      { id: "snacks", label: "Snacks", defaultImageUrl: "https://placehold.co/200x200?text=Snacks" },
    ],
  },
];

/** Flatten all subcategory ids for validation; stored value is always a subcategory id. */
const allSubcategoryIds = PRODUCT_CATEGORY_GROUPS.flatMap((g) => g.subcategories.map((s) => s.id));

/** Find subcategory by id across all groups. */
function findSubcategoryById(id: string): ProductSubcategory | undefined {
  for (const group of PRODUCT_CATEGORY_GROUPS) {
    const found = group.subcategories.find((s) => s.id === id);
    if (found) return found;
  }
  return undefined;
}

/** @deprecated Use PRODUCT_CATEGORY_GROUPS and findSubcategoryById for flat list. */
export const PRODUCT_CATEGORIES = PRODUCT_CATEGORY_GROUPS.flatMap((g) => g.subcategories);

/** Custom category as returned by /api/catalog/categories and /api/catalog/custom-categories */
export interface CustomCategoryOption {
  id: string;
  name: string;
  correctedName: string | null;
  status: "PENDING" | "APPROVED";
  groupId: string | null;
  defaultImageUrl: string | null;
  isMine: boolean;
}

const baseFormSchema = {
  unit: z.string().min(1, "Unit is required").max(100, "Unit is too long"),
  price: z.preprocess(
    (v) =>
      v === "" || v === undefined || (typeof v === "number" && Number.isNaN(v)) ? 0 : Number(v),
    z.number().min(0, "Price must be 0 or greater")
  ),
  quantityInStock: z.preprocess(
    (v) =>
      v === "" || v === undefined || (typeof v === "number" && Number.isNaN(v)) ? 0 : Number(v),
    z.number().int().min(0, "Quantity must be 0 or greater")
  ),
  customImageFile: z.union([z.instanceof(File), z.undefined(), z.null()]).optional(),
};

function buildProductCatalogFormSchema(validCategoryIds: string[]) {
  return z.object({
    category: z
      .string()
      .min(1, "Please select a category")
      .refine((id) => validCategoryIds.includes(id), "Invalid category"),
    ...baseFormSchema,
  });
}

export type ProductCatalogFormValues = z.infer<ReturnType<typeof buildProductCatalogFormSchema>>;

/** JSON payload emitted on submit (category, optional custom image URL, unit, price, quantity). */
export interface ProductCatalogSubmitPayload {
  category: string;
  imageUrl: string;
  customImageUrl: string | null;
  unit: string;
  price: number;
  quantityInStock: number;
}

export interface ProductCatalogFormProps {
  /** Called with the product payload after validation and optional image upload. */
  onSubmit?: (payload: ProductCatalogSubmitPayload) => void | Promise<void>;
  /** Placeholder: upload custom image file and return the public URL. */
  onUploadImage?: (file: File) => Promise<string>;
  /** Optional initial values for edit mode. */
  defaultValues?: Partial<ProductCatalogFormValues>;
}

const DEFAULT_IMAGE_PLACEHOLDER = "https://placehold.co/200x200?text=Category";

export function ProductCatalogForm({
  onSubmit: onSubmitProp,
  onUploadImage,
  defaultValues,
}: ProductCatalogFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customCategories, setCustomCategories] = useState<CustomCategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [addCustomName, setAddCustomName] = useState("");
  const [addCustomGroupId, setAddCustomGroupId] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);

  useEffect(() => {
    apiGet<{ customCategories?: CustomCategoryOption[] }>("/api/catalog/categories")
      .then((data) => {
        if (data.customCategories) setCustomCategories(data.customCategories);
      })
      .catch(() => {})
      .finally(() => setLoadingCategories(false));
  }, []);

  const validCategoryIds = useMemo(
    () => [...allSubcategoryIds, ...customCategories.map((c) => c.id)],
    [customCategories]
  );
  const schema = useMemo(
    () => buildProductCatalogFormSchema(validCategoryIds),
    [validCategoryIds]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductCatalogFormValues>({
    resolver: zodResolver(schema) as Resolver<ProductCatalogFormValues>,
    defaultValues: {
      category: defaultValues?.category ?? "",
      unit: defaultValues?.unit ?? "",
      price: defaultValues?.price ?? undefined,
      quantityInStock: defaultValues?.quantityInStock ?? undefined,
      customImageFile: undefined,
      ...defaultValues,
    },
  });

  const selectedCategoryId = watch("category");
  const selectedSubcategory = findSubcategoryById(selectedCategoryId);
  const selectedCustom = customCategories.find((c) => c.id === selectedCategoryId);
  const defaultImageUrl =
    selectedSubcategory?.defaultImageUrl ??
    selectedCustom?.defaultImageUrl ??
    DEFAULT_IMAGE_PLACEHOLDER;
  const selectedCategoryLabel =
    selectedSubcategory?.label ?? selectedCustom?.correctedName ?? selectedCustom?.name ?? "";

  async function handleAddCustomCategory() {
    const name = addCustomName.trim();
    if (!name) return;
    setAddingCustom(true);
    try {
      const data = await apiPost<{ customCategory: CustomCategoryOption }>(
        "/api/catalog/custom-categories",
        { name, groupId: addCustomGroupId || undefined }
      );
      setCustomCategories((prev) => [...prev, data.customCategory]);
      setValue("category", data.customCategory.id, { shouldValidate: true });
      setAddCustomName("");
      setAddCustomGroupId("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to add category");
    } finally {
      setAddingCustom(false);
    }
  }

  const handleFormSubmit = async (data: ProductCatalogFormValues) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      let customImageUrl: string | null = null;
      if (data.customImageFile && data.customImageFile instanceof File) {
        if (onUploadImage) {
          customImageUrl = await onUploadImage(data.customImageFile);
        }
        // If no handler provided, we still output null; caller could use a placeholder.
      }

      const payload: ProductCatalogSubmitPayload = {
        category: data.category,
        imageUrl: customImageUrl ?? defaultImageUrl,
        customImageUrl,
        unit: data.unit.trim(),
        price: Number(data.price),
        quantityInStock: Number(data.quantityInStock),
      };

      if (onSubmitProp) {
        await onSubmitProp(payload);
      }

      // Log JSON for demo; remove or replace with toast in production.
      console.log("ProductCatalogForm submit payload:", JSON.stringify(payload, null, 2));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setValue("customImageFile", file ?? undefined, { shouldValidate: true });
  };

  const myCustom = customCategories.filter((c) => c.isMine);
  const approvedByAdmin = customCategories.filter((c) => !c.isMine);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Category dropdown with optgroups */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-brand">
          Category
        </label>
        <select
          id="category"
          {...register("category")}
          disabled={loadingCategories}
          className="mt-1 w-full rounded border border-brand/30 bg-white px-3 py-2 text-brand focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-60"
        >
          <option value="">Select a category</option>
          {PRODUCT_CATEGORY_GROUPS.map((group) => (
            <optgroup key={group.id} label={group.label}>
              {group.subcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.label}
                </option>
              ))}
            </optgroup>
          ))}
          {myCustom.length > 0 && (
            <optgroup label="My custom (pending until approved)">
              {myCustom.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.correctedName ?? c.name}
                  {c.status === "PENDING" ? " (pending)" : ""}
                </option>
              ))}
            </optgroup>
          )}
          {approvedByAdmin.length > 0 && (
            <optgroup label="Approved by admin">
              {approvedByAdmin.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.correctedName ?? c.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.category.message}
          </p>
        )}
      </div>

      {/* Add custom category */}
      <div className="rounded border border-brand/20 bg-brand-light/30 p-4">
        <span className="block text-sm font-medium text-brand">Add a custom category</span>
        <p className="mt-1 text-xs text-brand/70">
          Your custom category is available to you immediately and will be flagged for admin review. Once approved, it becomes public for all producers.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-[12rem] flex-1">
            <label htmlFor="add-custom-name" className="sr-only">
              New category name
            </label>
            <input
              id="add-custom-name"
              type="text"
              value={addCustomName}
              onChange={(e) => setAddCustomName(e.target.value)}
              placeholder="e.g. Heirloom Tomatoes"
              className="w-full rounded border border-brand/30 px-3 py-2 text-sm text-brand placeholder:text-brand/50"
            />
          </div>
          <div>
            <label htmlFor="add-custom-group" className="sr-only">
              Group (optional)
            </label>
            <select
              id="add-custom-group"
              value={addCustomGroupId}
              onChange={(e) => setAddCustomGroupId(e.target.value)}
              className="rounded border border-brand/30 bg-white px-3 py-2 text-sm text-brand"
            >
              <option value="">No group</option>
              {PRODUCT_CATEGORY_GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleAddCustomCategory}
            disabled={!addCustomName.trim() || addingCustom}
            className="rounded bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50"
          >
            {addingCustom ? "Adding…" : "Add & use"}
          </button>
        </div>
      </div>

      {/* Default image preview when category selected */}
      {(selectedSubcategory || selectedCustom) && (
        <div>
          <span className="block text-sm font-medium text-brand">Default image for category</span>
          <img
            src={defaultImageUrl}
            alt={selectedCategoryLabel}
            className="mt-1 h-24 w-24 rounded border border-brand/20 object-cover"
          />
          {selectedCustom?.status === "PENDING" && (
            <p className="mt-1 text-xs text-amber-700">Pending admin review — still available for your use.</p>
          )}
        </div>
      )}

      {/* Optional custom image upload */}
      <div>
        <label className="block text-sm font-medium text-brand">Custom image (optional)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-brand file:mr-3 file:rounded file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-white file:hover:bg-brand/90"
        />
        <p className="mt-1 text-xs text-brand/70">Overrides the default category image if provided.</p>
      </div>

      {/* Unit */}
      <div>
        <label htmlFor="unit" className="block text-sm font-medium text-brand">
          Unit
        </label>
        <input
          id="unit"
          type="text"
          placeholder="e.g. 6 eggs or 1 quart"
          {...register("unit")}
          className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand placeholder:text-brand/50 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        {errors.unit && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.unit.message}
          </p>
        )}
      </div>

      {/* Price */}
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-brand">
          Price ($)
        </label>
        <input
          id="price"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          {...register("price", { valueAsNumber: true })}
          className="mt-1 w-full max-w-[10rem] rounded border border-brand/30 px-3 py-2 text-brand focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        {errors.price && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.price.message}
          </p>
        )}
      </div>

      {/* Quantity in stock */}
      <div>
        <label htmlFor="quantityInStock" className="block text-sm font-medium text-brand">
          Quantity in stock
        </label>
        <input
          id="quantityInStock"
          type="number"
          min="0"
          step="1"
          placeholder="0"
          {...register("quantityInStock", { valueAsNumber: true })}
          className="mt-1 w-full max-w-[10rem] rounded border border-brand/30 px-3 py-2 text-brand focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        {errors.quantityInStock && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.quantityInStock.message}
          </p>
        )}
      </div>

      {submitError && (
        <p className="text-sm text-red-600" role="alert">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-brand px-4 py-2 font-medium text-white hover:bg-brand/90 disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : "Add product"}
      </button>
    </form>
  );
}
