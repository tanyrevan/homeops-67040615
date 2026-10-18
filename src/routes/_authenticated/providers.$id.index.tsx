import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { providerQuery } from "@/lib/providers-api";
import { StarButton } from "@/components/StarButton";
import { VisitHistory } from "@/components/VisitHistory";

export const Route = createFileRoute("/_authenticated/providers/$id/")({
  validateSearch: (s: Record<string, unknown>): { visitDeleted?: boolean } =>
    s["visitDeleted"] === true || s["visitDeleted"] === "1" ? { visitDeleted: true } : {},
  head: () => ({
    meta: [
      { title: "Provider details — HomeOps" },
      { name: "description", content: "Details for a household service provider." },
      { property: "og:title", content: "Provider details — HomeOps" },
      { property: "og:description", content: "Details for a household service provider." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProviderDetail,
});

function ProviderDetail() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const { visitDeleted } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: p, isLoading } = useQuery(providerQuery(id));
  const [delError, setDelError] = useState<string | null>(null);

  async function remove() {
    const { error } = await supabase.from("service_providers").delete().eq("id", id);
    if (error) return setDelError("We couldn't delete this provider. Please try again.");
    qc.removeQueries({ queryKey: ["providers", id] });
    await qc.invalidateQueries({ queryKey: ["providers"] });
    navigate({ to: "/providers", search: { deleted: true } });
  }

  return (
    <AppShell>
      <Link to="/providers" className="text-sm text-muted-foreground hover:text-foreground">← Back to providers</Link>
      {visitDeleted && <p className="mt-4 rounded-md bg-accent p-3 text-sm text-foreground">Visit deleted.</p>}
      {isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
      {!isLoading && !p && <p className="mt-6 text-foreground">This provider wasn't found.</p>}
      {p && (
        <div className="mt-4 rounded-lg border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{p.name}</h1>
            <StarButton userId={user.id} providerId={p.id} name={p.name} />
          </div>
          <dl className="mt-5 space-y-4">
            <Field label="Service type" value={p.service_type} />
            <Field label="Phone or contact" value={p.phone_or_contact} />
            <Field label="Notes" value={p.notes} />
            <Field label="Added" value={new Date(p.created_at).toLocaleString()} />
          </dl>
          {delError && <p className="mt-4 text-sm text-destructive">{delError}</p>}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/providers/$id/edit" params={{ id }} className="rounded-md bg-primary px-5 py-3 text-center font-medium text-primary-foreground hover:opacity-90">
              Edit
            </Link>
            <AlertDialog>
              <AlertDialogTrigger className="rounded-md border border-destructive px-5 py-3 font-medium text-destructive hover:bg-destructive/10">
                Delete
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to delete this provider?</AlertDialogTitle>
                  <AlertDialogDescription>{p.name} will be removed permanently.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
      {p && <VisitHistory providerId={id} />}
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-wrap text-foreground">{value || "—"}</dd>
    </div>
  );
}
