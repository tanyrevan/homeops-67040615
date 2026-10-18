import { describe, expect, it } from "vitest";
import { validateReceipt, validateVisit } from "@/lib/visit-validation";

const base = { visitDate: "2026-10-01", service: "Pool cleaning", amount: "", notes: "", paid: false };

describe("visit validation", () => {
  it("requires a visit date", () => {
    const r = validateVisit({ ...base, visitDate: "" });
    expect(!r.ok && r.errors.visitDate).toBeTruthy();
  });
  it("requires service performed", () => {
    const r = validateVisit({ ...base, service: "  " });
    expect(!r.ok && r.errors.service).toBeTruthy();
  });
  it("rejects a negative amount", () => {
    const r = validateVisit({ ...base, amount: "-1" });
    expect(!r.ok && r.errors.amount).toBeTruthy();
  });
  it("accepts zero and blank amounts", () => {
    const zero = validateVisit({ ...base, amount: "0" });
    expect(zero.ok && zero.data.amount_paid).toBe(0);
    const blank = validateVisit(base);
    expect(blank.ok && blank.data.amount_paid).toBeNull();
  });
  it("accepts image receipts and rejects other files", () => {
    expect(validateReceipt({ name: "r.jpg", size: 1000, type: "image/jpeg" })).toBeNull();
    expect(validateReceipt({ name: "r.HEIC", size: 1000, type: "" })).toBeNull();
    expect(validateReceipt({ name: "r.pdf", size: 1000, type: "application/pdf" })).not.toBeNull();
  });
});

describe("payment status", () => {
  it("keeps the amount and saves Unpaid by default, independent of amount", () => {
    const r = validateVisit({ ...base, amount: "200", paid: false });
    expect(r.ok && r.data.paid).toBe(false);
    expect(r.ok && r.data.amount_paid).toBe(200);
  });
  it("saves Paid when chosen", () => {
    const r = validateVisit({ ...base, paid: true });
    expect(r.ok && r.data.paid).toBe(true);
  });
});
