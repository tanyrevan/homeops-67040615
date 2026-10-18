import { PRESET_TYPES } from "@/lib/provider-validation";

const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().trim();
const inRange = (d: string, from: string, to: string) => (!from || d >= from) && (!to || d <= to);

// ---------- Providers ----------
export type ProviderSort = "name-asc" | "name-desc" | "newest" | "oldest";
export type ProviderFilters = { q: string; type: string; starredOnly: boolean; sort: ProviderSort };
export const DEFAULT_PROVIDER_FILTERS: ProviderFilters = { q: "", type: "", starredOnly: false, sort: "newest" };

type P = { id: string; name: string; service_type: string; created_at: string };

export function filterProviders<T extends P>(items: T[], starred: Set<string>, f: ProviderFilters): T[] {
  const q = norm(f.q);
  let out = items.filter(
    (p) =>
      (!q || norm(p.name).includes(q)) &&
      (!f.type || (f.type === "Other" ? !PRESET_TYPES.includes(p.service_type) : p.service_type === f.type)) &&
      (!f.starredOnly || starred.has(p.id)),
  );
  const byNew = (a: T, b: T) => b.created_at.localeCompare(a.created_at);
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  switch (f.sort) {
    case "name-asc": return [...out].sort(byName);
    case "name-desc": return [...out].sort((a, b) => byName(b, a));
    case "newest": return [...out].sort(byNew);
    case "oldest": return [...out].sort((a, b) => byNew(b, a));
    default: return [...out].sort(byNew);
  }
}

// ---------- Shared for visits & groceries ----------
export type MoneySort = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

function sortRecords<T>(items: T[], sort: MoneySort, date: (t: T) => string, amount: (t: T) => number | null, created: (t: T) => string): T[] {
  const tie = (a: T, b: T) => date(b).localeCompare(date(a)) || created(b).localeCompare(created(a));
  return [...items].sort((a, b) => {
    switch (sort) {
      case "date-asc": return date(a).localeCompare(date(b)) || created(a).localeCompare(created(b));
      case "amount-desc": return (amount(b) ?? -1) - (amount(a) ?? -1) || tie(a, b);
      case "amount-asc": {
        // Visits with no amount go last.
        const x = amount(a), y = amount(b);
        if (x == null && y != null) return 1;
        if (y == null && x != null) return -1;
        return (x ?? 0) - (y ?? 0) || tie(a, b);
      }
      default: return tie(a, b);
    }
  });
}

// ---------- Visits ----------
export type VisitFilters = { paid: "" | "paid" | "unpaid"; type: string; month: string; year: string };
export const DEFAULT_VISIT_FILTERS: VisitFilters = { paid: "", type: "", month: "", year: "" };
type V = { visit_date: string; service_performed: string; amount_paid: number | null; paid: boolean; created_at: string; service_providers: { name: string; service_type: string } | null };

export function filterVisits<T extends V>(items: T[], f: VisitFilters): T[] {
  const out = items.filter(
    (v) =>
      (!f.paid || (f.paid === "paid" ? v.paid : !v.paid)) &&
      (!f.type || v.service_providers?.service_type === f.type) &&
      (!f.month || v.visit_date.slice(5, 7) === f.month) &&
      (!f.year || v.visit_date.slice(0, 4) === f.year),
  );
  // History is always newest first: visit_date desc, then creation time desc.
  return sortRecords(out, "date-desc", (v) => v.visit_date, (v) => v.amount_paid, (v) => v.created_at);
}

/** Distinct service types and years present in the user's completed visits, for filter dropdowns. */
export function visitFilterOptions<T extends V>(items: T[]): { types: string[]; years: string[] } {
  const types = [...new Set(items.map((v) => v.service_providers?.service_type).filter((t): t is string => !!t))].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const years = [...new Set(items.map((v) => v.visit_date.slice(0, 4)))].sort((a, b) => b.localeCompare(a));
  return { types, years };
}

// ---------- Groceries ----------
export type GroceryFilters = { q: string; reimbursed: "" | "yes" | "no"; from: string; to: string; sort: MoneySort };
export const DEFAULT_GROCERY_FILTERS: GroceryFilters = { q: "", reimbursed: "", from: "", to: "", sort: "date-desc" };
type G = { purchase_date: string; store: string; amount: number; reimbursed: boolean; created_at: string };

export function filterGroceries<T extends G>(items: T[], f: GroceryFilters): T[] {
  const q = norm(f.q);
  const out = items.filter(
    (g) =>
      (!q || norm(g.store).includes(q)) &&
      (!f.reimbursed || (f.reimbursed === "yes" ? g.reimbursed : !g.reimbursed)) &&
      inRange(g.purchase_date, f.from, f.to),
  );
  return sortRecords(out, f.sort, (g) => g.purchase_date, (g) => g.amount, (g) => g.created_at);
}

export const isDefault = <T extends object>(f: T, d: T) => JSON.stringify(f) === JSON.stringify(d);
