export type DueStatus = "overdue" | "soon" | "upcoming";
export const DUE_SOON_DAYS = 7;

/** Local calendar date as YYYY-MM-DD (no time-of-day). */
export function localISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Status from next_service_date only, comparing calendar dates. */
export function dueStatus(nextServiceDate: string | null, today: Date): DueStatus | null {
  if (!nextServiceDate) return null;
  const t = localISO(today);
  const limit = localISO(new Date(today.getFullYear(), today.getMonth(), today.getDate() + DUE_SOON_DAYS));
  if (nextServiceDate < t) return "overdue";
  if (nextServiceDate <= limit) return "soon";
  return "upcoming";
}

export function groupByDue<T extends { next_service_date: string | null }>(items: T[], today: Date) {
  const sorted = items
    .filter((i) => !!i.next_service_date)
    .sort((a, b) => a.next_service_date!.localeCompare(b.next_service_date!));
  return {
    overdue: sorted.filter((i) => dueStatus(i.next_service_date, today) === "overdue"),
    soon: sorted.filter((i) => dueStatus(i.next_service_date, today) === "soon"),
    upcoming: sorted.filter((i) => dueStatus(i.next_service_date, today) === "upcoming"),
  };
}
