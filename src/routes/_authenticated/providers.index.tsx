import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { StarButton } from "@/components/StarButton";
import { providersQuery } from "@/lib/providers-api";
import { orderByStar, starsQuery } from "@/lib/stars";

export const Route = createFileRoute("/_authenticated/providers/")({
  validateSearch: (s: Record<string, unknown>): { deleted?: boolean } =>
    s["deleted"] === true || s["deleted"] === "1" || s["deleted"] === 1 ? { deleted: true } : {},
  head: () => ({
    meta: [
      { title: "Providers — HomeOps" },
      { name: "description", content: "Your household service providers." },
      { property: "og:title", content: "Providers — HomeOps" },
      { property: "og:description", content: "Your household service providers." },
    ],
  }),
  component: ProvidersPage,
});

function ProvidersPage() {
  const { deleted } = Route.useSearch();
  const { user } = Route.useRouteContext();
  const { data, isLoading, error } = useQuery(providersQuery());
  const stars = useQuery(starsQuery());
  const [starredOnly, setStarredOnly] = useState(false);
  const list = data && stars.data ? orderByStar(data, stars.data, starredOnly) : [];

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Providers</h1>
        <Link to="/providers/new" className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
          Add Provider
        </Link>
      </div>
      {deleted && <p className="mb-4 rounded-md bg-accent p-3 text-sm text-foreground">Provider deleted.</p>}
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">We couldn't load your providers. Please refresh.</p>}
      {data && data.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="text-foreground">You haven't added any providers yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your gardener, A/C technician, or anyone who helps around the house.</p>
          <Link to="/providers/new" className="mt-5 inline-block rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
            Add your first provider
          </Link>
        </div>
      )}
      {data && data.length > 0 && (
        <label className="mb-4 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
          <input type="checkbox" checked={starredOnly} onChange={(e) => setStarredOnly(e.target.checked)} className="h-5 w-5 accent-primary" />
          Starred only
        </label>
      )}
      {data && data.length > 0 && starredOnly && stars.data && list.length === 0 && (
        <p className="text-muted-foreground">No starred providers yet. Tap ☆ next to a provider to pin it here.</p>
      )}
      {data && data.length > 0 && (
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
      )}
    </AppShell>
  );
}
