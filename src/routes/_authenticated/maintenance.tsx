import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Field, FilterBar, NoMatches, ctrl } from "@/components/FilterControls";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_HISTORY_FILTERS, filterHistory, historyFilterOptions, isDefault,
  type HistoryFilters, type HistoryItem,
} from "@/lib/list-filters";
import { day, money } from "@/lib/visits-api";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const visitsQuery = queryOptions({
  queryKey: ["visits", "all"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("maintenance_visits")
      .select("id, visit_date, service_performed, amount_paid, paid, created_at, receipt_url, service_providers(name, service_type)")
      .order("visit_date", { ascending: false });
    if (error) throw error;
    return data;
  },
});

const groceryHistoryQuery = queryOptions({
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

export const Route = createFileRoute("/_authenticated/maintenance")({
  head: () => ({
    meta: [
      { title: "History — HomeOps" },
      { name: "description", content: "Completed maintenance visits and grocery purchases." },
      { property: "og:title", content: "History — HomeOps" },
      { property: "og:description", content: "Completed maintenance visits and grocery purchases." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const visits = useQuery(visitsQuery);
  const groceries = useQuery(groceryHistoryQuery);
  const [f, setF] = useState<HistoryFilters>(DEFAULT_HISTORY_FILTERS);
  const set = <K extends keyof HistoryFilters>(k: K, v: HistoryFilters[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const reset = () => setF(DEFAULT_HISTORY_FILTERS);

  const isLoading = visits.isLoading || groceries.isLoading;
  const error = visits.error || groceries.error;
  const items: HistoryItem[] = [
    ...(visits.data ?? []).map((v): HistoryItem => ({
      kind: "visit", id: v.id, date: v.visit_date,
      type: v.service_providers?.service_type ?? "Other",
      title: v.service_performed, subtitle: v.service_providers?.name ?? "Provider",
      amount: v.amount_paid, settled: v.paid, receipt_url: v.receipt_url, created_at: v.created_at,
    })),
    ...(groceries.data ?? []).map((g): HistoryItem => ({
      kind: "grocery", id: g.id, date: g.purchase_date,
      type: "Grocery", title: g.store, subtitle: "Grocery",
      amount: g.amount, settled: g.reimbursed, receipt_url: g.receipt_url, created_at: g.created_at,
    })),
  ];
  const list = filterHistory(items, f);
  const { types, years } = historyFilterOptions(items);

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">History</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">We couldn't load your history. Please refresh.</p>}
      {!isLoading && !error && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="text-foreground">No completed activity yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Completed visits and grocery purchases will appear here automatically.</p>
        </div>
      )}
      {items.length > 0 && (
        <>
          <FilterBar onReset={reset} showReset={!isDefault(f, DEFAULT_HISTORY_FILTERS)}>
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
          </FilterBar>
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
                      <div className="text-sm text-muted-foreground">{h.subtitle} · {day(h.date)}</div>
                      <div className="font-medium text-foreground">{h.title}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">{money(h.amount) ?? "—"}</div>
                      <div className="mt-1">
                        {h.kind === "visit"
                          ? <StatusBadge ok={h.settled} yes="Paid" no="Unpaid" />
                          : <StatusBadge ok={h.settled} yes="Paid" no="Unpaid" />}
                      </div>
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
