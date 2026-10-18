import { describe, expect, it } from "vitest";
import { scheduledVisit } from "@/lib/visits-api";

const v = (id: string, next: string | null) => ({ id, next_service_date: next });

describe("scheduledVisit (upcoming visit rule)", () => {
  it("returns null when there are no visits", () => {
    expect(scheduledVisit([])).toBeNull();
  });

  it("returns null when no visit has a next_service_date", () => {
    expect(scheduledVisit([v("a", null), v("b", null)])).toBeNull();
  });

  it("uses the most recent visit's next_service_date as the schedule", () => {
    // Visits are newest-first; only the newest next_service_date is active.
    const visits = [v("newest", "2026-10-25"), v("older", "2026-10-20")];
    expect(scheduledVisit(visits)?.id).toBe("newest");
  });

  it("ignores obsolete next_service_dates on older historical visits", () => {
    const visits = [v("newest", null), v("older", "2026-10-20")];
    expect(scheduledVisit(visits)).toBeNull();
  });

  it("a new next_service_date on the latest visit becomes the next upcoming visit", () => {
    const visits = [v("just-completed", "2026-11-05"), v("previous", "2026-10-25")];
    expect(scheduledVisit(visits)?.next_service_date).toBe("2026-11-05");
  });
});
