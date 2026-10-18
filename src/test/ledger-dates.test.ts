import { describe, expect, it } from "vitest";
import { pastItems, upcomingItems, type HistoryItem } from "@/lib/list-filters";

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
