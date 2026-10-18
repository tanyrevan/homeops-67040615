import { describe, expect, it } from "vitest";
import { settleTable, settleUpdate } from "@/lib/settle";

describe("Mark Paid settlement", () => {
  it("maintenance Mark Paid updates paid = true", () => expect(settleUpdate("visit")).toEqual({ paid: true }));
  it("grocery Mark Paid updates reimbursed = true", () => expect(settleUpdate("grocery")).toEqual({ reimbursed: true }));
  it("targets the existing tables without deleting records", () => {
    expect(settleTable("visit")).toBe("maintenance_visits");
    expect(settleTable("grocery")).toBe("grocery_expenses");
  });
});
