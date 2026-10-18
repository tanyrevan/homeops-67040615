/** Update payload for settling an outstanding item. Records are never deleted. */
export function settleUpdate(kind: "visit" | "grocery"): { paid: true } | { reimbursed: true } {
  return kind === "visit" ? { paid: true } : { reimbursed: true };
}

export const settleTable = (kind: "visit" | "grocery") => (kind === "visit" ? "maintenance_visits" : "grocery_expenses");
