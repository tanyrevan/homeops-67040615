import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Field, FilterPopover, NoMatches, ctrl } from "@/components/FilterControls";
import { StatusBadge } from "@/components/StatusBadge";
import {
  DEFAULT_HISTORY_FILTERS, filterHistory, historyFilterOptions, pastItems,
  type HistoryFilters,
} from "@/lib/list-filters";
import { localISO } from "@/lib/due-status";
import { day, money } from "@/lib/visits-api";
import { expenseGroceriesQuery, expenseVisitsQuery, toLedgerItems } from "@/lib/ledger";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const activeCount = (f: HistoryFilters) => [f.status, f.type, f.month, f.year].filter(Boolean).length;

export const Route = createFileRoute("/_authenticated/maintenance")({
  head: () => ({
    meta: [
      { title: "History — HomeOps" },
      { name: "description", content: "Past household expenses: maintenance visits and grocery purchases." },
      { property: "og:title", content: "History — HomeOps" },
      { property: "og:description", content: "Past household expenses: maintenance visits and grocery purchases." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const visits = useQuery(expenseVisitsQuery);
  const groceries = useQuery(expenseGroceriesQuery);
  const [f, setF] = useState<HistoryFilters>(DEFAULT_HISTORY_FILTERS);
  const set = <K extends keyof HistoryFilters>(k: K, v: HistoryFilters[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const reset = () => setF(DEFAULT_HISTORY_FILTERS);

  const isLoading = visits.isLoading || groceries.isLoading;
  const error = visits.error || groceries.error;
  const items = toLedgerItems(visits.data ?? [], groceries.data ?? []);
  // History is the past/today subset of the ledger; Expenses shows everything.
  const past = pastItems(items, localISO(new Date()));
  const list = filterHistory(past, f);
  const { types, years } = historyFilterOptions(past);

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">History</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">We couldn't load your history. Please refresh.</p>}
      {!isLoading && !error && past.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="text-foreground">No past expenses yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Expenses dated today or earlier will appear here automatically.</p>
        </div>
      )}
      {past.length > 0 && (
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
                      <div className="font-medium text-foreground">{h.type}</div>
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
