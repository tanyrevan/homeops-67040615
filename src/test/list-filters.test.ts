import { describe, expect, it } from "vitest";
import {
  DEFAULT_GROCERY_FILTERS, DEFAULT_PROVIDER_FILTERS,
  filterGroceries, filterProviders, filterHistory, historyFilterOptions, DEFAULT_HISTORY_FILTERS,
  type HistoryItem,
} from "@/lib/list-filters";

const providers = [
  { id: "1", name: "Bob's Pools", service_type: "Jacuzzi", created_at: "2026-01-01" },
  { id: "2", name: "alice garden", service_type: "Gardener", created_at: "2026-02-01" },
  { id: "3", name: "Carl Plumbing", service_type: "Plumber", created_at: "2026-03-01" },
];

describe("providers", () => {
  it("default sorts newest first without star grouping", () => {
    expect(filterProviders(providers, new Set(["1"]), DEFAULT_PROVIDER_FILTERS).map((p) => p.id)).toEqual(["3", "2", "1"]);
  });
  it("searches name case-insensitively", () => {
    expect(filterProviders(providers, new Set(), { ...DEFAULT_PROVIDER_FILTERS, q: "ALICE" }).map((p) => p.id)).toEqual(["2"]);
  });
  it("Other type matches custom types", () => {
    expect(filterProviders(providers, new Set(), { ...DEFAULT_PROVIDER_FILTERS, type: "Other" }).map((p) => p.id)).toEqual(["3"]);
  });
  it("explicit name sort ignores star grouping", () => {
    expect(filterProviders(providers, new Set(["3"]), { ...DEFAULT_PROVIDER_FILTERS, sort: "name-asc" }).map((p) => p.id)).toEqual(["2", "1", "3"]);
  });
  it("combines starred only with search", () => {
    expect(filterProviders(providers, new Set(["1", "3"]), { ...DEFAULT_PROVIDER_FILTERS, starredOnly: true, q: "carl" }).map((p) => p.id)).toEqual(["3"]);
  });
});

const history: HistoryItem[] = [
  { kind: "visit", id: "a", date: "2026-05-01", type: "Gardener", title: "Mowing", subtitle: "Alice", amount: 50, settled: true, receipt_url: null, created_at: "1" },
  { kind: "visit", id: "b", date: "2026-06-01", type: "Plumber", title: "Filter change", subtitle: "Bob", amount: 200, settled: false, receipt_url: null, created_at: "2" },
  { kind: "visit", id: "c", date: "2025-06-15", type: "Plumber", title: "Inspection", subtitle: "Bob", amount: null, settled: false, receipt_url: null, created_at: "3" },
  { kind: "grocery", id: "g1", date: "2026-06-20", type: "Grocery", title: "Costco", subtitle: "Grocery", amount: 120, settled: false, receipt_url: null, created_at: "4" },
  { kind: "grocery", id: "g2", date: "2026-05-10", type: "Grocery", title: "Safeway", subtitle: "Grocery", amount: 30, settled: true, receipt_url: "r", created_at: "5" },
];

describe("history (maintenance + groceries)", () => {
  it("defaults to newest first across both kinds", () => {
    expect(DEFAULT_HISTORY_FILTERS).toEqual({ status: "", type: "", month: "", year: "" });
    expect(filterHistory(history, DEFAULT_HISTORY_FILTERS).map((h) => h.id)).toEqual(["g1", "b", "g2", "a", "c"]);
  });
  it("Grocery appears in type options when grocery records exist", () => {
    expect(historyFilterOptions(history).types).toEqual(["Gardener", "Grocery", "Plumber"]);
    expect(historyFilterOptions(history).years).toEqual(["2026", "2025"]);
  });
  it("no Grocery type when there are no grocery records", () => {
    expect(historyFilterOptions(history.filter((h) => h.kind === "visit")).types).toEqual(["Gardener", "Plumber"]);
  });
  it("selecting Grocery shows only grocery purchases", () => {
    expect(filterHistory(history, { ...DEFAULT_HISTORY_FILTERS, type: "Grocery" }).map((h) => h.id)).toEqual(["g1", "g2"]);
  });
  it("maintenance types still filter correctly", () => {
    expect(filterHistory(history, { ...DEFAULT_HISTORY_FILTERS, type: "Gardener" }).map((h) => h.id)).toEqual(["a"]);
  });
  it("Outstanding includes unpaid visits and unreimbursed groceries", () => {
    expect(filterHistory(history, { ...DEFAULT_HISTORY_FILTERS, status: "outstanding" }).map((h) => h.id)).toEqual(["g1", "b", "c"]);
  });
  it("Settled includes paid visits and reimbursed groceries", () => {
    expect(filterHistory(history, { ...DEFAULT_HISTORY_FILTERS, status: "settled" }).map((h) => h.id)).toEqual(["g2", "a"]);
  });
  it("month and year filter on the record date for both kinds", () => {
    expect(filterHistory(history, { ...DEFAULT_HISTORY_FILTERS, month: "06", year: "2026" }).map((h) => h.id)).toEqual(["g1", "b"]);
    expect(filterHistory(history, { ...DEFAULT_HISTORY_FILTERS, month: "06" }).map((h) => h.id)).toEqual(["g1", "b", "c"]);
    expect(filterHistory(history, { ...DEFAULT_HISTORY_FILTERS, year: "2026" }).map((h) => h.id)).toEqual(["g1", "b", "g2", "a"]);
  });
  it("all four filters work together", () => {
    const f = { status: "outstanding" as const, type: "Plumber", month: "06", year: "2025" };
    expect(filterHistory(history, f).map((h) => h.id)).toEqual(["c"]);
  });
  it("no matches produces an empty list", () => {
    expect(filterHistory(history, { ...DEFAULT_HISTORY_FILTERS, month: "01" })).toEqual([]);
  });
});

const groceries = [
  { id: "x", purchase_date: "2026-07-01", store: "Costco", amount: 120, category: "Produce", reimbursed: false, created_at: "1" },
  { id: "y", purchase_date: "2026-07-10", store: "Safeway", amount: 30, category: "Pet food", reimbursed: true, created_at: "2" },
  { id: "z", purchase_date: "2026-06-01", store: "costco", amount: 60, category: null, reimbursed: false, created_at: "3" },
];

describe("groceries", () => {
  it("search store + not reimbursed + oldest first", () => {
    const f = { ...DEFAULT_GROCERY_FILTERS, q: "COSTCO", reimbursed: "no" as const, sort: "date-asc" as const };
    expect(filterGroceries(groceries, f).map((g) => g.id)).toEqual(["z", "x"]);
  });
  it("historical category values still load and are ignored by filters", () => {
    expect(filterGroceries(groceries, DEFAULT_GROCERY_FILTERS).map((g) => g.id)).toEqual(["y", "x", "z"]);
  });
  it("date range is inclusive", () => {
    expect(filterGroceries(groceries, { ...DEFAULT_GROCERY_FILTERS, from: "2026-07-01", to: "2026-07-01" }).map((g) => g.id)).toEqual(["x"]);
  });
});
