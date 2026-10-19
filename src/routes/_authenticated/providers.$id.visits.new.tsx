import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { VisitForm } from "@/components/VisitForm";
import { providerQuery } from "@/lib/providers-api";
import { saveServiceExpense } from "@/lib/service-expense";

export const Route = createFileRoute("/_authenticated/providers/$id/visits/new")({
  head: () => ({
    meta: [
      { title: "Add Service Expense | 16 Olive Road" },
      { name: "description", content: "Record a service expense." },
      { property: "og:title", content: "Add Service Expense | 16 Olive Road" },
      { property: "og:description", content: "Record a service expense." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
      <Link to="/providers" className="text-sm text-muted-foreground hover:text-foreground">← Back to Expenses</Link>
      <h1 className="mb-6 mt-3 text-2xl font-semibold text-foreground">Add Expense{p ? ` — ${p.name}` : ""}</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && !p && <p className="text-foreground">This provider wasn't found.</p>}
      {p && (
        <VisitForm
          initial={{ visitDate: today, service: "", amount: "", notes: "", paid: null }}
          expenseType={p.service_type}
          providerInitial={{ name: p.name, phone: p.phone_or_contact ?? "" }}
          submitLabel="Save Expense"
          onCancel={() => navigate({ to: "/providers" })}
          onSubmit={async (submission) => {
            if (!submission.provider) return "Please enter the name.";
            try {
              const visitId = await saveServiceExpense(user.id, submission, submission.provider);
              await Promise.all([qc.invalidateQueries({ queryKey: ["visits"] }), qc.invalidateQueries({ queryKey: ["providers"] })]);
              navigate({ to: "/visits/$visitId", params: { visitId } });
              return null;
            } catch { return "We couldn't save this expense. Please try again."; }
          }}
        />
      )}
    </AppShell>
  );
}
