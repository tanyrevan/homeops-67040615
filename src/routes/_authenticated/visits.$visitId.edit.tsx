import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { VisitForm } from "@/components/VisitForm";
import { providerQuery } from "@/lib/providers-api";
import { saveServiceExpense } from "@/lib/service-expense";
import { expenseTypeLabel } from "@/lib/expense-type";
import { visitQuery } from "@/lib/visits-api";

export const Route = createFileRoute("/_authenticated/visits/$visitId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Service Expense | 16 Olive Road" },
      { name: "description", content: "Edit a service expense." },
      { property: "og:title", content: "Edit Service Expense | 16 Olive Road" },
      { property: "og:description", content: "Edit a service expense." },
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

  const { data: p } = useQuery({ ...providerQuery(v?.service_provider_id ?? ""), enabled: !!v });

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Edit Service Expense</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && !v && <p className="text-foreground">This visit wasn't found.</p>}
      {v && p && (
        <>
        <div className="mb-5"><span className="mb-1 block text-sm font-medium text-foreground">Expense Type</span><p className="text-foreground">{expenseTypeLabel(p.service_type)}</p></div>
        <VisitForm
          key={v.id}
          expenseType={p.service_type}
          providerInitial={{ name: p.name, phone: p.phone_or_contact ?? "", customType: p.service_type === "Other" ? "Other" : "" }}
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
          onSubmit={async (submission) => {
            if (!submission.provider) return "Please enter the name.";
            try {
              await saveServiceExpense(user.id, submission, submission.provider, {
                id: v.id, receipt_url: v.receipt_url, provider: p,
              });
              await Promise.all([qc.invalidateQueries({ queryKey: ["visits"] }), qc.invalidateQueries({ queryKey: ["providers"] })]);
              navigate({ to: "/visits/$visitId", params: { visitId } });
              return null;
            } catch { return "We couldn't save your changes. Please try again."; }
          }}
        />
        </>
      )}
    </AppShell>
  );
}
