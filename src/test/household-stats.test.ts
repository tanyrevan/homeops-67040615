import { describe, expect, it } from "vitest";
import { chartAxisMax, householdStats, periodTotal, type HouseholdVisit } from "@/lib/household-stats";

const today = new Date(2026, 9, 18);
const providers = [{ id: "p", service_type: "Plumber" }, { id: "g", service_type: "Gardener" }, { id: "o", service_type: "Other" }, { id: "a", service_type: "A/C" }];
const groceries = [
  { purchase_date: "2026-10-01", amount: 100.25, reimbursed: false, created_at: "2026-09-01" },
  { purchase_date: "2026-08-20", amount: 45.25, reimbursed: true, created_at: "2026-10-01" },
  { purchase_date: "2025-01-01", amount: 10, reimbursed: false },
];
const visit = (id: string, provider: string, date: string, amount: number | null, paid: boolean, next: string | null = null): HouseholdVisit => ({ id, service_provider_id: provider, visit_date: date, amount_paid: amount, paid, next_service_date: next, created_at: "2026-10-01" });
const visits = [visit("1", "p", "2026-10-02", 200, false, "2026-10-10"), visit("2", "p", "2026-08-01", 50, true, "2026-11-01"), visit("3", "g", "2026-10-03", 30, true), visit("4", "g", "2026-10-04", null, false), visit("5", "o", "2026-10-01", 20, false)];
const stats = () => householdStats(groceries, visits, providers, today);

describe("Total Spend period selector", () => {
  it("This Month uses only current-month records", () => expect(periodTotal(groceries, visits, today, "month")).toBe(350.25));
  it("Last 3 Months uses exactly the current and previous two calendar months", () => expect(periodTotal(groceries, visits, today, "last3")).toBe(445.5));
  it("Since Inception uses all records", () => expect(periodTotal(groceries, visits, today, "all")).toBe(455.5));
  it("ignores settlement status and missing amounts", () => {
    const g = [{ purchase_date: "2026-10-01", amount: 10, reimbursed: true }];
    const v = [visit("1", "p", "2026-10-02", null, true), visit("2", "p", "2026-10-03", 5, true)];
    expect(periodTotal(g, v, today, "month")).toBe(15);
  });
  it("does not affect Total Amount Due", () => {
    expect(stats().due).toBe(330.25);
    expect(periodTotal(groceries, visits, today, "month")).not.toBe(stats().due);
  });
});

describe("Household dashboard", () => {
  it("combines all-time grocery and maintenance amounts regardless of settlement", () => expect(stats().recorded).toBe(455.5));
  it("includes only unreimbursed groceries and unpaid maintenance in due", () => expect(stats().due).toBe(330.25));
  it("sums category totals for the current month with all-time due", () => {
    expect(stats().rows.map((r) => [r.category, r.total, r.due])).toEqual([["Groceries", 100.25, 110.25], ["A/C", 0, 0], ["Gardener", 30, 0], ["Plumber", 200, 200]]);
  });
  it("shows no Last Visit for groceries", () => expect(stats().rows[0]?.lastVisit).toBeNull());
  it("uses latest visit date for category Last Visit", () => expect(stats().rows.find((r) => r.category === "Gardener")?.lastVisit).toBe("2026-10-04"));
  it("takes next date from latest visit even when an older date is later", () => expect(stats().rows.find((r) => r.category === "Plumber")?.nextVisit).toBe("2026-10-10"));
  it("does not fall back to older next dates when latest is blank", () => {
    const result = householdStats([], [visit("1", "p", "2026-10-01", 10, false, "2026-11-01"), visit("2", "p", "2026-10-02", 10, false)], providers, today);
    expect(result.rows.find((r) => r.category === "Plumber")?.nextVisit).toBeNull();
  });
  it("has exactly three zero-filled calendar months", () => expect(stats().chart).toEqual([
    { key: "2026-08", label: "Aug 2026", spend0: 45.25, spend1: 0, spend2: 50 },
    { key: "2026-09", label: "Sep 2026", spend0: 0, spend1: 0, spend2: 0 },
    { key: "2026-10", label: "Oct 2026", spend0: 100.25, spend1: 30, spend2: 200 },
  ]));
  it("keeps custom and maintenance categories separate, excluding literal Other", () => expect(stats().series.map((s) => s.name)).toEqual(["Groceries", "Gardener", "Plumber"]));
  it("returns safe empty totals and a Groceries row", () => {
    const result = householdStats([], [], [], today);
    expect(result.recorded).toBe(0); expect(result.due).toBe(0);
    expect(result.rows).toEqual([{ category: "Groceries", total: 0, due: 0, lastVisit: null, nextVisit: null }]);
    expect(result.chart.map((m) => m.spend0)).toEqual([0, 0, 0]);
  });
  it("crosses year boundaries", () => expect(householdStats([], [], [], new Date(2027, 0, 1)).chart.map((m) => m.key)).toEqual(["2026-11", "2026-12", "2027-01"]));
  it("uses cents rather than floating-point sums", () => expect(householdStats([{ purchase_date: "2026-10-01", amount: 0.1, reimbursed: false }, { purchase_date: "2026-10-01", amount: 0.2, reimbursed: true }], [], [], today).recorded).toBe(0.3));
});

describe("Chart Y-axis scale", () => {
  it("is at least $1,000 in $200 increments", () => {
    expect(chartAxisMax(0)).toBe(1000);
    expect(chartAxisMax(925)).toBe(1000);
  });
  it("expands above $1,000 to the next $200 increment", () => {
    expect(chartAxisMax(1050)).toBe(1200);
    expect(chartAxisMax(1320)).toBe(1400);
  });
});
