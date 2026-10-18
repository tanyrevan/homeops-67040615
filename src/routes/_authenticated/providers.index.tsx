import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Field, FilterBar, NoMatches, ctrl } from "@/components/FilterControls";
import { StarButton } from "@/components/StarButton";
import { DEFAULT_PROVIDER_FILTERS, filterProviders, isDefault, type ProviderFilters } from "@/lib/list-filters";
import { SERVICE_TYPES } from "@/lib/provider-validation";
import { providersQuery } from "@/lib/providers-api";
import { groceriesQuery } from "@/lib/groceries-api";
import { starsQuery } from "@/lib/stars";
import { money } from "@/lib/visits-api";

export const Route = createFileRoute("/_authenticated/providers/")({
  validateSearch: (s: Record<string, unknown>): { deleted?: boolean } =>
    s["deleted"] === true || s["deleted"] === "1" || s["deleted"] === 1 ? { deleted: true } : {},
  head: () => ({
    meta: [
      { title: "Expenses — HomeOps" },
      { name: "description", content: "Your household expenses and service providers." },
      { property: "og:title", content: "Expenses — HomeOps" },
      { property: "og:description", content: "Your household expenses and service providers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const { deleted } = Route.useSearch();
  const { user } = Route.useRouteContext();
  const { data, isLoading, error } = useQuery(providersQuery());
  const groceries = useQuery(groceriesQuery());
  const stars = useQuery(starsQuery());
  const [f, setF] = useState<ProviderFilters>(DEFAULT_PROVIDER_FILTERS);
  const set = <K extends keyof ProviderFilters>(k: K, v: ProviderFilters[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const reset = () => setF(DEFAULT_PROVIDER_FILTERS);
  const list = data && stars.data ? filterProviders(data, stars.data, f) : [];
  const showGroceries = f.type === "Grocery";
  const groceryList = (groceries.data ?? []).filter((g) => !f.q || g.store.toLowerCase().includes(f.q.toLowerCase().trim()));

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">Expenses</h1>
          <button
            type="button"
            aria-pressed={f.starredOnly}
            onClick={() => set("starredOnly", !f.starredOnly)}
            className={`rounded-full border px-3 py-1 text-sm font-medium ${f.starredOnly ? "border-primary bg-accent text-foreground" : "border-border text-muted-foreground hover:bg-accent"}`}
          >
            Starred
          </button>
        </div>
        <Link to="/providers/new" className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
          Add Expense
        </Link>
      </div>
      {deleted && <p className="mb-4 rounded-md bg-accent p-3 text-sm text-foreground">Expense deleted.</p>}
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">We couldn't load your expenses. Please refresh.</p>}
      {data && data.length === 0 && !showGroceries && (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="text-foreground">You haven't added any expenses yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your gardener, A/C technician, grocery store, or anyone who helps around the house.</p>
          <Link to="/providers/new" className="mt-5 inline-block rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
            Add your first expense
          </Link>
        </div>
      )}
      {data && (data.length > 0 || showGroceries) && (
        <>
          <FilterBar onReset={reset} showReset={!isDefault(f, DEFAULT_PROVIDER_FILTERS)}>
            <Field label="Name" htmlFor="q" wide>
              <input id="q" type="search" className={ctrl} value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Name" />
            </Field>
            <Field label="Expense Type" htmlFor="type">
              <select id="type" className={ctrl} value={f.type} onChange={(e) => set("type", e.target.value)}>
                <option value="">All types</option>
                <option value="Grocery">Grocery</option>
                {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Sort" htmlFor="sort">
              <select id="sort" className={ctrl} value={f.sort} onChange={(e) => set("sort", e.target.value as ProviderFilters["sort"])}>
                <option value="newest">Date added (newest first)</option>
                <option value="oldest">Date added (oldest first)</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
              </select>
            </Field>
          </FilterBar>
          {showGroceries ? (
            <>
              {groceries.isLoading && <p className="text-muted-foreground">Loading…</p>}
              {groceries.data && groceryList.length === 0 && <NoMatches onReset={reset} />}
              <ul className="space-y-3">
                {groceryList.map((g) => (
                  <li key={g.id}>
                    <Link to="/groceries/$groceryId" params={{ groceryId: g.id }} className="block rounded-lg border border-border bg-card p-4 hover:bg-accent">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-foreground">{g.store}</div>
                          <div className="text-sm text-muted-foreground">Grocery · {g.purchase_date}</div>
                        </div>
                        <div className="font-semibold text-foreground">{money(g.amount)}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              {stars.data && list.length === 0 && <NoMatches onReset={reset} />}
              <ul className="space-y-3">
                {list.map((p) => (
                  <li key={p.id}>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-card pr-2 hover:bg-accent">
                      <Link to="/providers/$id" params={{ id: p.id }} className="block flex-1 p-4">
                        <div className="font-medium text-foreground">{p.name}</div>
                        <div className="text-sm text-muted-foreground">{p.service_type}</div>
                      </Link>
                      <StarButton userId={user.id} providerId={p.id} name={p.name} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </AppShell>
  );
}
