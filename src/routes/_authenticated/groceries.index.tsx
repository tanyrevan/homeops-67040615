import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Field, FilterBar, NoMatches, ctrl } from "@/components/FilterControls";
import { GROCERY_CATEGORIES } from "@/lib/grocery-validation";
import { DEFAULT_GROCERY_FILTERS, filterGroceries, isDefault, type GroceryFilters } from "@/lib/list-filters";
import { AppShell } from "@/components/AppShell";
import { groceriesQuery } from "@/lib/groceries-api";
import { StatusBadge } from "@/components/StatusBadge";
import { day, money } from "@/lib/visits-api";

export const Route = createFileRoute("/_authenticated/groceries/")({
  validateSearch: (s: Record<string, unknown>): { deleted?: boolean } =>
    s["deleted"] === true || s["deleted"] === "1" ? { deleted: true } : {},
  head: () => ({
    meta: [
      { title: "Groceries — HomeOps" },
      { name: "description", content: "Your grocery purchases and receipts." },
      { property: "og:title", content: "Groceries — HomeOps" },
      { property: "og:description", content: "Your grocery purchases and receipts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GroceriesPage,
});

function GroceriesPage() {
  const { deleted } = Route.useSearch();
  const { data, isLoading, error } = useQuery(groceriesQuery());
  const [f, setF] = useState<GroceryFilters>(DEFAULT_GROCERY_FILTERS);
  const set = <K extends keyof GroceryFilters>(k: K, v: GroceryFilters[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const reset = () => setF(DEFAULT_GROCERY_FILTERS);
  const list = data ? filterGroceries(data, f) : [];
  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Groceries</h1>
        <Link to="/groceries/new" className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
          Add Grocery Purchase
        </Link>
      </div>
      {deleted && <p className="mb-4 rounded-md bg-accent p-3 text-sm text-foreground">Grocery purchase deleted.</p>}
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">We couldn't load your purchases. Please refresh.</p>}
      {data && data.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="text-foreground">No grocery purchases yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Log your next shopping trip to see where the money goes.</p>
          <Link to="/groceries/new" className="mt-5 inline-block rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
            Add your first purchase
          </Link>
        </div>
      )}
      {data && data.length > 0 && (
        <>
        <FilterBar onReset={reset} showReset={!isDefault(f, DEFAULT_GROCERY_FILTERS)}>
          <Field label="Search by store" htmlFor="q" wide>
            <input id="q" type="search" className={ctrl} value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Store name" />
          </Field>
          <Field label="Category" htmlFor="category">
            <select id="category" className={ctrl} value={f.category} onChange={(e) => set("category", e.target.value)}>
              <option value="">All categories</option>
              {GROCERY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Reimbursement" htmlFor="reimbursed">
            <select id="reimbursed" className={ctrl} value={f.reimbursed} onChange={(e) => set("reimbursed", e.target.value as GroceryFilters["reimbursed"])}>
              <option value="">All</option>
              <option value="yes">Reimbursed</option>
              <option value="no">Not Reimbursed</option>
            </select>
          </Field>
          <Field label="Start date" htmlFor="from">
            <input id="from" type="date" className={ctrl} value={f.from} onChange={(e) => set("from", e.target.value)} />
          </Field>
          <Field label="End date" htmlFor="to">
            <input id="to" type="date" className={ctrl} value={f.to} onChange={(e) => set("to", e.target.value)} />
          </Field>
          <Field label="Sort" htmlFor="sort" wide>
            <select id="sort" className={ctrl} value={f.sort} onChange={(e) => set("sort", e.target.value as GroceryFilters["sort"])}>
              <option value="date-desc">Purchase date (newest first)</option>
              <option value="date-asc">Purchase date (oldest first)</option>
              <option value="amount-desc">Amount (highest first)</option>
              <option value="amount-asc">Amount (lowest first)</option>
            </select>
          </Field>
        </FilterBar>
        {list.length === 0 && <NoMatches onReset={reset} />}
        <ul className="space-y-3">
          {list.map((g) => (
            <li key={g.id}>
              <Link to="/groceries/$groceryId" params={{ groceryId: g.id }} className="block rounded-lg border border-border bg-card p-4 hover:bg-accent">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">{day(g.purchase_date)}</div>
                    <div className="font-medium text-foreground">{g.store}</div>
                  </div>
                  <div className="font-semibold text-foreground">{money(g.amount)}</div>
                </div>
                {(
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <StatusBadge ok={g.reimbursed} yes="Reimbursed" no="Not Reimbursed" />
                    {g.category && <span>{g.category}</span>}
                    {g.receipt_url && <span className="font-medium text-primary">📎 Receipt</span>}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
        </>
      )}
    </AppShell>
  );
}
