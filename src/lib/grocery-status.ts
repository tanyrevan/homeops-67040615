/** User-facing grocery status. The database field stays `reimbursed`; the UI says Paid/Unpaid. */
export function groceryStatusLabel(reimbursed: boolean): "Paid" | "Unpaid" {
  return reimbursed ? "Paid" : "Unpaid";
}
