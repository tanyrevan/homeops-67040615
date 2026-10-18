import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { VisitForm } from "@/components/VisitForm";
import { supabase } from "@/integrations/supabase/client";
import { removeReceipt, uploadReceipt, visitQuery } from "@/lib/visits-api";

export const Route = createFileRoute("/_authenticated/visits/$visitId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Visit — 16 Olive Road" },
      { name: "description", content: "Edit a maintenance visit." },
      { property: "og:title", content: "Edit Visit — 16 Olive Road" },
      { property: "og:description", content: "Edit a maintenance visit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditVisit,
});

function EditVisit() {
  const { visitId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: v, isLoading } = useQuery(visitQuery(visitId));

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Edit Visit</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && !v && <p className="text-foreground">This visit wasn't found.</p>}
      {v && (
        <VisitForm
          initial={{
            visitDate: v.visit_date,
            service: v.service_performed,
            amount: v.amount_paid == null ? "" : String(v.amount_paid),
            notes: v.notes ?? "",
            paid: v.paid,
          }}
          hasReceipt={!!v.receipt_url}
          submitLabel="Save Changes"
          onCancel={() => navigate({ to: "/visits/$visitId", params: { visitId } })}
          onSubmit={async ({ data, file, removeReceipt: drop }) => {
            let path = v.receipt_url;
            if (file) {
              try { path = await uploadReceipt(user.id, file); } catch { return "We couldn't upload the receipt. Please try again."; }
            } else if (drop) path = null;
            const { error } = await supabase.from("maintenance_visits").update({ ...data, receipt_url: path }).eq("id", visitId);
            if (error) { if (file) await removeReceipt(path); return "We couldn't save your changes. Please try again."; }
            if (path !== v.receipt_url) await removeReceipt(v.receipt_url);
            await qc.invalidateQueries({ queryKey: ["visits"] });
            navigate({ to: "/visits/$visitId", params: { visitId } });
            return null;
          }}
        />
      )}
    </AppShell>
  );
}
