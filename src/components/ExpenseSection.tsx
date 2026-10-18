import { Link } from "@tanstack/react-router";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import type { HistoryItem } from "@/lib/list-filters";
import { day, money } from "@/lib/visits-api";
import { expenseStarKey } from "@/lib/expense-stars";

type Props = {
  upcoming?: boolean;
  items: HistoryItem[];
  settlingKey: string | null;
  saving: boolean;
  onMarkPaid: (item: HistoryItem) => void;
  stars: Set<string>;
  starring: boolean;
  onToggleStar: (item: HistoryItem) => void;
};

export function ExpenseSection({ upcoming = false, items, settlingKey, saving, onMarkPaid, stars, starring, onToggleStar }: Props) {
  const heading = upcoming ? "Upcoming" : "History";
  return (
    <section aria-label={heading}>
      <h2 className="mb-3 text-lg font-semibold text-foreground">{heading}</h2>
      {items.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">{upcoming ? "No upcoming expenses." : "No expense history yet."}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="flex items-start">
              <Link
                to={item.kind === "visit" ? "/visits/$visitId" : "/groceries/$groceryId"}
                params={item.kind === "visit" ? { visitId: item.id } : { groceryId: item.id }}
                className="block min-w-0 flex-1 p-4 hover:bg-accent"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-muted-foreground">{day(item.date)}</div>
                    <div className="break-words font-medium text-foreground">{item.type}</div>
                    {item.receipt_url && <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Paperclip className="h-3 w-3" aria-hidden="true" />Receipt</div>}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-semibold tabular-nums text-foreground">{money(item.amount) ?? "—"}</div>
                    {!upcoming && <div className="mt-1"><StatusBadge ok={item.settled} yes="Paid" no="Unpaid" /></div>}
                  </div>
                </div>
              </Link>
              <Button
                variant="ghost" size="icon" type="button"
                className="mr-2 mt-3 shrink-0 text-xl text-foreground"
                aria-label={`${stars.has(expenseStarKey(item)) ? "Unstar" : "Star"} ${item.type} expense on ${item.date}`}
                aria-pressed={stars.has(expenseStarKey(item))}
                title={stars.has(expenseStarKey(item)) ? "Unstar expense" : "Star expense"}
                disabled={starring}
                onClick={() => onToggleStar(item)}
              >
                <span aria-hidden="true">{stars.has(expenseStarKey(item)) ? "★" : "☆"}</span>
              </Button>
              </div>
              {!upcoming && !item.settled && (
                <div className="flex justify-end px-4 pb-3">
                  <Button size="sm" disabled={saving} onClick={() => onMarkPaid(item)}>
                    {settlingKey === `${item.kind}-${item.id}` ? "Saving…" : "Mark Paid"}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}