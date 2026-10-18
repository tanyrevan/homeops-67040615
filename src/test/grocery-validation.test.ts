import { describe, expect, it } from "vitest";
import { validateGrocery } from "@/lib/grocery-validation";

const base = { purchaseDate: "2026-10-10", store: "Costco", amount: "42.5", notes: "", reimbursed: false };

describe("grocery validation", () => {
  it("saves without a category", () => {
    const r = validateGrocery(base);
    expect(r.ok).toBe(true);
    if (r.ok) expect("category" in r.data).toBe(false);
  });
  it("requires purchase date", () => {
    const r = validateGrocery({ ...base, purchaseDate: "" });
    expect(!r.ok && r.errors.purchaseDate).toBeTruthy();
  });
  it("requires store", () => {
    const r = validateGrocery({ ...base, store: " " });
    expect(!r.ok && r.errors.store).toBeTruthy();
  });
  it("requires amount", () => {
    const r = validateGrocery({ ...base, amount: "" });
    expect(!r.ok && r.errors.amount).toBeTruthy();
  });
  it("rejects negative amount and accepts zero", () => {
    const neg = validateGrocery({ ...base, amount: "-0.01" });
    expect(!neg.ok && neg.errors.amount).toBeTruthy();
    const zero = validateGrocery({ ...base, amount: "0" });
    expect(zero.ok && zero.data.amount).toBe(0);
  });
});

describe("reimbursement status", () => {
  it("defaults to Not Reimbursed and saves Reimbursed when chosen", () => {
    const no = validateGrocery(base);
    expect(no.ok && no.data.reimbursed).toBe(false);
    const yes = validateGrocery({ ...base, reimbursed: true });
    expect(yes.ok && yes.data.reimbursed).toBe(true);
  });
});
