import { beforeEach, describe, expect, it, vi } from "vitest";
import { expenseTypeLabel } from "@/lib/expense-type";

const query = vi.hoisted(() => ({
  from: vi.fn(), select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: query.from } }));

import { visitQuery } from "@/lib/visits-api";

describe("Service detail record query", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    query.from.mockReturnValue({ select: query.select });
    query.select.mockReturnValue({ eq: query.eq });
    query.eq.mockReturnValue({ maybeSingle: query.maybeSingle });
  });

  it("reads the existing transaction and provider category together without changing the record", async () => {
    const record = Object.freeze({
      id: "existing-visit", service_performed: "Cleaned filters", paid: false,
      service_providers: Object.freeze({ id: "existing-provider", name: "Jacuzzi Maintenance", service_type: "Jacuzzi" }),
    });
    query.maybeSingle.mockResolvedValue({ data: record, error: null });
    const options = visitQuery(record.id);
    const result = await options.queryFn({} as never);
    expect(query.from).toHaveBeenCalledWith("maintenance_visits");
    expect(query.select).toHaveBeenCalledWith("*, service_providers(id, name, service_type)");
    expect(query.eq).toHaveBeenCalledWith("id", "existing-visit");
    expect(result).toBe(record);
    expect(result?.service_providers?.service_type).toBe("Jacuzzi");
    expect(result?.service_providers?.name).toBe("Jacuzzi Maintenance");
    expect(result?.service_performed).toBe("Cleaned filters");
    expect(result?.paid).toBe(false);
  });

  it("preserves stored A/C while the shared category normalization produces Aircon", async () => {
    const record = Object.freeze({ service_providers: Object.freeze({ service_type: "A/C" }) });
    query.maybeSingle.mockResolvedValue({ data: record, error: null });
    const result = await visitQuery("legacy-visit").queryFn({} as never);
    expect(expenseTypeLabel(result?.service_providers?.service_type ?? "Other")).toBe("Aircon");
    expect(record.service_providers.service_type).toBe("A/C");
  });

  it("does not fabricate a record when the ownership-limited read returns none", async () => {
    query.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await visitQuery("inaccessible-visit").queryFn({} as never)).toBeNull();
  });

  it("propagates query failures rather than presenting a partial transaction", async () => {
    const error = new Error("Read denied");
    query.maybeSingle.mockResolvedValue({ data: null, error });
    await expect(visitQuery("denied-visit").queryFn({} as never)).rejects.toBe(error);
  });
});