import { describe, expect, it } from "vitest";
import { monthSummary } from "@/lib/dashboard-stats";

// Deterministic "today" inside the current calendar month under test.
const today = new Date(2026, 9, 17); // Oct 17 2026

type Grocery = { purchase_date: string; amount: number; reimbursed?: boolean; created_at?: string };

describe("Dashboard monthly grocery total", () => {
  it("equals the sum of this month's purchases, excluding other months and ignoring reimbursement", () => {
    const groceries: Grocery[] = [
      // Purchase 1 this month: $100.25 (unreimbursed)
      { purchase_date: "2026-10-03", amount: 100.25, reimbursed: false, created_at: "2026-09-01T00:00:00Z" },
      // Purchase 2 this month: $45.25 (reimbursed — status must not affect the total)
      { purchase_date: "2026-10-12", amount: 45.25, reimbursed: true, created_at: "2026-11-02T00:00:00Z" },
      // Purchase 3 in a different month: $300.00 — must NOT be included
      { purchase_date: "2026-09-15", amount: 300.0, reimbursed: false, created_at: "2026-10-01T00:00:00Z" },
    ];
    // created_at values deliberately fall in different months than purchase_date:
    // the calculation must use purchase_date, not created_at.
    expect(monthSummary(groceries, [], today).groceryTotal).toBe(145.5);
  });
});
