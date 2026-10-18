import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StarButton } from "@/components/StarButton";
import { DEFAULT_PROVIDER_FILTERS, filterProviders } from "@/lib/list-filters";
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
  const [starredOnly, setStarredOnly] = useState(false);

  const filters = { ...DEFAULT_PROVIDER_FILTERS, starredOnly };
  const providers = data && stars.data ? filterProviders(data, stars.data, filters) : [];
  const groceryList = [...(groceries.data ?? [])].sort(
    (a, b) => b.purchase_date.localeCompare(a.purchase_date) || b.created_at.localeCompare(a.created_at),
  );
  const hasAny = providers.length > 0 || (!starredOnly && groceryList.length > 0);

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">Expenses</h1>
          <button
            type="button"
            aria-pressed={starredOnly}
            onClick={() => setStarredOnly(!starredOnly)}
            className={`rounded-full border px-3 py-1 text-sm font-medium ${starredOnly ? "border-primary bg-accent text-foreground" : "border-border text-muted-foreground hover:bg-accent"}`}
          >
            Starred
          </button>
        </div>
        <Link to="/providers/new" className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
          Add Expense
        </Link>
      </div>
      {deleted && <p className="mb-4 rounded-md bg-accent p-3 text-sm text-foreground">Expense deleted.</p>}
      {(isLoading || groceries.isLoading) && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">We couldn't load your expenses. Please refresh.</p>}
      {data && groceries.data && !hasAny && (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          {starredOnly ? (
            <p className="text-foreground">No starred expenses yet. Tap the star on any service expense to pin it here.</p>
          ) : (
            <>
              <p className="text-foreground">You haven't added any expenses yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">Add your gardener, A/C technician, grocery store, or anyone who helps around the house.</p>
              <Link to="/providers/new" className="mt-5 inline-block rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
                Add your first expense
              </Link>
            </>
          )}
        </div>
      )}
      {hasAny && (
        <ul className="space-y-3">
          {!starredOnly &&
            groceryList.map((g) => (
              <li key={`g-${g.id}`}>
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
          {providers.map((p) => (
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
      )}
    </AppShell>
  );
}
