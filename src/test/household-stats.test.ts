import { describe, expect, it } from "vitest";
import { householdStats, type HouseholdVisit } from "@/lib/household-stats";

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
describe("Household dashboard", () => {
  it("combines all-time grocery and maintenance amounts regardless of settlement", () => expect(stats().recorded).toBe(455.5));
  it("includes only unreimbursed groceries and unpaid maintenance in due", () => expect(stats().due).toBe(330.25));
  it("sums category amounts and due independently", () => {
    expect(stats().rows.map((r) => [r.category, r.total, r.due])).toEqual([["Groceries", 155.5, 110.25], ["A/C", 0, 0], ["Gardener", 30, 0], ["Plumber", 250, 200]]);
  });
  it("uses latest purchase date for grocery activity", () => expect(stats().rows[0]?.lastActivity).toBe("2026-10-01"));
  it("uses latest visit date for category activity", () => expect(stats().rows.find((r) => r.category === "Gardener")?.lastActivity).toBe("2026-10-04"));
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
    expect(result.rows).toEqual([{ category: "Groceries", total: 0, due: 0, lastActivity: null, nextVisit: null }]);
    expect(result.chart.map((m) => m.spend0)).toEqual([0, 0, 0]);
  });
  it("crosses year boundaries", () => expect(householdStats([], [], [], new Date(2027, 0, 1)).chart.map((m) => m.key)).toEqual(["2026-11", "2026-12", "2027-01"]));
  it("uses cents rather than floating-point sums", () => expect(householdStats([{ purchase_date: "2026-10-01", amount: 0.1, reimbursed: false }, { purchase_date: "2026-10-01", amount: 0.2, reimbursed: true }], [], [], today).recorded).toBe(0.3));
});