import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { VisitForm } from "@/components/VisitForm";
import { supabase } from "@/integrations/supabase/client";
import { providerQuery } from "@/lib/providers-api";
import { removeReceipt, uploadReceipt } from "@/lib/visits-api";

export const Route = createFileRoute("/_authenticated/providers/$id/visits/new")({
  head: () => ({
    meta: [
      { title: "Add Visit — HomeOps" },
      { name: "description", content: "Log a maintenance visit and payment." },
      { property: "og:title", content: "Add Visit — HomeOps" },
      { property: "og:description", content: "Log a maintenance visit and payment." },
    ],
  }),
  component: NewVisit,
});

function NewVisit() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: p, isLoading } = useQuery(providerQuery(id));
  const today = new Date().toLocaleDateString("en-CA");

  return (
    <AppShell>
      <Link to="/providers/$id" params={{ id }} className="text-sm text-muted-foreground hover:text-foreground">← Back to provider</Link>
      <h1 className="mb-6 mt-3 text-2xl font-semibold text-foreground">Add Visit{p ? ` — ${p.name}` : ""}</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && !p && <p className="text-foreground">This provider wasn't found.</p>}
      {p && (
        <VisitForm
          initial={{ visitDate: today, service: "", amount: "", notes: "", nextDate: "", paid: false }}
          submitLabel="Save Visit"
          onCancel={() => navigate({ to: "/providers/$id", params: { id } })}
          onSubmit={async ({ data, file }) => {
            let path: string | null = null;
            if (file) {
              try { path = await uploadReceipt(user.id, file); } catch { return "We couldn't upload the receipt. Please try again."; }
            }
            const { data: row, error } = await supabase
              .from("maintenance_visits")
              .insert({ ...data, receipt_url: path, service_provider_id: id, user_id: user.id })
              .select("id").single();
            if (error) { await removeReceipt(path); return "We couldn't save this visit. Please try again."; }
            await qc.invalidateQueries({ queryKey: ["visits"] });
            navigate({ to: "/visits/$visitId", params: { visitId: row.id } });
            return null;
          }}
        />
      )}
    </AppShell>
  );
}
