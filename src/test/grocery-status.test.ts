import { describe, expect, it } from "vitest";
import { groceryStatusLabel } from "@/lib/grocery-status";

describe("Grocery status wording", () => {
  it("maps reimbursed = true to Paid", () => expect(groceryStatusLabel(true)).toBe("Paid"));
  it("maps reimbursed = false to Unpaid", () => expect(groceryStatusLabel(false)).toBe("Unpaid"));
  it("never exposes reimbursement terminology", () => {
    expect([groceryStatusLabel(true), groceryStatusLabel(false)]).not.toContain("Reimbursed");
    expect([groceryStatusLabel(true), groceryStatusLabel(false)]).not.toContain("Not Reimbursed");
  });
});
