import { beforeEach, describe, expect, it, vi } from "vitest";
import { expenseStarsQuery, filterStarredExpenses, setExpenseStar, updateExpenseStars } from "@/lib/expense-stars";
import { DEFAULT_HISTORY_FILTERS, expenseSections, type HistoryItem } from "@/lib/list-filters";

const { from, query } = vi.hoisted(() => {
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), range: vi.fn(), upsert: vi.fn(), delete: vi.fn() };
  return { from: vi.fn(() => query), query };
});
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from } }));
beforeEach(() => {
  vi.clearAllMocks();
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.order.mockReturnValue(query);
  query.delete.mockReturnValue(query); query.upsert.mockResolvedValue({ error: null });
  query.range.mockResolvedValue({ data: [], error: null });
});

const item = (id: string, kind: "visit" | "grocery", date: string): HistoryItem => ({
  id, kind, date, type: kind === "visit" ? "Gardener" : "Grocery", providerId: "same-provider",
  title: "", subtitle: "", amount: 10, settled: false, receipt_url: null, created_at: date,
});
const items = [item("v1", "visit", "2026-10-20"), item("v2", "visit", "2026-10-21"), item("g1", "grocery", "2026-10-22"), item("v3", "visit", "2026-10-17"), item("g2", "grocery", "2026-10-16")];

describe("individual expense stars", () => {
  it.each(["visit", "grocery"] as const)("persists a %s star to its own foreign key", async (kind) => {
    await setExpenseStar("owner", { kind, id: "record" }, true);
    expect(from).toHaveBeenCalledWith("expense_stars");
    expect(query.upsert).toHaveBeenCalledWith(
      kind === "visit" ? { user_id: "owner", visit_id: "record" } : { user_id: "owner", grocery_id: "record" },
      { onConflict: `user_id,${kind === "visit" ? "visit_id" : "grocery_id"}`, ignoreDuplicates: true },
    );
  });
  it.each(["visit", "grocery"] as const)("unstar scopes deletion to owner and %s expense", async (kind) => {
    query.eq.mockReturnValueOnce(query).mockResolvedValueOnce({ error: null });
    await setExpenseStar("owner", { kind, id: "record" }, false);
    expect(query.eq.mock.calls).toEqual([["user_id", "owner"], [kind === "visit" ? "visit_id" : "grocery_id", "record"]]);
  });
  it("reads persisted stars with owner-specific cache and query, distinguishing equal IDs", async () => {
    query.range.mockResolvedValue({ data: [{ visit_id: "same", grocery_id: null }, { visit_id: null, grocery_id: "same" }], error: null });
    const options = expenseStarsQuery("owner");
    expect(options.queryKey).toEqual(["expense-stars", "owner"]);
    expect(await options.queryFn?.({} as never)).toEqual(new Set(["visit-same", "grocery-same"]));
    expect(query.eq).toHaveBeenCalledWith("user_id", "owner");
    expect(expenseStarsQuery("other").queryKey).not.toEqual(options.queryKey);
  });
  it("starring one visit never stars another visit from the same provider", () => {
    const stars = updateExpenseStars(new Set(), items[0], true);
    expect(filterStarredExpenses(items, stars, true).map((i) => i.id)).toEqual(["v1"]);
  });
  it("filters both sections while preserving their actual-date ordering", () => {
    const stars = new Set(["visit-v1", "grocery-g1", "visit-v3", "grocery-g2"]);
    const sections = expenseSections(filterStarredExpenses(items, stars, true), "2026-10-18", DEFAULT_HISTORY_FILTERS);
    expect(sections.upcoming.map((i) => i.id)).toEqual(["v1", "g1"]);
    expect(sections.history.map((i) => i.id)).toEqual(["v3", "g2"]);
  });
  it("combines starred, type, status, month and year filters", () => {
    const sections = expenseSections(filterStarredExpenses(items, new Set(["grocery-g1", "grocery-g2", "visit-v3"]), true), "2026-10-18", { type: "Grocery", status: "outstanding", month: "10", year: "2026" });
    expect(sections.upcoming.map((i) => i.id)).toEqual(["g1"]);
    expect(sections.history.map((i) => i.id)).toEqual(["g2"]);
  });
  it("immediately removes an unstarred item from the starred view and restores all when disabled", () => {
    const stars = updateExpenseStars(new Set(["visit-v1"]), items[0], false);
    expect(filterStarredExpenses(items, stars, true)).toEqual([]);
    expect(filterStarredExpenses(items, stars, false)).toEqual(items);
  });
  it("propagates database failure instead of claiming persistence", async () => {
    query.upsert.mockResolvedValue({ error: new Error("denied") });
    await expect(setExpenseStar("owner", { kind: "visit", id: "v1" }, true)).rejects.toThrow("denied");
  });
});