/** App-side ownership check (defense in depth on top of backend row security). */
export function filterOwnedRecords<T extends { user_id: string }>(rows: T[], userId: string): T[] {
  return rows.filter((r) => r.user_id === userId);
}
