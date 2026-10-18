import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { day, money } from "@/lib/visits-api";

const unpaidVisitsQuery = queryOptions({
  queryKey: ["visits", "unpaid"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("maintenance_visits")
      .select("id, visit_date, service_performed, amount_paid, service_providers(name)")
      .eq("paid", false)
      .order("visit_date", { ascending: false });
    if (error) throw error;
    return data;
  },
});

const unreimbursedQuery = queryOptions({
  queryKey: ["groceries", "unreimbursed"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("grocery_expenses")
      .select("id, purchase_date, store, amount")
      .eq("reimbursed", false)
      .order("purchase_date", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/_authenticated/attention")({
  head: () => ({
    meta: [
      { title: "Amount Due — HomeOps" },
      { name: "description", content: "Unpaid maintenance and grocery purchases not yet reimbursed." },
      { property: "og:title", content: "Amount Due — HomeOps" },
      { property: "og:description", content: "Unpaid maintenance and grocery purchases not yet reimbursed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Attention,
});

function Attention() {
  const visits = useQuery(unpaidVisitsQuery);
  const groceries = useQuery(unreimbursedQuery);
  const loading = visits.isLoading || groceries.isLoading;
  const empty = visits.data?.length === 0 && groceries.data?.length === 0;
  const card = "block rounded-lg border border-border bg-card p-4 hover:bg-accent";

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Amount Due</h1>
      {loading && <p className="text-muted-foreground">Loading…</p>}
      {(visits.error || groceries.error) && <p className="text-destructive">We couldn't load everything. Please refresh.</p>}
      {empty && (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="text-lg font-medium text-foreground">You're all caught up.</p>
          <p className="mt-1 text-sm text-muted-foreground">No unpaid visits or groceries waiting to be reimbursed.</p>
        </div>
      )}
      {!loading && !empty && (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Unpaid Maintenance ({visits.data?.length ?? 0})</h2>
            {visits.data?.length === 0 && <p className="text-sm text-muted-foreground">All maintenance visits are paid.</p>}
            <ul className="space-y-3">
              {visits.data?.map((v) => (
                <li key={v.id}>
                  <Link to="/visits/$visitId" params={{ visitId: v.id }} className={card}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground">{v.service_providers?.name} · {day(v.visit_date)}</div>
                        <div className="font-medium text-foreground">{v.service_performed}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">{money(v.amount_paid) ?? "—"}</div>
                        <div className="mt-1"><StatusBadge ok={false} yes="Paid" no="Unpaid" /></div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Not Reimbursed Groceries ({groceries.data?.length ?? 0})</h2>
            {groceries.data?.length === 0 && <p className="text-sm text-muted-foreground">All grocery purchases are reimbursed.</p>}
            <ul className="space-y-3">
              {groceries.data?.map((g) => (
                <li key={g.id}>
                  <Link to="/groceries/$groceryId" params={{ groceryId: g.id }} className={card}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground">{day(g.purchase_date)}</div>
                        <div className="font-medium text-foreground">{g.store}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">{money(g.amount)}</div>
                        <div className="mt-1"><StatusBadge ok={false} yes="Reimbursed" no="Not Reimbursed" /></div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </AppShell>
  );
}
