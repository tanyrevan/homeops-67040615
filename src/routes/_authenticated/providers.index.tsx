import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { providersQuery } from "@/lib/providers-api";

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
  const { data, isLoading, error } = useQuery(providersQuery());

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
        <ul className="space-y-3">
          {data.map((p) => (
            <li key={p.id}>
              <Link to="/providers/$id" params={{ id: p.id }} className="block rounded-lg border border-border bg-card p-4 hover:bg-accent">
                <div className="font-medium text-foreground">{p.name}</div>
                <div className="text-sm text-muted-foreground">{p.service_type}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
