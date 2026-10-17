import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { day, money, receiptUrlQuery, removeReceipt, visitQuery } from "@/lib/visits-api";

export const Route = createFileRoute("/_authenticated/visits/$visitId/")({
  head: () => ({
    meta: [
      { title: "Visit details — HomeOps" },
      { name: "description", content: "Details of a maintenance visit." },
      { property: "og:title", content: "Visit details — HomeOps" },
      { property: "og:description", content: "Details of a maintenance visit." },
    ],
  }),
  component: VisitDetail,
});

function VisitDetail() {
  const { visitId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: v, isLoading } = useQuery(visitQuery(visitId));
  const receipt = useQuery(receiptUrlQuery(v?.receipt_url ?? null));
  const [showReceipt, setShowReceipt] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);

  async function remove() {
    if (!v) return;
    const { error } = await supabase.from("maintenance_visits").delete().eq("id", visitId);
    if (error) return setDelError("We couldn't delete this visit. Please try again.");
    await removeReceipt(v.receipt_url);
    qc.removeQueries({ queryKey: ["visits", visitId] });
    await qc.invalidateQueries({ queryKey: ["visits"] });
    navigate({ to: "/providers/$id", params: { id: v.service_provider_id }, search: { visitDeleted: true } });
  }

  return (
    <AppShell>
      {v && (
        <Link to="/providers/$id" params={{ id: v.service_provider_id }} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to {v.service_providers?.name ?? "provider"}
        </Link>
      )}
      {isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
      {!isLoading && !v && <p className="mt-6 text-foreground">This visit wasn't found.</p>}
      {v && (
        <div className="mt-4 rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">{v.service_providers?.name}</p>
          <h1 className="text-2xl font-semibold text-foreground">{v.service_performed}</h1>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Provider" value={v.service_providers?.name ?? null} />
            <Field label="Visit Date" value={day(v.visit_date)} />
            <Field label="Service Performed" value={v.service_performed} />
            <Field label="Amount Paid" value={money(v.amount_paid)} />
            <div><dt className="text-sm text-muted-foreground">Payment Status</dt><dd className="mt-1"><StatusBadge ok={v.paid} yes="Paid" no="Unpaid" /></dd></div>
            <Field label="Next Service Date" value={day(v.next_service_date)} />
            <div className="sm:col-span-2"><Field label="Notes" value={v.notes} /></div>
          </dl>

          {v.receipt_url && (
            <div className="mt-6">
              <button onClick={() => setShowReceipt(!showReceipt)} className="rounded-md border border-input px-5 py-3 font-medium text-foreground hover:bg-accent">
                {showReceipt ? "Hide Receipt" : "View Receipt"}
              </button>
              {showReceipt && (
                <div className="mt-4">
                  {receipt.isLoading && <p className="text-muted-foreground">Loading receipt…</p>}
                  {receipt.error && <p className="text-destructive">We couldn't load the receipt. Please try again.</p>}
                  {receipt.data && (
                    <a href={receipt.data} target="_blank" rel="noreferrer">
                      <img src={receipt.data} alt="Receipt" className="max-h-[70vh] w-full rounded-md border border-border object-contain bg-background" />
                      <span className="mt-1 block text-xs text-muted-foreground">Tap to open full size (some phones may download HEIC photos instead).</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {delError && <p className="mt-4 text-sm text-destructive">{delError}</p>}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/visits/$visitId/edit" params={{ visitId }} className="rounded-md bg-primary px-5 py-3 text-center font-medium text-primary-foreground hover:opacity-90">
              Edit Visit
            </Link>
            <AlertDialog>
              <AlertDialogTrigger className="rounded-md border border-destructive px-5 py-3 font-medium text-destructive hover:bg-destructive/10">
                Delete Visit
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to delete this visit?</AlertDialogTitle>
                  <AlertDialogDescription>This visit{v.receipt_url ? " and its receipt" : ""} will be removed permanently.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Yes, delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
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
