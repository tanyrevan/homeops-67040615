import { dueStatus } from "@/lib/due-status";

export function DueBadge({ date }: { date: string | null }) {
  const s = dueStatus(date, new Date());
  if (!s) return null;
  if (s === "overdue")
    return <span className="inline-flex items-center rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">Overdue</span>;
  if (s === "soon")
    return <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-foreground">Due Soon</span>;
  return <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Upcoming</span>;
}
