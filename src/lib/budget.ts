import { z } from "zod";

/** First day of the local calendar month, "YYYY-MM-01". */
export function budgetMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export const budgetAmountSchema = z
  .string()
  .trim()
  .min(1, "Please enter a budget amount.")
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v) || /^-/.test(v), "Please enter a valid amount, like 500 or 750.50.")
  .refine((v) => !v.startsWith("-"), "Budget amount can't be negative.")
  .transform((v) => Number(v));

export type BudgetProgress = {
  budget: number;
  spent: number;
  remaining: number;
  /** True percentage used (may exceed 100); null when budget is 0 and spending > 0. */
  percent: number | null;
  /** Visual bar width 0–100. */
  barPercent: number;
  overBy: number;
  over: boolean;
};

/** Budget math in cents; budget = 0 never divides by zero. */
export function budgetProgress(budget: number, spent: number): BudgetProgress {
  const b = Math.round(budget * 100);
  const s = Math.round(spent * 100);
  const remainingC = b - s;
  let percent: number | null;
  if (b === 0) percent = s === 0 ? 0 : null;
  else percent = Math.round((s / b) * 100);
  const barPercent = b === 0 ? (s > 0 ? 100 : 0) : Math.min(100, (s / b) * 100);
  return {
    budget: b / 100,
    spent: s / 100,
    remaining: remainingC / 100,
    percent,
    barPercent,
    overBy: remainingC < 0 ? -remainingC / 100 : 0,
    over: remainingC < 0,
  };
}
