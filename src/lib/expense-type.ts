/** Display legacy service types without changing their stored representation. */
export function expenseTypeLabel(type: string): string {
  return type === "A/C" ? "Air Conditioner" : type;
}