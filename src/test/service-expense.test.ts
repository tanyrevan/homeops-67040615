import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ from: vi.fn(), upload: vi.fn(), remove: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));
vi.mock("@/lib/visits-api", () => ({ uploadReceipt: mocks.upload, removeReceipt: mocks.remove }));
import { saveServiceExpense, suitableProvider } from "@/lib/service-expense";

const provider = { id: "provider-1", user_id: "owner", name: "ABC Electric", service_type: "Electrician", phone_or_contact: "123" };
const requested = { name: "ABC Electric", service_type: "Electrician", phone_or_contact: "123" };
const submission = { data: { visit_date: "2026-10-19", service_performed: "Repair", amount_paid: 75, paid: false, notes: "Expense notes" }, file: null, removeReceipt: false };
function query(data: unknown, error: unknown = null) {
  const q: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const key of ["select", "eq", "order", "range", "insert", "update", "delete"]) q[key] = vi.fn(() => q);
  q.single = vi.fn().mockResolvedValue({ data, error });
  q.then = vi.fn((resolve) => Promise.resolve({ data, error }).then(resolve));
  return q;
}
beforeEach(() => vi.clearAllMocks());
describe("combined service expense saving", () => {
  it("creates a provider and links the visit in one save action", async () => {
    const list = query([]), create = query({ id: "new-provider" }), visit = query({ id: "new-visit" });
    mocks.from.mockReturnValueOnce(list).mockReturnValueOnce(create).mockReturnValueOnce(visit);
    expect(await saveServiceExpense("owner", submission, requested)).toBe("new-visit");
    expect(create.insert).toHaveBeenCalledWith({ ...requested, user_id: "owner" });
    expect(visit.insert).toHaveBeenCalledWith({ ...submission.data, service_provider_id: "new-provider", receipt_url: null, user_id: "owner" });
  });
  it("reuses a suitable owned provider instead of inserting a duplicate", async () => {
    const list = query([provider]), visit = query({ id: "visit" });
    mocks.from.mockReturnValueOnce(list).mockReturnValueOnce(visit);
    await saveServiceExpense("owner", submission, requested);
    expect(list.eq).toHaveBeenCalledWith("user_id", "owner");
    expect(visit.insert).toHaveBeenCalledWith(expect.objectContaining({ service_provider_id: "provider-1" }));
    expect(mocks.from.mock.calls.map(([table]) => table)).toEqual(["service_providers", "maintenance_visits"]);
  });
  it("never reuses another owner's provider or one with conflicting contact/category", () => {
    expect(suitableProvider([{ ...provider, user_id: "other" }], "owner", requested)).toBeUndefined();
    expect(suitableProvider([provider], "owner", { ...requested, phone_or_contact: "456" })).toBeUndefined();
    expect(suitableProvider([provider], "owner", { ...requested, service_type: "Gardener" })).toBeUndefined();
  });
  it("matches normalized names and equivalent legacy Aircon types safely", () => {
    expect(suitableProvider([{ ...provider, service_type: "A/C" }], "owner", { ...requested, name: " abc electric ", service_type: "Air Conditioner" })?.id).toBe("provider-1");
  });
  it("edits an existing linked visit without creating or rewriting the shared provider", async () => {
    const visit = query({ id: "existing-visit" });
    mocks.from.mockReturnValueOnce(visit);
    await saveServiceExpense("owner", submission, requested, { id: "existing-visit", receipt_url: null, provider });
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledWith("maintenance_visits");
    expect(visit.update).toHaveBeenCalledWith(expect.objectContaining({ service_provider_id: "provider-1", paid: false }));
    expect(visit.eq).toHaveBeenCalledWith("id", "existing-visit");
    expect(visit.eq).toHaveBeenCalledWith("user_id", "owner");
  });
  it("removes only newly created provider and receipt when visit saving fails", async () => {
    const list = query([]), create = query({ id: "new-provider" }), visit = query(null, new Error("save failed")), cleanup = query(null);
    mocks.from.mockReturnValueOnce(list).mockReturnValueOnce(create).mockReturnValueOnce(visit).mockReturnValueOnce(cleanup);
    mocks.upload.mockResolvedValue("owner/visits/new.jpg");
    await expect(saveServiceExpense("owner", { ...submission, file: new File(["photo"], "new.jpg", { type: "image/jpeg" }) }, requested)).rejects.toThrow("save failed");
    expect(mocks.remove).toHaveBeenCalledWith("owner/visits/new.jpg");
    expect(cleanup.delete).toHaveBeenCalled();
    expect(cleanup.eq).toHaveBeenCalledWith("id", "new-provider");
  });
});