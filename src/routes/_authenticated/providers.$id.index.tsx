import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { providerQuery } from "@/lib/providers-api";
import { VisitHistory } from "@/components/VisitHistory";
import { UpcomingVisits } from "@/components/UpcomingVisits";

export const Route = createFileRoute("/_authenticated/providers/$id/")({
  validateSearch: (s: Record<string, unknown>): { visitDeleted?: boolean } =>
    s["visitDeleted"] === true || s["visitDeleted"] === "1" ? { visitDeleted: true } : {},
  head: () => ({
    meta: [
      { title: "Expense type details — HomeOps" },
      { name: "description", content: "Details for a household expense type." },
      { property: "og:title", content: "Expense type details — HomeOps" },
      { property: "og:description", content: "Details for a household expense type." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProviderDetail,
});

function ProviderDetail() {
  const { id } = Route.useParams();
  const { visitDeleted } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: p, isLoading } = useQuery(providerQuery(id));
  const [delError, setDelError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function remove() {
    const { error } = await supabase.from("service_providers").delete().eq("id", id);
    if (error) return setDelError("We couldn't delete this expense type. Please try again.");
    qc.removeQueries({ queryKey: ["providers", id] });
    await qc.invalidateQueries({ queryKey: ["providers"] });
    navigate({ to: "/providers", search: { deleted: true } });
  }

  return (
    <AppShell>
      <Link to="/providers" className="text-sm text-muted-foreground hover:text-foreground">← Back to expenses</Link>
      {visitDeleted && <p className="mt-4 rounded-md bg-accent p-3 text-sm text-foreground">Visit deleted.</p>}
      {isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
      {!isLoading && !p && <p className="mt-6 text-foreground">This expense type wasn't found.</p>}
      {p && (
        <div className="mt-4 rounded-lg border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{p.name}</h1>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Expense type options"
                className="rounded-md border border-input p-2 text-foreground hover:bg-accent"
              >
                <MoreHorizontal className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => navigate({ to: "/providers/$id/edit", params: { id } })}>
                  Edit expense type
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setConfirmDelete(true)}
                  className="text-destructive focus:text-destructive"
                >
                  Delete expense type
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <dl className="mt-5 space-y-4">
            <Field label="Expense type" value={p.service_type} />
            <Field label="Phone or contact" value={p.phone_or_contact} />
            <Field label="Notes" value={p.notes} />
            <Field label="Added" value={new Date(p.created_at).toLocaleString()} />
          </dl>
          {delError && <p className="mt-4 text-sm text-destructive">{delError}</p>}
          <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this expense type?</AlertDialogTitle>
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
      )}
      {p && <UpcomingVisits providerId={id} />}
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
