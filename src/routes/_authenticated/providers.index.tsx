import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Field, FilterPopover, ctrl } from "@/components/FilterControls";
import { ExpenseSection } from "@/components/ExpenseSection";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { settleTable, settleUpdate } from "@/lib/settle";
import {
  DEFAULT_HISTORY_FILTERS, expenseSections, historyFilterOptions,
  type HistoryFilters,
} from "@/lib/list-filters";
import { localISO } from "@/lib/due-status";
import { providersQuery } from "@/lib/providers-api";
import { starsQuery } from "@/lib/stars";
import { expenseGroceriesQuery, expenseVisitsQuery, toLedgerItems } from "@/lib/ledger";
import { expenseTypeLabel } from "@/lib/expense-type";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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
  const qc = useQueryClient();
  const [settleMessage, setSettleMessage] = useState<string | null>(null);
  const [settleError, setSettleError] = useState<string | null>(null);
  const settle = useMutation({
    mutationFn: async ({ kind, id }: { kind: "visit" | "grocery"; id: string }) => {
      const { data, error } = await supabase.from(settleTable(kind)).update(settleUpdate(kind)).eq("id", id).select("id").single();
      if (error || !data) throw error ?? new Error("Expense was not updated.");
    },
    onSuccess: async (_, { kind, id }) => {
      if (kind === "visit") {
        qc.setQueryData(expenseVisitsQuery.queryKey, (rows) => rows?.map((row) => row.id === id ? { ...row, paid: true } : row));
      } else {
        qc.setQueryData(expenseGroceriesQuery.queryKey, (rows) => rows?.map((row) => row.id === id ? { ...row, reimbursed: true } : row));
      }
      setSettleMessage("Marked as paid.");
      await qc.invalidateQueries();
    },
    onError: () => setSettleError("We couldn't mark that item as paid. Please try again."),
  });
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
  const { upcoming, history } = expenseSections(scoped, localISO(new Date()), f);
  const { types, years } = historyFilterOptions(items);
  const starredProviders = (providers.data ?? []).filter((p) => stars.data?.has(p.id));
  const starredName = providerFilter ? providers.data?.find((p) => p.id === providerFilter)?.name : null;

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Expenses</h1>
        <div className="flex items-center gap-2">
          <div className="relative" ref={menuRef}>
            <Button
              type="button"
              aria-label="Expense view options"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-full border border-border p-2 text-muted-foreground hover:bg-accent"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-52 rounded-md border border-border bg-card py-1 shadow-md">
                <Button
                  type="button"
                  aria-pressed={showStarred}
                  onClick={() => { setShowStarred(!showStarred); setMenuOpen(false); }}
                  className="block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent"
                >
                  {showStarred ? "✓ " : ""}Starred service providers
                </Button>
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
                <Button
                  type="button"
                  onClick={() => { setProviderFilter(providerFilter === p.id ? null : p.id); setShowStarred(false); }}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  ★ {p.name} <span className="text-muted-foreground">· {expenseTypeLabel(p.service_type)}</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {providerFilter && (
        <p className="mb-4 rounded-md bg-accent p-3 text-sm text-foreground">
          Showing expenses for {starredName ?? "this provider"}.{" "}
          <Button type="button" onClick={() => setProviderFilter(null)} className="font-medium text-primary underline">Show all</Button>
        </p>
      )}
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">We couldn't load your expenses. Please refresh.</p>}
      {settleMessage && <p role="status" className="mb-4 text-sm text-foreground">{settleMessage}</p>}
      {settleError && <p role="alert" className="mb-4 text-sm text-destructive">{settleError}</p>}
      <div>
          <div className="mb-5 flex justify-end">
            <FilterPopover onReset={reset} activeCount={activeCount(f)}>
              <Field label="Status" htmlFor="status">
                <select id="status" className={ctrl} value={f.status} onChange={(e) => set("status", e.target.value as HistoryFilters["status"])}>
                  <option value="">All</option>
                  <option value="outstanding">Unpaid</option>
                  <option value="settled">Paid</option>
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
          {!isLoading && !error && (
            <div className="space-y-8">
              {[true, false].map((isUpcoming) => (
                <ExpenseSection
                  key={isUpcoming ? "upcoming" : "history"}
                  upcoming={isUpcoming}
                  items={isUpcoming ? upcoming : history}
                  saving={settle.isPending}
                  settlingKey={settle.isPending && settle.variables ? `${settle.variables.kind}-${settle.variables.id}` : null}
                  onMarkPaid={(item) => {
                    if (settle.isPending) return;
                    setSettleMessage(null);
                    setSettleError(null);
                    settle.mutate({ kind: item.kind, id: item.id });
                  }}
                />
              ))}
            </div>
          )}
      </div>
    </AppShell>
  );
}
