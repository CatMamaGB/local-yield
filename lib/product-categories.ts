/**
 * Product category groups and IDs — client-safe (no Node/prisma).
 * Use this from client components (MarketHomeSearchCard, BrowseClient).
 * Server code can import from here or from catalog-categories.ts.
 */

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

/** Predefined groups; must match ProductCatalogForm and catalog-categories. */
export const PRODUCT_CATEGORY_GROUPS: ProductCategoryGroup[] = [
  { id: "produce", label: "Produce", subcategories: [{ id: "fruits", label: "Fruits", defaultImageUrl: "https://placehold.co/200x200?text=Fruits" }, { id: "vegetables", label: "Vegetables", defaultImageUrl: "https://placehold.co/200x200?text=Vegetables" }, { id: "herbs", label: "Herbs", defaultImageUrl: "https://placehold.co/200x200?text=Herbs" }] },
  { id: "dairy", label: "Dairy", subcategories: [{ id: "milk", label: "Milk", defaultImageUrl: "https://placehold.co/200x200?text=Milk" }, { id: "cheese", label: "Cheese", defaultImageUrl: "https://placehold.co/200x200?text=Cheese" }, { id: "yogurt", label: "Yogurt", defaultImageUrl: "https://placehold.co/200x200?text=Yogurt" }] },
  { id: "meat", label: "Meat", subcategories: [{ id: "poultry", label: "Poultry", defaultImageUrl: "https://placehold.co/200x200?text=Poultry" }, { id: "beef", label: "Beef", defaultImageUrl: "https://placehold.co/200x200?text=Beef" }, { id: "pork", label: "Pork", defaultImageUrl: "https://placehold.co/200x200?text=Pork" }] },
  { id: "baked_goods", label: "Baked Goods", subcategories: [{ id: "bread", label: "Bread", defaultImageUrl: "https://placehold.co/200x200?text=Bread" }, { id: "pastries", label: "Pastries", defaultImageUrl: "https://placehold.co/200x200?text=Pastries" }, { id: "cakes", label: "Cakes", defaultImageUrl: "https://placehold.co/200x200?text=Cakes" }] },
  { id: "beverages", label: "Beverages", subcategories: [{ id: "juices", label: "Juices", defaultImageUrl: "https://placehold.co/200x200?text=Juices" }, { id: "coffee", label: "Coffee", defaultImageUrl: "https://placehold.co/200x200?text=Coffee" }, { id: "tea", label: "Tea", defaultImageUrl: "https://placehold.co/200x200?text=Tea" }] },
  { id: "preserves", label: "Preserves", subcategories: [{ id: "jams", label: "Jams", defaultImageUrl: "https://placehold.co/200x200?text=Jams" }, { id: "pickles", label: "Pickles", defaultImageUrl: "https://placehold.co/200x200?text=Pickles" }, { id: "honey", label: "Honey", defaultImageUrl: "https://placehold.co/200x200?text=Honey" }] },
  { id: "handcrafted", label: "Handcrafted", subcategories: [{ id: "jewelry", label: "Jewelry", defaultImageUrl: "https://placehold.co/200x200?text=Jewelry" }, { id: "pottery", label: "Pottery", defaultImageUrl: "https://placehold.co/200x200?text=Pottery" }, { id: "candles", label: "Candles", defaultImageUrl: "https://placehold.co/200x200?text=Candles" }] },
  { id: "artists_makers", label: "Artists & makers", subcategories: [{ id: "jewelry", label: "Jewelry", defaultImageUrl: "https://placehold.co/200x200?text=Jewelry" }, { id: "pottery", label: "Pottery", defaultImageUrl: "https://placehold.co/200x200?text=Pottery" }, { id: "candles", label: "Candles", defaultImageUrl: "https://placehold.co/200x200?text=Candles" }, { id: "art_prints", label: "Art & prints", defaultImageUrl: "https://placehold.co/200x200?text=Art" }, { id: "crafts", label: "Crafts", defaultImageUrl: "https://placehold.co/200x200?text=Crafts" }] },
  { id: "prepared_foods", label: "Prepared Foods", subcategories: [{ id: "sauces", label: "Sauces", defaultImageUrl: "https://placehold.co/200x200?text=Sauces" }, { id: "meals", label: "Meals", defaultImageUrl: "https://placehold.co/200x200?text=Meals" }, { id: "snacks", label: "Snacks", defaultImageUrl: "https://placehold.co/200x200?text=Snacks" }] },
];

export const PREDEFINED_GROUP_IDS = PRODUCT_CATEGORY_GROUPS.map((g) => g.id);

/** All subcategory IDs from all groups. Use for browse filter and product create/edit validation. */
export const ALLOWED_CATEGORY_IDS = [
  ...new Set(PRODUCT_CATEGORY_GROUPS.flatMap((g) => g.subcategories.map((s) => s.id))),
  "other",
] as const;
export type AllowedCategoryId = (typeof ALLOWED_CATEGORY_IDS)[number];

/** Generic placeholder when product has no image. Used in grid/browse so publishing is not blocked. */
export const DEFAULT_PRODUCT_IMAGE_PLACEHOLDER = "https://placehold.co/400x300?text=Product";

/** Image URL to show: product image or category-based placeholder or generic. */
export function getProductDisplayImage(imageUrl: string | null, categoryId?: string): string {
  if (imageUrl) return imageUrl;
  if (categoryId && categoryId !== "other") {
    for (const g of PRODUCT_CATEGORY_GROUPS) {
      const sub = g.subcategories.find((s) => s.id === categoryId);
      if (sub) return sub.defaultImageUrl;
    }
  }
  return DEFAULT_PRODUCT_IMAGE_PLACEHOLDER;
}

/** Get category IDs for a group (subcategory ids). */
export function getCategoryIdsForGroup(groupId: string): string[] {
  const group = PRODUCT_CATEGORY_GROUPS.find((g) => g.id === groupId);
  return group ? group.subcategories.map((s) => s.id) : [];
}

/** Get groupId for a categoryId (for telemetry when only category is stored). */
export function getGroupIdForCategoryId(categoryId: string): string {
  if (categoryId === "other") return "other";
  const group = PRODUCT_CATEGORY_GROUPS.find((g) =>
    g.subcategories.some((s) => s.id === categoryId)
  );
  return group?.id ?? "other";
}

/** Product units for price/quantity clarity. Must match validators ALLOWED_PRODUCT_UNITS. */
export const PRODUCT_UNIT_OPTIONS: { id: string; label: string }[] = [
  { id: "each", label: "Each" },
  { id: "lb", label: "Per lb" },
  { id: "bunch", label: "Bunch" },
  { id: "dozen", label: "Dozen" },
  { id: "jar", label: "Jar" },
  { id: "box", label: "Box" },
];
