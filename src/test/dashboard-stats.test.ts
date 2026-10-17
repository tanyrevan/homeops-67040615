import { describe, expect, it } from "vitest";
import { groceryByMonth, monthSummary, usd } from "@/lib/dashboard-stats";

const today = new Date(2026, 9, 17); // Oct 17 2026

const groceries = [
  { purchase_date: "2026-10-01", amount: 100.1 },
  { purchase_date: "2026-10-31", amount: 20.2 },
  { purchase_date: "2026-09-30", amount: 999 },
  { purchase_date: "2026-07-05", amount: 40 },
  { purchase_date: "2026-04-30", amount: 5 }, // outside 6-month window
];
const visits = [
  { visit_date: "2026-10-03", amount_paid: 200 },
  { visit_date: "2026-10-10", amount_paid: null },
  { visit_date: "2026-11-01", amount_paid: 50 },
];

describe("dashboard stats", () => {
  it("sums only this calendar month by record date", () => {
    expect(monthSummary(groceries, visits, today)).toEqual({ groceryTotal: 120.3, maintenanceTotal: 200, visitCount: 2 });
  });
  it("is zero for a new user", () => {
    expect(monthSummary([], [], today)).toEqual({ groceryTotal: 0, maintenanceTotal: 0, visitCount: 0 });
  });
  it("groups last 6 months with zero-filled gaps", () => {
    expect(groceryByMonth(groceries, today).map((m) => [m.label, m.total])).toEqual([
      ["May", 0], ["Jun", 0], ["Jul", 40], ["Aug", 0], ["Sep", 999], ["Oct", 120.3],
    ]);
  });
  it("crosses the year boundary", () => {
    expect(groceryByMonth([], new Date(2027, 1, 1)).map((m) => m.key)).toEqual(["2026-09", "2026-10", "2026-11", "2026-12", "2027-01", "2027-02"]);
  });
  it("formats US dollars", () => {
    expect(usd(1245.5)).toBe("$1,245.50");
  });
});
