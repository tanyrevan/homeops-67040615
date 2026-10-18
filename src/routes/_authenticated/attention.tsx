import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { settleTable, settleUpdate } from "@/lib/settle";
import { day, money } from "@/lib/visits-api";

const unpaidVisitsQuery = queryOptions({
  queryKey: ["visits", "unpaid"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("maintenance_visits")
      .select("id, visit_date, service_performed, amount_paid, service_providers(name, service_type)")
      .eq("paid", false)
      .order("visit_date", { ascending: false });
    if (error) throw error;
    return data;
  },
});

const unpaidGroceriesQuery = queryOptions({
  queryKey: ["groceries", "unpaid"],
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
      { name: "description", content: "Outstanding unpaid maintenance visits and grocery purchases." },
      { property: "og:title", content: "Amount Due — HomeOps" },
      { property: "og:description", content: "Outstanding unpaid maintenance visits and grocery purchases." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Attention,
});

type Outstanding =
  | { kind: "visit"; id: string; date: string; type: string; name: string; detail: string; amount: number | null }
  | { kind: "grocery"; id: string; date: string; type: string; name: string; detail: string; amount: number | null };

function Attention() {
  const qc = useQueryClient();
  const visits = useQuery(unpaidVisitsQuery);
  const groceries = useQuery(unpaidGroceriesQuery);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [settleError, setSettleError] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);

  const settle = useMutation({
    mutationFn: async ({ kind, id }: { kind: "visit" | "grocery"; id: string }) => {
      const { error } = await supabase.from(settleTable(kind)).update(settleUpdate(kind)).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      setSettlingId(null);
      setSettled(true);
      await qc.invalidateQueries();
    },
    onError: () => {
      setSettlingId(null);
      setSettleError("We couldn't mark that item as paid. Please try again.");
    },
  });

  const markPaid = (kind: "visit" | "grocery", id: string) => {
    if (settle.isPending) return;
    setSettleError(null);
    setSettled(false);
    setSettlingId(id);
    settle.mutate({ kind, id });
  };

  const loading = visits.isLoading || groceries.isLoading;
  const items: Outstanding[] = [
    ...(visits.data ?? []).map((v): Outstanding => ({
      kind: "visit", id: v.id, date: v.visit_date,
      type: v.service_providers?.service_type ?? "Other",
      name: v.service_providers?.name ?? "Provider", detail: v.service_performed, amount: v.amount_paid,
    })),
    ...(groceries.data ?? []).map((g): Outstanding => ({
      kind: "grocery", id: g.id, date: g.purchase_date,
      type: "Grocery", name: g.store, detail: "Grocery", amount: g.amount,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Amount Due</h1>
      {settled && !settle.isPending && <p className="mb-4 rounded-md bg-accent p-3 text-sm text-foreground">Marked as paid.</p>}
      {settleError && <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{settleError}</p>}
      {loading && <p className="text-muted-foreground">Loading…</p>}
      {(visits.error || groceries.error) && <p className="text-destructive">We couldn't load everything. Please refresh.</p>}
      {!loading && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="text-lg font-medium text-foreground">You're all caught up.</p>
          <p className="mt-1 text-sm text-muted-foreground">No unpaid visits or groceries waiting.</p>
        </div>
      )}
      {items.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Outstanding Expenses ({items.length})</h2>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">{day(item.date)}</div>
                    <div className="text-sm text-muted-foreground">{item.type} · {item.name}</div>
                    {item.kind === "visit" && (
                      <Link to="/visits/$visitId" params={{ visitId: item.id }} className="font-medium text-foreground hover:underline">{item.detail}</Link>
                    )}
                    {item.kind === "grocery" && (
                      <Link to="/groceries/$groceryId" params={{ groceryId: item.id }} className="font-medium text-foreground hover:underline">{item.name}</Link>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-foreground">{money(item.amount) ?? "—"}</div>
                    <div className="mt-1"><StatusBadge ok={false} yes="Paid" no="Unpaid" /></div>
                    <button
                      type="button"
                      disabled={settle.isPending}
                      onClick={() => markPaid(item.kind, item.id)}
                      className="mt-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      {settle.isPending && settlingId === item.id ? "Saving…" : "Mark Paid"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
