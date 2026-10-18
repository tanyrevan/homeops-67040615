export type GroceryFormValues = {
  purchaseDate: string;
  store: string;
  amount: string;
  notes: string;
  reimbursed: boolean;
};
export type GroceryErrors = Partial<Record<"purchaseDate" | "store" | "amount" | "receipt", string>>;

export function validateGrocery(v: GroceryFormValues):
  | { ok: true; data: { purchase_date: string; store: string; amount: number; notes: string | null; reimbursed: boolean } }
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
  return { ok: true, data: { purchase_date: v.purchaseDate, store, amount, notes: v.notes.trim() || null, reimbursed: v.reimbursed === true } };
}
