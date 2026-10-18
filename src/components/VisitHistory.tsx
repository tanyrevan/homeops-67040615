import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/StatusBadge";
import { DueBadge } from "@/components/DueBadge";
import { day, money, providerVisitsQuery } from "@/lib/visits-api";

export function VisitHistory({ providerId }: { providerId: string }) {
  const { data, isLoading, error } = useQuery(providerVisitsQuery(providerId));
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-xl font-semibold text-foreground">History</h2>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">We couldn't load visits. Please refresh.</p>}
      {data && data.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          No completed visits yet. Tap "Add Visit" after their next visit.
        </div>
      )}
      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((v) => (
            <li key={v.id}>
              <Link to="/visits/$visitId" params={{ visitId: v.id }} className="block rounded-lg border border-border bg-card p-4 hover:bg-accent">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">{day(v.visit_date)}</div>
                    <div className="font-medium text-foreground">{v.service_performed}</div>
                  </div>
                  {v.amount_paid != null && <div className="font-semibold text-foreground">{money(v.amount_paid)}</div>}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <StatusBadge ok={v.paid} yes="Paid" no="Unpaid" />
                  {v.next_service_date && <span className="inline-flex items-center gap-2">Next service: {day(v.next_service_date)} <DueBadge date={v.next_service_date} /></span>}
                  {v.receipt_url && <span className="font-medium text-primary">📎 Receipt</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
