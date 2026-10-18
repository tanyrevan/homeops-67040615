import { describe, expect, it } from "vitest";
import { pastItems, upcomingItems, type HistoryItem } from "@/lib/list-filters";
import { toLedgerItems } from "@/lib/ledger";
import { DEFAULT_HISTORY_FILTERS, filterHistory } from "@/lib/list-filters";
import { expenseTypeLabel } from "@/lib/expense-type";

const TODAY = "2026-10-18";
const item = (id: string, date: string, created = "2026-10-01T00:00:00Z"): HistoryItem => ({
  kind: "visit", id, date, type: "Gardener", title: "Service", subtitle: "Provider",
  providerId: "p", amount: 10, settled: true, receipt_url: null, created_at: created,
});
const items = [
  item("past", "2026-10-01"),
  item("today", "2026-10-18"),
  item("soon", "2026-10-20"),
  item("later", "2026-11-13"),
];

const grocery = (id: string, date: string, created: string, paid = false) => ({ id, purchase_date: date, created_at: created, store: "Store", amount: 54.2, reimbursed: paid, receipt_url: null });
const visit = (id: string, date: string, created: string, paid = false) => ({ id, visit_date: date, created_at: created, service_performed: "Maintenance", amount_paid: 250, paid, receipt_url: null, service_provider_id: "p", service_providers: { name: "Provider", service_type: "A/C" } });

describe("Combined Expenses ledger", () => {
  it("orders both tables by actual expense date, not creation date", () => {
    const ledger = toLedgerItems([visit("oct15", "2026-10-15", "2026-10-01"), visit("oct5", "2026-10-05", "2026-10-22")], [grocery("oct13", "2026-10-13", "2026-10-02"), grocery("oct20", "2026-10-20", "2026-10-01")]);
    expect(ledger.map((h) => h.id)).toEqual(["oct20", "oct15", "oct13", "oct5"]);
  });
  it("does not depend on input insertion order", () => {
    const a = visit("a", "2026-10-15", "2026-10-20");
    const b = visit("b", "2026-10-05", "2026-10-22");
    expect(toLedgerItems([a, b], []).map((h) => h.id)).toEqual(toLedgerItems([b, a], []).map((h) => h.id));
  });
  it("uses newest created_at across tables for equal expense dates", () => {
    expect(toLedgerItems([visit("older", "2026-10-15", "2026-10-16")], [grocery("newer", "2026-10-15", "2026-10-17")]).map((h) => h.id)).toEqual(["newer", "older"]);
  });
  it("keeps equal-date equal-creation ties deterministic", () => {
    const a = visit("a", "2026-10-15", "2026-10-16"), b = visit("b", "2026-10-15", "2026-10-16");
    expect(toLedgerItems([b, a], []).map((h) => h.id)).toEqual(["a", "b"]);
  });
  it("Unpaid includes false paid and reimbursed flags from both tables", () => {
    const ledger = toLedgerItems([visit("unpaid", TODAY, TODAY), visit("paid", TODAY, TODAY, true)], [grocery("g-unpaid", TODAY, TODAY), grocery("g-paid", TODAY, TODAY, true)]);
    expect(filterHistory(ledger, { ...DEFAULT_HISTORY_FILTERS, status: "outstanding" }).map((h) => h.id).sort()).toEqual(["g-unpaid", "unpaid"]);
  });
  it("Paid includes true paid and reimbursed flags from both tables", () => {
    const ledger = toLedgerItems([visit("unpaid", TODAY, TODAY), visit("paid", TODAY, TODAY, true)], [grocery("g-unpaid", TODAY, TODAY), grocery("g-paid", TODAY, TODAY, true)]);
    expect(filterHistory(ledger, { ...DEFAULT_HISTORY_FILTERS, status: "settled" }).map((h) => h.id).sort()).toEqual(["g-paid", "paid"]);
  });
  it("Upcoming uses actual future dates from both tables and retains amounts", () => {
    const ledger = toLedgerItems([visit("v", "2026-10-30", "2026-10-01")], [grocery("g", "2026-10-20", "2026-11-01"), grocery("past", "2026-10-05", "2026-11-01")]);
    expect(upcomingItems(ledger, TODAY).map((h) => [h.id, h.amount])).toEqual([["g", 54.2], ["v", 250]]);
  });
  it("maps stored A/C to the canonical type without altering input records", () => {
    const row = visit("ac", TODAY, TODAY);
    expect(toLedgerItems([row], [])[0]?.type).toBe("Air Conditioner");
    expect(row.service_providers.service_type).toBe("A/C");
  });
  it("only maps the exact legacy type, leaving unrelated text unchanged", () => {
    expect(expenseTypeLabel("A/C")).toBe("Air Conditioner");
    expect(expenseTypeLabel("A/C inspection")).toBe("A/C inspection");
  });
});

describe("Upcoming (future-dated expenses)", () => {
  it("includes only dates after today", () => {
    expect(upcomingItems(items, TODAY).map((i) => i.id)).toEqual(["soon", "later"]);
  });
  it("sorts soonest first", () => {
    expect(upcomingItems([item("b", "2026-12-01"), item("a", "2026-10-19")], TODAY).map((i) => i.id)).toEqual(["a", "b"]);
  });
});

describe("History (today and past expenses)", () => {
  it("includes today and earlier, excluding future dates", () => {
    expect(pastItems(items, TODAY).map((i) => i.id).sort()).toEqual(["past", "today"]);
  });
  it("excludes future-dated expenses even when unpaid", () => {
    const futureUnpaid = { ...item("f", "2026-10-25"), settled: false };
    expect(pastItems([futureUnpaid], TODAY)).toEqual([]);
  });
});
