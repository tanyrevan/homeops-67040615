export const GROCERY_CATEGORIES = [
  "General Groceries", "Produce", "Meat / Seafood", "Dairy", "Household", "Snacks / Drinks", "Other",
] as const;
const PRESETS = GROCERY_CATEGORIES.filter((c) => c !== "Other") as string[];

export type GroceryFormValues = {
  purchaseDate: string;
  store: string;
  amount: string;
  categoryChoice: string; // "" | one of GROCERY_CATEGORIES
  customCategory: string;
  notes: string;
};
export type GroceryErrors = Partial<Record<"purchaseDate" | "store" | "amount" | "receipt", string>>;

export function validateGrocery(v: GroceryFormValues):
  | { ok: true; data: { purchase_date: string; store: string; amount: number; category: string | null; notes: string | null } }
  | { ok: false; errors: GroceryErrors } {
  const errors: GroceryErrors = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.purchaseDate)) errors.purchaseDate = "Please choose the purchase date.";
  const store = v.store.trim();
  if (!store) errors.store = "Please enter the store name.";
  const raw = v.amount.trim();
  let amount = 0;
  if (!raw) errors.amount = "Please enter the amount spent.";
  else {
    const n = Number(raw);
    if (!Number.isFinite(n)) errors.amount = "Please enter a number, like 42 or 42.75.";
    else if (n < 0) errors.amount = "Amount can't be negative.";
    else amount = Math.round(n * 100) / 100;
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  let category: string | null = null;
  if (v.categoryChoice === "Other") category = v.customCategory.trim() || "Other";
  else if (PRESETS.includes(v.categoryChoice)) category = v.categoryChoice;
  return { ok: true, data: { purchase_date: v.purchaseDate, store, amount, category, notes: v.notes.trim() || null } };
}

/** Saved category back to form fields; unknown values are custom "Other" entries. */
export function splitCategory(saved: string | null): { categoryChoice: string; customCategory: string } {
  if (!saved) return { categoryChoice: "", customCategory: "" };
  if (PRESETS.includes(saved)) return { categoryChoice: saved, customCategory: "" };
  if (saved === "Other") return { categoryChoice: "Other", customCategory: "" };
  return { categoryChoice: "Other", customCategory: saved };
}
