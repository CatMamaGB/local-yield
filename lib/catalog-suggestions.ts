/**
 * Lightweight name-to-category mapping for product create/edit.
 * Used to suggest group + category from product title; telemetry can improve mappings later.
 */

export interface ProductNameMapping {
  normalized: string;
  displayName: string;
  groupId: string;
  categoryId: string;
  aliases?: string[];
}

export interface CategorySuggestion {
  groupId: string;
  categoryId: string;
  displayName: string;
}

const MODIFIERS = new Set([
  "organic", "fresh", "local", "bunch", "bag", "lb", "lbs", "oz", "pack",
  "large", "small", "medium", "dozen", "half", "whole", "raw", "wild",
]);

/**
 * Normalize product name for matching: lowercase, trim, remove punctuation,
 * remove common modifiers, collapse multiple spaces.
 */
export function normalizeProductName(name: string): string {
  let s = name
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = s.split(/\s+/).filter((w) => !MODIFIERS.has(w));
  return words.join(" ");
}

/**
 * Name → category mappings. normalized is used for lookup; displayName for UI.
 * groupId/categoryId must match PRODUCT_CATEGORY_GROUPS in product-categories.
 */
export const PRODUCT_NAME_MAPPINGS: ProductNameMapping[] = [
  // Produce
  { normalized: "eggs", displayName: "Produce → Vegetables", groupId: "produce", categoryId: "vegetables", aliases: ["egg"] },
  { normalized: "tomatoes", displayName: "Produce → Vegetables", groupId: "produce", categoryId: "vegetables" },
  { normalized: "lettuce", displayName: "Produce → Vegetables", groupId: "produce", categoryId: "vegetables" },
  { normalized: "carrots", displayName: "Produce → Vegetables", groupId: "produce", categoryId: "vegetables" },
  { normalized: "kale", displayName: "Produce → Vegetables", groupId: "produce", categoryId: "vegetables" },
  { normalized: "spinach", displayName: "Produce → Vegetables", groupId: "produce", categoryId: "vegetables" },
  { normalized: "potatoes", displayName: "Produce → Vegetables", groupId: "produce", categoryId: "vegetables" },
  { normalized: "onions", displayName: "Produce → Vegetables", groupId: "produce", categoryId: "vegetables" },
  { normalized: "peppers", displayName: "Produce → Vegetables", groupId: "produce", categoryId: "vegetables" },
  { normalized: "squash", displayName: "Produce → Vegetables", groupId: "produce", categoryId: "vegetables" },
  { normalized: "zucchini", displayName: "Produce → Vegetables", groupId: "produce", categoryId: "vegetables" },
  { normalized: "cucumbers", displayName: "Produce → Vegetables", groupId: "produce", categoryId: "vegetables" },
  { normalized: "green beans", displayName: "Produce → Vegetables", groupId: "produce", categoryId: "vegetables" },
  { normalized: "apples", displayName: "Produce → Fruits", groupId: "produce", categoryId: "fruits" },
  { normalized: "berries", displayName: "Produce → Fruits", groupId: "produce", categoryId: "fruits" },
  { normalized: "strawberries", displayName: "Produce → Fruits", groupId: "produce", categoryId: "fruits" },
  { normalized: "blueberries", displayName: "Produce → Fruits", groupId: "produce", categoryId: "fruits" },
  { normalized: "peaches", displayName: "Produce → Fruits", groupId: "produce", categoryId: "fruits" },
  { normalized: "pears", displayName: "Produce → Fruits", groupId: "produce", categoryId: "fruits" },
  { normalized: "lemons", displayName: "Produce → Fruits", groupId: "produce", categoryId: "fruits" },
  { normalized: "basil", displayName: "Produce → Herbs", groupId: "produce", categoryId: "herbs" },
  { normalized: "cilantro", displayName: "Produce → Herbs", groupId: "produce", categoryId: "herbs" },
  { normalized: "rosemary", displayName: "Produce → Herbs", groupId: "produce", categoryId: "herbs" },
  { normalized: "mint", displayName: "Produce → Herbs", groupId: "produce", categoryId: "herbs" },
  // Dairy
  { normalized: "milk", displayName: "Dairy → Milk", groupId: "dairy", categoryId: "milk" },
  { normalized: "cheese", displayName: "Dairy → Cheese", groupId: "dairy", categoryId: "cheese" },
  { normalized: "yogurt", displayName: "Dairy → Yogurt", groupId: "dairy", categoryId: "yogurt" },
  { normalized: "butter", displayName: "Dairy → Cheese", groupId: "dairy", categoryId: "cheese" },
  // Meat
  { normalized: "chicken", displayName: "Meat → Poultry", groupId: "meat", categoryId: "poultry" },
  { normalized: "beef", displayName: "Meat → Beef", groupId: "meat", categoryId: "beef" },
  { normalized: "pork", displayName: "Meat → Pork", groupId: "meat", categoryId: "pork" },
  { normalized: "turkey", displayName: "Meat → Poultry", groupId: "meat", categoryId: "poultry" },
  // Baked
  { normalized: "bread", displayName: "Baked Goods → Bread", groupId: "baked_goods", categoryId: "bread" },
  { normalized: "pastries", displayName: "Baked Goods → Pastries", groupId: "baked_goods", categoryId: "pastries" },
  { normalized: "cookies", displayName: "Baked Goods → Pastries", groupId: "baked_goods", categoryId: "pastries" },
  { normalized: "cake", displayName: "Baked Goods → Cakes", groupId: "baked_goods", categoryId: "cakes" },
  // Beverages
  { normalized: "juice", displayName: "Beverages → Juices", groupId: "beverages", categoryId: "juices" },
  { normalized: "coffee", displayName: "Beverages → Coffee", groupId: "beverages", categoryId: "coffee" },
  { normalized: "tea", displayName: "Beverages → Tea", groupId: "beverages", categoryId: "tea" },
  // Preserves
  { normalized: "honey", displayName: "Preserves → Honey", groupId: "preserves", categoryId: "honey" },
  { normalized: "jam", displayName: "Preserves → Jams", groupId: "preserves", categoryId: "jams" },
  { normalized: "jelly", displayName: "Preserves → Jams", groupId: "preserves", categoryId: "jams" },
  { normalized: "pickles", displayName: "Preserves → Pickles", groupId: "preserves", categoryId: "pickles" },
  // Prepared
  { normalized: "sauce", displayName: "Prepared Foods → Sauces", groupId: "prepared_foods", categoryId: "sauces" },
  { normalized: "salsa", displayName: "Prepared Foods → Sauces", groupId: "prepared_foods", categoryId: "sauces" },
  { normalized: "meal", displayName: "Prepared Foods → Meals", groupId: "prepared_foods", categoryId: "meals" },
  { normalized: "veggie box", displayName: "Produce → Vegetables", groupId: "produce", categoryId: "vegetables" },
  { normalized: "weekly box", displayName: "Produce → Vegetables", groupId: "produce", categoryId: "vegetables" },
];

/**
 * Return suggested groupId, categoryId, and display string for a product name, or null.
 */
export function getSuggestionForName(name: string): CategorySuggestion | null {
  const normalized = normalizeProductName(name);
  if (!normalized) return null;

  // Exact match on normalized
  const exact = PRODUCT_NAME_MAPPINGS.find(
    (m) => m.normalized === normalized || m.aliases?.includes(normalized)
  );
  if (exact) {
    return { groupId: exact.groupId, categoryId: exact.categoryId, displayName: exact.displayName };
  }

  // Contains match: first mapping whose normalized is a substring of input or vice versa
  const contains = PRODUCT_NAME_MAPPINGS.find(
    (m) =>
      normalized.includes(m.normalized) ||
      m.normalized.includes(normalized) ||
      m.aliases?.some((a) => normalized.includes(a) || normalized === a)
  );
  if (contains) {
    return { groupId: contains.groupId, categoryId: contains.categoryId, displayName: contains.displayName };
  }

  return null;
}
