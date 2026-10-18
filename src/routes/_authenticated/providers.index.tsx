import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StarButton } from "@/components/StarButton";
import { DEFAULT_PROVIDER_FILTERS, filterProviders } from "@/lib/list-filters";
import { providersQuery } from "@/lib/providers-api";
import { starsQuery } from "@/lib/stars";

export const Route = createFileRoute("/_authenticated/providers/")({
  validateSearch: (s: Record<string, unknown>): { deleted?: boolean } =>
    s["deleted"] === true || s["deleted"] === "1" || s["deleted"] === 1 ? { deleted: true } : {},
  head: () => ({
    meta: [
      { title: "Expenses — HomeOps" },
      { name: "description", content: "Your household expense types." },
      { property: "og:title", content: "Expenses — HomeOps" },
      { property: "og:description", content: "Your household expense types." },
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
  const stars = useQuery(starsQuery());
  const [starredOnly, setStarredOnly] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const filters = { ...DEFAULT_PROVIDER_FILTERS, starredOnly };
  const providers = data && stars.data ? filterProviders(data, stars.data, filters) : [];
  const showGrocery = !starredOnly;
  const hasAny = providers.length > 0 || showGrocery;

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
              <div className="absolute right-0 z-10 mt-1 w-44 rounded-md border border-border bg-card py-1 shadow-md">
                <button
                  type="button"
                  aria-pressed={starredOnly}
                  onClick={() => { setStarredOnly(!starredOnly); setMenuOpen(false); }}
                  className="block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent"
                >
                  {starredOnly ? "✓ " : ""}Show starred only
                </button>
              </div>
            )}
          </div>
          <Link to="/providers/new" className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
            Add Expense Type
          </Link>
        </div>
      </div>
      {deleted && <p className="mb-4 rounded-md bg-accent p-3 text-sm text-foreground">Expense type deleted.</p>}
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">We couldn't load your expenses. Please refresh.</p>}
      {data && stars.data && !hasAny && (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="text-foreground">No starred expense types yet. Tap the star on any expense type to pin it here.</p>
        </div>
      )}
      {data && stars.data && providers.length === 0 && !starredOnly && (
        <div className="mb-4 rounded-lg border border-dashed border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Add your gardener, A/C technician, or anyone who helps around the house.</p>
        </div>
      )}
      {hasAny && (
        <ul className="space-y-3">
          {showGrocery && (
            <li>
              <Link to="/groceries" className="block rounded-lg border border-border bg-card p-4 hover:bg-accent">
                <div className="font-medium text-foreground">Grocery</div>
              </Link>
            </li>
          )}
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
