import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { groceriesQuery } from "@/lib/groceries-api";
import { StatusBadge } from "@/components/StatusBadge";
import { day, money } from "@/lib/visits-api";

export const Route = createFileRoute("/_authenticated/groceries/")({
  validateSearch: (s: Record<string, unknown>): { deleted?: boolean } =>
    s["deleted"] === true || s["deleted"] === "1" ? { deleted: true } : {},
  head: () => ({
    meta: [
      { title: "Groceries — HomeOps" },
      { name: "description", content: "Your grocery purchases and receipts." },
      { property: "og:title", content: "Groceries — HomeOps" },
      { property: "og:description", content: "Your grocery purchases and receipts." },
    ],
  }),
  component: GroceriesPage,
});

function GroceriesPage() {
  const { deleted } = Route.useSearch();
  const { data, isLoading, error } = useQuery(groceriesQuery());
  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Groceries</h1>
        <Link to="/groceries/new" className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
          Add Grocery Purchase
        </Link>
      </div>
      {deleted && <p className="mb-4 rounded-md bg-accent p-3 text-sm text-foreground">Grocery purchase deleted.</p>}
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">We couldn't load your purchases. Please refresh.</p>}
      {data && data.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="text-foreground">No grocery purchases yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Log your next shopping trip to see where the money goes.</p>
          <Link to="/groceries/new" className="mt-5 inline-block rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
            Add your first purchase
          </Link>
        </div>
      )}
      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((g) => (
            <li key={g.id}>
              <Link to="/groceries/$groceryId" params={{ groceryId: g.id }} className="block rounded-lg border border-border bg-card p-4 hover:bg-accent">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">{day(g.purchase_date)}</div>
                    <div className="font-medium text-foreground">{g.store}</div>
                  </div>
                  <div className="font-semibold text-foreground">{money(g.amount)}</div>
                </div>
                {(
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <StatusBadge ok={g.reimbursed} yes="Reimbursed" no="Not Reimbursed" />
                    {g.category && <span>{g.category}</span>}
                    {g.receipt_url && <span className="font-medium text-primary">📎 Receipt</span>}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
