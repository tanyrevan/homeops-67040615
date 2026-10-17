import { describe, expect, it } from "vitest";
import {
  DEFAULT_GROCERY_FILTERS, DEFAULT_PROVIDER_FILTERS, DEFAULT_VISIT_FILTERS,
  filterGroceries, filterProviders, filterVisits,
} from "@/lib/list-filters";

const providers = [
  { id: "1", name: "Bob's Pools", service_type: "Jacuzzi", created_at: "2026-01-01" },
  { id: "2", name: "alice garden", service_type: "Gardener", created_at: "2026-02-01" },
  { id: "3", name: "Carl Plumbing", service_type: "Plumber", created_at: "2026-03-01" },
];

describe("providers", () => {
  it("default keeps starred first, then newest", () => {
    expect(filterProviders(providers, new Set(["1"]), DEFAULT_PROVIDER_FILTERS).map((p) => p.id)).toEqual(["1", "3", "2"]);
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

const visits = [
  { id: "a", visit_date: "2026-05-01", service_performed: "Mowing", amount_paid: 50, paid: true, created_at: "1", service_providers: { name: "Alice" } },
  { id: "b", visit_date: "2026-06-01", service_performed: "Filter change", amount_paid: 200, paid: false, created_at: "2", service_providers: { name: "Bob" } },
  { id: "c", visit_date: "2026-04-01", service_performed: "Inspection", amount_paid: null, paid: false, created_at: "3", service_providers: { name: "Bob" } },
];

describe("visits", () => {
  it("newest first by default", () => {
    expect(filterVisits(visits, DEFAULT_VISIT_FILTERS).map((v) => v.id)).toEqual(["b", "a", "c"]);
  });
  it("searches provider and service", () => {
    expect(filterVisits(visits, { ...DEFAULT_VISIT_FILTERS, q: "bob" }).map((v) => v.id)).toEqual(["b", "c"]);
    expect(filterVisits(visits, { ...DEFAULT_VISIT_FILTERS, q: "mow" }).map((v) => v.id)).toEqual(["a"]);
  });
  it("filters unpaid within date range, sorted by amount", () => {
    const f = { ...DEFAULT_VISIT_FILTERS, paid: "unpaid" as const, from: "2026-04-01", to: "2026-06-30", sort: "amount-asc" as const };
    expect(filterVisits(visits, f).map((v) => v.id)).toEqual(["b", "c"]);
  });
  it("amount high to low", () => {
    expect(filterVisits(visits, { ...DEFAULT_VISIT_FILTERS, sort: "amount-desc" }).map((v) => v.id)).toEqual(["b", "a", "c"]);
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
  it("Other category matches custom categories", () => {
    expect(filterGroceries(groceries, { ...DEFAULT_GROCERY_FILTERS, category: "Other" }).map((g) => g.id)).toEqual(["y"]);
  });
  it("date range is inclusive", () => {
    expect(filterGroceries(groceries, { ...DEFAULT_GROCERY_FILTERS, from: "2026-07-01", to: "2026-07-01" }).map((g) => g.id)).toEqual(["x"]);
  });
});
