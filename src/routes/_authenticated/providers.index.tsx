import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Field, FilterPopover, ctrl, secondaryFilterControl } from "@/components/FilterControls";
import { ExpenseSection } from "@/components/ExpenseSection";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { settleTable, settleUpdate } from "@/lib/settle";
import {
  DEFAULT_HISTORY_FILTERS, expenseSections, historyFilterOptions,
  type HistoryFilters,
} from "@/lib/list-filters";
import { localISO } from "@/lib/due-status";
import { expenseStarsQuery, filterStarredExpenses, setExpenseStar, updateExpenseStars, type ExpenseRef } from "@/lib/expense-stars";
import { expenseGroceriesQuery, expenseVisitsQuery, toLedgerItems } from "@/lib/ledger";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const activeCount = (f: HistoryFilters) => [f.status, f.type, f.month, f.year].filter(Boolean).length;

export const Route = createFileRoute("/_authenticated/providers/")({
  validateSearch: (s: Record<string, unknown>): { deleted?: boolean } =>
    s["deleted"] === true || s["deleted"] === "1" || s["deleted"] === 1 ? { deleted: true } : {},
  head: () => ({
    meta: [
      { title: "Expenses — 16 Olive Road" },
      { name: "description", content: "Every household expense: groceries and service visits." },
      { property: "og:title", content: "Expenses — 16 Olive Road" },
      { property: "og:description", content: "Every household expense: groceries and service visits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const { user } = Route.useRouteContext();
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
  const starOptions = expenseStarsQuery(user.id);
  const stars = useQuery(starOptions);
  const [showStarred, setShowStarred] = useState(false);
  const [starError, setStarError] = useState<string | null>(null);
  const starMutation = useMutation({
    mutationFn: ({ item, on }: { item: ExpenseRef; on: boolean }) => setExpenseStar(user.id, item, on),
    onMutate: async ({ item, on }) => {
      setStarError(null);
      await qc.cancelQueries({ queryKey: starOptions.queryKey });
      const previous = qc.getQueryData(starOptions.queryKey) ?? new Set<string>();
      qc.setQueryData(starOptions.queryKey, updateExpenseStars(previous, item, on));
      return { previous };
    },
    onError: (_, __, context) => {
      if (context) qc.setQueryData(starOptions.queryKey, context.previous);
      setStarError("We couldn't update that star. Please try again.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: starOptions.queryKey }),
  });
  const [f, setF] = useState<HistoryFilters>(DEFAULT_HISTORY_FILTERS);
  const set = <K extends keyof HistoryFilters>(k: K, v: HistoryFilters[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const reset = () => setF(DEFAULT_HISTORY_FILTERS);

  const isLoading = visits.isLoading || groceries.isLoading || stars.isLoading;
  const error = visits.error || groceries.error || stars.error;
  const items = toLedgerItems(visits.data ?? [], groceries.data ?? []);
  const starSet = stars.data ?? new Set<string>();
  const scoped = filterStarredExpenses(items, starSet, showStarred);
  const { upcoming, history } = expenseSections(scoped, localISO(new Date()), f);
  const { types, years } = historyFilterOptions(items);

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Expenses</h1>
        <div className="flex items-center gap-2">
          <Link to="/providers/new" className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
            Add Expense
          </Link>
        </div>
      </div>
      {deleted && <p className="mb-4 rounded-md bg-accent p-3 text-sm text-foreground">Expense type deleted.</p>}
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">We couldn't load your expenses. Please refresh.</p>}
      {settleMessage && <p role="status" className="mb-4 text-sm text-foreground">{settleMessage}</p>}
      {settleError && <p role="alert" className="mb-4 text-sm text-destructive">{settleError}</p>}
      {starError && <p role="alert" className="mb-4 text-sm text-destructive">{starError}</p>}
      <div>
          <div className="mb-5 flex justify-end gap-2">
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
            <Button type="button" variant="outline" className={`${secondaryFilterControl} ${showStarred ? "ring-1 ring-foreground" : ""}`} aria-pressed={showStarred} onClick={() => setShowStarred(!showStarred)}>
              <span className="text-xl leading-none" aria-hidden="true">{showStarred ? "★" : "☆"}</span> Starred
            </Button>
          </div>
          {!isLoading && !error && (
            <div className="space-y-8">
              {[true, false].map((isUpcoming) => (
                <ExpenseSection
                  key={isUpcoming ? "upcoming" : "history"}
                  upcoming={isUpcoming}
                  items={isUpcoming ? upcoming : history}
                  stars={starSet}
                  starring={starMutation.isPending}
                  onToggleStar={(item) => {
                    if (starMutation.isPending) return;
                    starMutation.mutate({ item, on: !starSet.has(`${item.kind}-${item.id}`) });
                  }}
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
