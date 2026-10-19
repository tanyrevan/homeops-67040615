import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ from: vi.fn(), upload: vi.fn(), remove: vi.fn(), signed: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: mocks.from,
  storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove, createSignedUrl: mocks.signed }) },
} }));
import { saveServiceExpense } from "@/lib/service-expense";
import { saveGroceryExpense } from "@/lib/groceries-api";
import { uploadReceipt, receiptUrlQuery, ReceiptUploadError } from "@/lib/visits-api";
import { MAX_RECEIPT_BYTES } from "@/lib/visit-validation";

function query(data: unknown, error: unknown = null) {
  const q: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const key of ["select", "eq", "order", "range", "insert", "update", "delete"]) q[key] = vi.fn(() => q);
  q.single = vi.fn().mockResolvedValue({ data, error });
  q.then = vi.fn((resolve) => Promise.resolve({ data, error }).then(resolve));
  return q;
}
const provider = { id: "provider", user_id: "owner", name: "QA", service_type: "Electrician", phone_or_contact: null };
const service = { data: { visit_date: "2026-10-19", service_performed: "", amount_paid: 12, notes: null, paid: false }, file: null, removeReceipt: false };
const grocery = { data: { purchase_date: "2026-10-19", store: "QA", amount: 12, notes: null, reimbursed: false }, file: null, removeReceipt: false };
const photo = () => new File(["photo"], "Screenshot 2026-10-15 140854.png", { type: "image/png" });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.upload.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
});
describe("receipt save contracts", () => {
  for (const kind of ["service", "grocery"] as const) {
    for (const receipt of [false, true]) {
      it(`${kind} saves ${receipt ? "with" : "without"} a receipt and associates the correct path`, async () => {
        const row = query({ id: `${kind}-id` });
        if (kind === "service") mocks.from.mockReturnValueOnce(query([provider]));
        mocks.from.mockReturnValueOnce(row);
        const file = receipt ? photo() : null;
        const id = kind === "service"
          ? await saveServiceExpense("owner", { ...service, file }, provider)
          : await saveGroceryExpense("owner", { ...grocery, file });
        expect(id).toBe(`${kind}-id`);
        const path = receipt ? mocks.upload.mock.calls[0][0] : null;
        expect(row.insert).toHaveBeenCalledWith(expect.objectContaining({ receipt_url: path, user_id: "owner" }));
        if (receipt) {
          expect(path).toMatch(new RegExp(`^owner/${kind === "service" ? "visits" : "groceries"}/[a-f0-9-]+\\.png$`));
          expect(mocks.upload).toHaveBeenCalledWith(path, file, { contentType: "image/png", upsert: false });
          expect(mocks.upload.mock.invocationCallOrder[0]).toBeLessThan(row.insert.mock.invocationCallOrder[0]);
        } else expect(mocks.upload).not.toHaveBeenCalled();
        if (kind === "service") expect(row.insert).toHaveBeenCalledWith(expect.objectContaining({ service_performed: "" }));
      });
    }
    it(`${kind} upload failure leaves no expense and preserves existing receipt`, async () => {
      mocks.upload.mockResolvedValue({ error: { message: "Storage rejected request" } });
      const existing = { id: "existing", receipt_url: "owner/visits/old.png", provider };
      const save = kind === "service"
        ? saveServiceExpense("owner", { ...service, file: photo() }, provider, existing)
        : saveGroceryExpense("owner", { ...grocery, file: photo() }, existing);
      await expect(save).rejects.toBeInstanceOf(ReceiptUploadError);
      expect(mocks.from).not.toHaveBeenCalled();
      expect(mocks.remove).not.toHaveBeenCalled();
    });
    it(`${kind} failed write removes only the new file, retaining old receipt`, async () => {
      mocks.from.mockReturnValue(query(null, new Error("write failed")));
      const existing = { id: "existing", receipt_url: "owner/visits/old.png", provider };
      const save = kind === "service"
        ? saveServiceExpense("owner", { ...service, file: photo() }, provider, existing)
        : saveGroceryExpense("owner", { ...grocery, file: photo() }, existing);
      await expect(save).rejects.toThrow("write failed");
      expect(mocks.remove).toHaveBeenCalledExactlyOnceWith([mocks.upload.mock.calls[0][0]]);
    });
    for (const action of ["keep", "replace", "remove"] as const) {
      it(`${kind} edits ${action} existing receipt only after successful owner-filtered write`, async () => {
        const row = query({ id: "existing" }); mocks.from.mockReturnValue(row);
        const existing = { id: "existing", receipt_url: "owner/visits/old.png", provider };
        const changes = { file: action === "replace" ? photo() : null, removeReceipt: action === "remove" };
        if (kind === "service") await saveServiceExpense("owner", { ...service, ...changes }, provider, existing);
        else await saveGroceryExpense("owner", { ...grocery, ...changes }, existing);
        expect(row.eq).toHaveBeenCalledWith("user_id", "owner");
        expect(row.eq).toHaveBeenCalledWith("id", "existing");
        const path = action === "keep" ? existing.receipt_url : action === "remove" ? null : mocks.upload.mock.calls[0][0];
        expect(row.update).toHaveBeenCalledWith(expect.objectContaining({ receipt_url: path }));
        if (action === "keep") expect(mocks.remove).not.toHaveBeenCalled();
        else {
          expect(mocks.remove).toHaveBeenCalledWith([existing.receipt_url]);
          expect(row.single.mock.invocationCallOrder[0]).toBeLessThan(mocks.remove.mock.invocationCallOrder[0]);
        }
      });
    }
  }
  it("cleans up a newly created provider when upload fails", async () => {
    const cleanup = query(null);
    mocks.from.mockReturnValueOnce(query([])).mockReturnValueOnce(query({ id: "new-provider" })).mockReturnValueOnce(cleanup);
    mocks.upload.mockResolvedValue({ error: { message: "upload failed" } });
    await expect(saveServiceExpense("owner", { ...service, file: photo() }, provider)).rejects.toBeInstanceOf(ReceiptUploadError);
    expect(cleanup.delete).toHaveBeenCalled();
    expect(cleanup.eq).toHaveBeenCalledWith("id", "new-provider");
    expect(cleanup.eq).toHaveBeenCalledWith("user_id", "owner");
  });
  for (const [ext, mime] of [["jpg", "image/jpeg"], ["jpeg", "image/jpeg"], ["png", "image/png"], ["heic", "image/heic"], ["heif", "image/heif"]]) {
    it(`supports ${ext} with missing browser MIME and unique paths`, async () => {
      const file = new File(["photo"], `Receipt with spaces.${ext}`);
      const first = await uploadReceipt("owner", file), second = await uploadReceipt("owner", file);
      expect(first).not.toBe(second);
      expect(mocks.upload).toHaveBeenCalledWith(first, file, { contentType: mime, upsert: false });
    });
  }
  it("enforces the unchanged 10 MiB upload limit", async () => {
    const file = new File([new Uint8Array(MAX_RECEIPT_BYTES + 1)], "large.png", { type: "image/png" });
    await expect(uploadReceipt("owner", file)).rejects.toBeInstanceOf(ReceiptUploadError);
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("keeps legacy stored paths accessible through a one-hour signed URL", async () => {
    mocks.signed.mockResolvedValue({ data: { signedUrl: "https://example.test/receipt" }, error: null });
    const options = receiptUrlQuery("owner/visits/legacy.jpg");
    const fn = options.queryFn;
    if (typeof fn !== "function") throw new Error("Expected receipt query");
    await fn({} as Parameters<typeof fn>[0]);
    expect(mocks.signed).toHaveBeenCalledWith("owner/visits/legacy.jpg", 3600);
  });
});