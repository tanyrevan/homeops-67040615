import { describe, expect, it } from "vitest";
import { budgetAmountSchema, budgetMonth, budgetProgress } from "@/lib/budget";

describe("budget", () => {
  it("stores month as first day", () => {
    expect(budgetMonth(new Date(2026, 9, 17))).toBe("2026-10-01");
  });
  it("under budget", () => {
    const p = budgetProgress(1000, 650);
    expect(p.remaining).toBe(350);
    expect(p.percent).toBe(65);
    expect(p.over).toBe(false);
  });
  it("exactly at budget", () => {
    const p = budgetProgress(1000, 1000);
    expect(p.percent).toBe(100);
    expect(p.remaining).toBe(0);
    expect(p.over).toBe(false);
  });
  it("over budget", () => {
    const p = budgetProgress(1000, 1150);
    expect(p.overBy).toBe(150);
    expect(p.over).toBe(true);
    expect(p.barPercent).toBe(100);
    expect(budgetProgress(1000, 1200).percent).toBe(120);
  });
  it("zero budget is safe", () => {
    expect(budgetProgress(0, 0)).toMatchObject({ percent: 0, over: false, barPercent: 0 });
    expect(budgetProgress(0, 20)).toMatchObject({ percent: null, over: true, overBy: 20 });
  });
  it("validates amount", () => {
    expect(budgetAmountSchema.safeParse("").success).toBe(false);
    expect(budgetAmountSchema.safeParse("-5").success).toBe(false);
    expect(budgetAmountSchema.safeParse("0").success).toBe(true);
    expect(budgetAmountSchema.safeParse("750.50").data).toBe(750.5);
  });
});
