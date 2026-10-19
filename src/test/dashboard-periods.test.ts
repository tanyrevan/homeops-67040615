import { describe, expect, it } from "vitest";
import { availableYears, periodMonths, periodTotal, spendingChart, type HouseholdVisit } from "@/lib/household-stats";
import { monthKey } from "@/lib/dashboard-stats";

const today = new Date(2026, 9, 18); // Oct 18, 2026
const providers = [{ id: "p", service_type: "Plumber" }];
const groceries = [
  { purchase_date: "2026-10-01", amount: 100, reimbursed: false },
  { purchase_date: "2026-03-05", amount: 40, reimbursed: true },
  { purchase_date: "2025-06-15", amount: 25, reimbursed: true },
];
const visit = (id: string, date: string, amount: number | null): HouseholdVisit => ({ id, service_provider_id: "p", visit_date: date, amount_paid: amount, paid: true, created_at: "2026-10-01" });
const visits = [visit("1", "2026-10-02", 200), visit("2", "2026-01-10", 60), visit("3", "2025-12-20", 30)];

describe("Dynamic year options", () => {
  it("includes the current year even with no data", () => expect(availableYears([], [], today)).toEqual([2026]));
  it("includes previous years represented in expense data, newest first", () => expect(availableYears(groceries, visits, today)).toEqual([2026, 2025]));
  it("never shows future years", () => {
    const future = [{ purchase_date: "2099-01-01", amount: 5, reimbursed: false }];
    expect(availableYears(future, [], today)).toEqual([2026]);
  });
  it("shows 2027 automatically once the year changes", () => {
    const jan2027 = new Date(2027, 0, 5);
    expect(availableYears(groceries, visits, jan2027)).toEqual([2027, 2026, 2025]);
  });
});

describe("Total Spend with year periods", () => {
  it("defaults to This Month semantics", () => expect(periodTotal(groceries, visits, today, "month")).toBe(300));
  it("calendar year filters to that year only", () => {
    expect(periodTotal(groceries, visits, today, "year:2026")).toBe(400);
    expect(periodTotal(groceries, visits, today, "year:2025")).toBe(55);
  });
  it("All Time still covers everything", () => expect(periodTotal(groceries, visits, today, "all")).toBe(455));
});

describe("Chart period months", () => {
  it("This Month shows only the current month", () => expect(periodMonths("month", today, groceries, visits).map(monthKey)).toEqual(["2026-10"]));
  it("Last 3 Months is oldest to newest", () => expect(periodMonths("last3", today, groceries, visits).map(monthKey)).toEqual(["2026-08", "2026-09", "2026-10"]));
  it("Last 3 Months crosses year boundaries", () => {
    const feb = new Date(2027, 1, 10);
    expect(periodMonths("last3", feb, [], []).map(monthKey)).toEqual(["2026-12", "2027-01", "2027-02"]);
  });
  it("calendar year shows Jan through Dec chronologically", () => {
    const months = periodMonths("year:2026", today, groceries, visits);
    expect(months).toHaveLength(12);
    expect(months[0] && monthKey(months[0])).toBe("2026-01");
    expect(months[11] && monthKey(months[11])).toBe("2026-12");
  });
  it("All Time spans the data chronologically", () => {
    const keys = periodMonths("all", today, groceries, visits).map(monthKey);
    expect(keys[0]).toBe("2025-06");
    expect(keys[keys.length - 1]).toBe("2026-10");
    expect(keys).toEqual([...keys].sort());
  });
});

describe("Chart data per period", () => {
  it("calendar year zero-fills months with no spending and labels include the year", () => {
    const { chart } = spendingChart(groceries, visits, providers, periodMonths("year:2026", today, groceries, visits));
    expect(chart).toHaveLength(12);
    expect(chart[0]).toMatchObject({ key: "2026-01", label: "Jan 2026", spend0: 0, spend1: 60 });
    expect(chart[1]).toMatchObject({ key: "2026-02", spend0: 0, spend1: 0 });
    expect(chart[9]).toMatchObject({ key: "2026-10", spend0: 100, spend1: 200 });
  });
  it("All Time labels include the year so months are not confused", () => {
    const { chart } = spendingChart(groceries, visits, providers, periodMonths("all", today, groceries, visits));
    expect(chart[0]?.label).toBe("Jun 2025");
    expect(chart.some((m) => m.label === "Dec 2025")).toBe(true);
  });
  it("This Month chart contains only current-month spending", () => {
    const { chart } = spendingChart(groceries, visits, providers, periodMonths("month", today, groceries, visits));
    expect(chart).toEqual([{ key: "2026-10", label: "Oct 2026", spend0: 100, spend1: 200 }]);
  });
});
