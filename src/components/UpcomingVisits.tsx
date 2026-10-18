import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DueBadge } from "@/components/DueBadge";
import { day, providerVisitsQuery } from "@/lib/visits-api";

/**
 * The currently scheduled upcoming visit is the most recent completed visit's
 * next_service_date. Editing updates that date; Completing opens the visit
 * form prefilled with the scheduled date.
 */
export function UpcomingVisits({ providerId }: { providerId: string }) {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery(providerVisitsQuery(providerId));
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Visits are newest first; the latest visit carrying a next_service_date is the schedule.
  const scheduled = data?.find((v) => v.next_service_date) ?? null;

  async function saveDate() {
    if (!scheduled || !date) return setEditing(false);
    const { error } = await supabase.from("maintenance_visits").update({ next_service_date: date }).eq("id", scheduled.id);
    if (error) return setSaveError("We couldn't update the scheduled date. Please try again.");
    setSaveError(null);
    setEditing(false);
    await qc.invalidateQueries({ queryKey: ["visits"] });
  }

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-foreground">Upcoming Visits</h2>
        <Link to="/providers/$id/visits/new" params={{ id: providerId }} className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
          Add Visit
        </Link>
      </div>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">We couldn't load the schedule. Please refresh.</p>}
      {data && !scheduled && (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          No visit scheduled. Tap "Add Visit" to log a visit and set the next service date.
        </div>
      )}
      {scheduled && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {editing ? (
                <input
                  type="date"
                  aria-label="Scheduled date"
                  className="rounded-md border border-border bg-background px-3 py-2 text-foreground"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              ) : (
                <>
                  <span className="font-medium text-foreground">{day(scheduled.next_service_date)}</span>
                  <DueBadge date={scheduled.next_service_date!} />
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button type="button" onClick={saveDate} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                    Save
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { setDate(scheduled.next_service_date!); setEditing(true); }}
                    className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    Edit
                  </button>
                  <Link
                    to="/providers/$id/visits/new"
                    params={{ id: providerId }}
                    search={{ scheduled: scheduled.next_service_date! }}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    Complete
                  </Link>
                </>
              )}
            </div>
          </div>
          {saveError && <p className="mt-2 text-sm text-destructive">{saveError}</p>}
        </div>
      )}
    </section>
  );
}
