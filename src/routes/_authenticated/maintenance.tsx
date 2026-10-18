import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Field, FilterBar, NoMatches, ctrl } from "@/components/FilterControls";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_VISIT_FILTERS, filterVisits, isDefault, type VisitFilters } from "@/lib/list-filters";
import { day, money } from "@/lib/visits-api";

const allVisitsQuery = queryOptions({
  queryKey: ["visits", "all"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("maintenance_visits")
      .select("id, visit_date, service_performed, amount_paid, paid, created_at, receipt_url, service_providers(name)")
      .order("visit_date", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/_authenticated/maintenance")({
  head: () => ({
    meta: [
      { title: "History — HomeOps" },
      { name: "description", content: "Search all maintenance visits across providers." },
      { property: "og:title", content: "History — HomeOps" },
      { property: "og:description", content: "Search all maintenance visits across providers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const { data, isLoading, error } = useQuery(allVisitsQuery);
  const [f, setF] = useState<VisitFilters>(DEFAULT_VISIT_FILTERS);
  const set = <K extends keyof VisitFilters>(k: K, v: VisitFilters[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const reset = () => setF(DEFAULT_VISIT_FILTERS);
  const list = data ? filterVisits(data, f) : [];

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">History</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">We couldn't load visits. Please refresh.</p>}
      {data && data.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="text-foreground">No completed visits yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Completed visits from your expense types will appear here automatically.</p>
        </div>
      )}
      {data && data.length > 0 && (
        <>
          <FilterBar onReset={reset} showReset={!isDefault(f, DEFAULT_VISIT_FILTERS)}>
            <Field label="Search" htmlFor="q" wide>
              <input id="q" type="search" className={ctrl} value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Provider name or service performed" />
            </Field>
            <Field label="Payment status" htmlFor="paid">
              <select id="paid" className={ctrl} value={f.paid} onChange={(e) => set("paid", e.target.value as VisitFilters["paid"])}>
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </Field>
            <Field label="Sort" htmlFor="sort">
              <select id="sort" className={ctrl} value={f.sort} onChange={(e) => set("sort", e.target.value as VisitFilters["sort"])}>
                <option value="date-desc">Visit date (newest first)</option>
                <option value="date-asc">Visit date (oldest first)</option>
                <option value="amount-desc">Amount (highest first)</option>
                <option value="amount-asc">Amount (lowest first)</option>
              </select>
            </Field>
            <Field label="Start date" htmlFor="from">
              <input id="from" type="date" className={ctrl} value={f.from} onChange={(e) => set("from", e.target.value)} />
            </Field>
            <Field label="End date" htmlFor="to">
              <input id="to" type="date" className={ctrl} value={f.to} onChange={(e) => set("to", e.target.value)} />
            </Field>
          </FilterBar>
          {list.length === 0 && <NoMatches onReset={reset} />}
          <ul className="space-y-3">
            {list.map((v) => (
              <li key={v.id}>
                <Link to="/visits/$visitId" params={{ visitId: v.id }} className="block rounded-lg border border-border bg-card p-4 hover:bg-accent">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground">{v.service_providers?.name} · {day(v.visit_date)}</div>
                      <div className="font-medium text-foreground">{v.service_performed}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">{money(v.amount_paid) ?? "—"}</div>
                      <div className="mt-1"><StatusBadge ok={v.paid} yes="Paid" no="Unpaid" /></div>
                    </div>
                  </div>
                  {v.receipt_url && (
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
