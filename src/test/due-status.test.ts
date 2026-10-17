import { describe, expect, it } from "vitest";
import { dueStatus, groupByDue } from "@/lib/due-status";

const today = new Date(2026, 9, 17, 23, 30); // late in the day on Oct 17

describe("due status", () => {
  it("no next date -> no status", () => expect(dueStatus(null, today)).toBeNull());
  it("yesterday is Overdue", () => expect(dueStatus("2026-10-16", today)).toBe("overdue"));
  it("today is Due Soon even late in the day", () => expect(dueStatus("2026-10-17", today)).toBe("soon"));
  it("7 days out is Due Soon", () => expect(dueStatus("2026-10-24", today)).toBe("soon"));
  it("8 days out is Upcoming", () => expect(dueStatus("2026-10-25", today)).toBe("upcoming"));
  it("crosses month end", () => expect(dueStatus("2026-02-03", new Date(2026, 0, 28))).toBe("soon"));
  it("groups, sorts soonest first, and skips visits without a date", () => {
    const g = groupByDue(
      [
        { id: "a", next_service_date: "2026-12-01" },
        { id: "b", next_service_date: null },
        { id: "c", next_service_date: "2026-10-01" },
        { id: "d", next_service_date: "2026-10-20" },
        { id: "e", next_service_date: "2026-11-01" },
      ],
      today,
    );
    expect(g.overdue.map((x) => x.id)).toEqual(["c"]);
    expect(g.soon.map((x) => x.id)).toEqual(["d"]);
    expect(g.upcoming.map((x) => x.id)).toEqual(["e", "a"]);
  });
});
