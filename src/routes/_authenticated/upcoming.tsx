import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { upcomingItems } from "@/lib/list-filters";
import { localISO } from "@/lib/due-status";
import { day } from "@/lib/visits-api";
import { expenseGroceriesQuery, expenseVisitsQuery, toLedgerItems } from "@/lib/ledger";

export const Route = createFileRoute("/_authenticated/upcoming")({
  head: () => ({
    meta: [
      { title: "Upcoming — HomeOps" },
      { name: "description", content: "Future-dated household expenses." },
      { property: "og:title", content: "Upcoming — HomeOps" },
      { property: "og:description", content: "Future-dated household expenses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UpcomingPage,
});

function UpcomingPage() {
  const visits = useQuery(expenseVisitsQuery);
  const groceries = useQuery(expenseGroceriesQuery);
  const isLoading = visits.isLoading || groceries.isLoading;
  const error = visits.error || groceries.error;
  const items = toLedgerItems(visits.data ?? [], groceries.data ?? []);
  // Upcoming = future-dated expense line items, soonest first.
  const list = upcomingItems(items, localISO(new Date()));

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Upcoming</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">We couldn't load upcoming expenses. Please refresh.</p>}
      {!isLoading && !error && list.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="text-lg font-medium text-foreground">No upcoming expenses.</p>
          <p className="mt-1 text-sm text-muted-foreground">Add an expense with a future date and it will show up here.</p>
        </div>
      )}
      {list.length > 0 && (
        <ul className="space-y-3">
          {list.map((h) => (
            <li key={`${h.kind}-${h.id}`}>
              <Link
                to={h.kind === "visit" ? "/visits/$visitId" : "/groceries/$groceryId"}
                params={h.kind === "visit" ? { visitId: h.id } : { groceryId: h.id }}
                className="block rounded-lg border border-border bg-card p-4 hover:bg-accent"
              >
                <div className="text-sm text-muted-foreground">{day(h.date)}</div>
                <div className="font-medium text-foreground">{h.type}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
