import { describe, expect, it } from "vitest";
import { GROCERY_CATEGORIES, splitCategory, validateGrocery } from "@/lib/grocery-validation";

const base = { purchaseDate: "2026-10-10", store: "Costco", amount: "42.5", categoryChoice: "", customCategory: "", notes: "", reimbursed: false };

describe("grocery validation", () => {
  it("offers the seven categories", () => {
    expect([...GROCERY_CATEGORIES]).toEqual(["General Groceries", "Produce", "Meat / Seafood", "Dairy", "Household", "Snacks / Drinks", "Other"]);
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
  it("saves a custom Other category and maps it back for editing", () => {
    const r = validateGrocery({ ...base, categoryChoice: "Other", customCategory: "Pet food" });
    expect(r.ok && r.data.category).toBe("Pet food");
    expect(splitCategory("Pet food")).toEqual({ categoryChoice: "Other", customCategory: "Pet food" });
    expect(splitCategory("Dairy")).toEqual({ categoryChoice: "Dairy", customCategory: "" });
  });
});
