import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Field, FilterPopover, NoMatches, ctrl } from "@/components/FilterControls";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_HISTORY_FILTERS, filterHistory, historyFilterOptions,
  type HistoryFilters, type HistoryItem,
} from "@/lib/list-filters";
import { localISO } from "@/lib/due-status";
import { providersQuery } from "@/lib/providers-api";
import { starsQuery } from "@/lib/stars";
import { day, money } from "@/lib/visits-api";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const expenseVisitsQuery = queryOptions({
  queryKey: ["visits", "all"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("maintenance_visits")
      .select("id, visit_date, service_performed, amount_paid, paid, created_at, receipt_url, service_provider_id, service_providers(name, service_type)")
      .order("visit_date", { ascending: false });
    if (error) throw error;
    return data;
  },
});

const expenseGroceriesQuery = queryOptions({
  queryKey: ["groceries", "history"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("grocery_expenses")
      .select("id, purchase_date, store, amount, reimbursed, created_at, receipt_url")
      .order("purchase_date", { ascending: false });
    if (error) throw error;
    return data;
  },
});

/** Maps the two expense tables into one ledger shape (display only; tables stay separate). */
export function toLedgerItems(
  visits: { id: string; visit_date: string; service_performed: string; amount_paid: number | null; paid: boolean; created_at: string; receipt_url: string | null; service_provider_id: string; service_providers: { name: string; service_type: string } | null }[],
  groceries: { id: string; purchase_date: string; store: string; amount: number; reimbursed: boolean; created_at: string; receipt_url: string | null }[],
): HistoryItem[] {
  return [
    ...visits.map((v): HistoryItem => ({
      kind: "visit", id: v.id, date: v.visit_date,
      type: v.service_providers?.service_type ?? "Other",
      title: v.service_performed, subtitle: v.service_providers?.name ?? "Provider",
      providerId: v.service_provider_id,
      amount: v.amount_paid, settled: v.paid, receipt_url: v.receipt_url, created_at: v.created_at,
    })),
    ...groceries.map((g): HistoryItem => ({
      kind: "grocery", id: g.id, date: g.purchase_date,
      type: "Grocery", title: g.store, subtitle: "Grocery",
      providerId: null,
      amount: g.amount, settled: g.reimbursed, receipt_url: g.receipt_url, created_at: g.created_at,
    })),
  ];
}

const activeCount = (f: HistoryFilters) => [f.status, f.type, f.month, f.year].filter(Boolean).length;

export const Route = createFileRoute("/_authenticated/providers/")({
  validateSearch: (s: Record<string, unknown>): { deleted?: boolean } =>
    s["deleted"] === true || s["deleted"] === "1" || s["deleted"] === 1 ? { deleted: true } : {},
  head: () => ({
    meta: [
      { title: "Expenses — HomeOps" },
      { name: "description", content: "Every household expense: groceries and service visits." },
      { property: "og:title", content: "Expenses — HomeOps" },
      { property: "og:description", content: "Every household expense: groceries and service visits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const { deleted } = Route.useSearch();
  const visits = useQuery(expenseVisitsQuery);
  const groceries = useQuery(expenseGroceriesQuery);
  const providers = useQuery(providersQuery());
  const stars = useQuery(starsQuery());
  const [showStarred, setShowStarred] = useState(false);
  const [providerFilter, setProviderFilter] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [f, setF] = useState<HistoryFilters>(DEFAULT_HISTORY_FILTERS);
  const set = <K extends keyof HistoryFilters>(k: K, v: HistoryFilters[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const reset = () => setF(DEFAULT_HISTORY_FILTERS);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const isLoading = visits.isLoading || groceries.isLoading;
  const error = visits.error || groceries.error;
  const items = toLedgerItems(visits.data ?? [], groceries.data ?? []);
  const scoped = providerFilter ? items.filter((h) => h.providerId === providerFilter) : items;
  const list = filterHistory(scoped, f);
  const { types, years } = historyFilterOptions(items);
  const starredProviders = (providers.data ?? []).filter((p) => stars.data?.has(p.id));
  const today = localISO(new Date());
  const starredName = providerFilter ? providers.data?.find((p) => p.id === providerFilter)?.name : null;

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Expenses</h1>
        <div className="flex items-center gap-2">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Expense view options"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-full border border-border p-2 text-muted-foreground hover:bg-accent"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-52 rounded-md border border-border bg-card py-1 shadow-md">
                <button
                  type="button"
                  aria-pressed={showStarred}
                  onClick={() => { setShowStarred(!showStarred); setMenuOpen(false); }}
                  className="block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent"
                >
                  {showStarred ? "✓ " : ""}Starred service providers
                </button>
              </div>
            )}
          </div>
          <Link to="/providers/new" className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
            Add Expense
          </Link>
        </div>
      </div>
      {deleted && <p className="mb-4 rounded-md bg-accent p-3 text-sm text-foreground">Expense type deleted.</p>}
      {showStarred && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Starred service providers</h2>
          {starredProviders.length === 0 && <p className="mt-1 text-sm text-muted-foreground">No starred providers yet.</p>}
          <ul className="mt-2 space-y-1">
            {starredProviders.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => { setProviderFilter(providerFilter === p.id ? null : p.id); setShowStarred(false); }}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  ★ {p.name} <span className="text-muted-foreground">· {p.service_type}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {providerFilter && (
        <p className="mb-4 rounded-md bg-accent p-3 text-sm text-foreground">
          Showing expenses for {starredName ?? "this provider"}.{" "}
          <button type="button" onClick={() => setProviderFilter(null)} className="font-medium text-primary underline">Show all</button>
        </p>
      )}
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">We couldn't load your expenses. Please refresh.</p>}
      {!isLoading && !error && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="text-foreground">No expenses yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your first grocery purchase or service visit to start your ledger.</p>
          <Link to="/providers/new" className="mt-5 inline-block rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
            Add your first expense
          </Link>
        </div>
      )}
      {items.length > 0 && (
        <>
          <div className="mb-5 flex justify-end">
            <FilterPopover onReset={reset} activeCount={activeCount(f)}>
              <Field label="Status" htmlFor="status">
                <select id="status" className={ctrl} value={f.status} onChange={(e) => set("status", e.target.value as HistoryFilters["status"])}>
                  <option value="">All</option>
                  <option value="outstanding">Outstanding</option>
                  <option value="settled">Settled</option>
                </select>
              </Field>
              <Field label="Type" htmlFor="type">
                <select id="type" className={ctrl} value={f.type} onChange={(e) => set("type", e.target.value)}>
                  <option value="">All types</option>
                  {types.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Month" htmlFor="month">
                <select id="month" className={ctrl} value={f.month} onChange={(e) => set("month", e.target.value)}>
                  <option value="">All months</option>
                  {MONTHS.map((name, i) => <option key={name} value={String(i + 1).padStart(2, "0")}>{name}</option>)}
                </select>
              </Field>
              <Field label="Year" htmlFor="year">
                <select id="year" className={ctrl} value={f.year} onChange={(e) => set("year", e.target.value)}>
                  <option value="">All years</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </Field>
            </FilterPopover>
          </div>
          {list.length === 0 && <NoMatches onReset={reset} />}
          <ul className="space-y-3">
            {list.map((h) => (
              <li key={`${h.kind}-${h.id}`}>
                <Link
                  to={h.kind === "visit" ? "/visits/$visitId" : "/groceries/$groceryId"}
                  params={h.kind === "visit" ? { visitId: h.id } : { groceryId: h.id }}
                  className="block rounded-lg border border-border bg-card p-4 hover:bg-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground">{day(h.date)}</div>
                      <div className="font-medium text-foreground">
                        {h.type}
                        {h.date > today && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-muted-foreground">Upcoming</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">{money(h.amount) ?? "—"}</div>
                      <div className="mt-1"><StatusBadge ok={h.settled} yes="Paid" no="Unpaid" /></div>
                    </div>
                  </div>
                  {h.receipt_url && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <span className="font-medium text-primary">📎 Receipt</span>
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
