import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { DueBadge } from "@/components/DueBadge";
import { supabase } from "@/integrations/supabase/client";
import { groupByDue } from "@/lib/due-status";
import { day } from "@/lib/visits-api";

const scheduledQuery = queryOptions({
  queryKey: ["visits", "scheduled"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("maintenance_visits")
      .select("id, service_provider_id, service_performed, next_service_date, service_providers(name)")
      .not("next_service_date", "is", null)
      .order("next_service_date", { ascending: true });
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/_authenticated/upcoming")({
  head: () => ({
    meta: [
      { title: "Upcoming — HomeOps" },
      { name: "description", content: "Overdue and upcoming household maintenance." },
      { property: "og:title", content: "Upcoming — HomeOps" },
      { property: "og:description", content: "Overdue and upcoming household maintenance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UpcomingPage,
});

type Row = NonNullable<Awaited<ReturnType<NonNullable<typeof scheduledQuery.queryFn>>>>[number];

function UpcomingPage() {
  const { data, isLoading, error } = useQuery(scheduledQuery);
  const groups = groupByDue(data ?? [], new Date());

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Upcoming</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">We couldn't load scheduled maintenance. Please refresh.</p>}
      {data && data.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="text-lg font-medium text-foreground">No upcoming maintenance scheduled.</p>
          <p className="mt-1 text-sm text-muted-foreground">Add a Next Service Date when you log a visit and it will show up here.</p>
        </div>
      )}
      {data && data.length > 0 && (
        <div className="space-y-8">
          <Section title="Overdue" rows={groups.overdue} />
          <Section title="Due Soon" rows={groups.soon} />
          <Section title="Upcoming" rows={groups.upcoming} />
        </div>
      )}
    </AppShell>
  );
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  if (rows.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-foreground">{title} ({rows.length})</h2>
      <ul className="space-y-3">
        {rows.map((v) => (
          <li key={v.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link to="/providers/$id" params={{ id: v.service_provider_id }} className="font-semibold text-foreground hover:underline">
                  {v.service_providers?.name ?? "Provider"}
                </Link>
                <div className="text-foreground">{v.service_performed}</div>
                <div className="mt-1 text-sm text-muted-foreground">Next service: {day(v.next_service_date)}</div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <DueBadge date={v.next_service_date} />
              </div>
            </div>
            <Link to="/visits/$visitId" params={{ visitId: v.id }} className="mt-3 inline-block text-sm font-medium text-primary underline">
              View visit
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
