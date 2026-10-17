# Prompt log: Dashboard monthly grocery total test

## Task
Add ONLY the second required automated test for HomeOps: the Dashboard monthly
grocery total calculation, on the `test-dashboard-total` branch.

## Key instructions
- Do not modify PLAN.md; do not build new product features; use the existing
  test framework (Vitest).
- Reuse the existing dashboard calculation helper (`monthSummary` in
  `src/lib/dashboard-stats.ts`) rather than duplicating logic.
- Test: given several grocery purchases in the current calendar month, the
  Dashboard's monthly grocery total equals their sum.
- Deterministic sample data: $100.25 + $45.25 this month = $145.50; a $300.00
  purchase in another month must be excluded.
- The calculation must use `purchase_date`, not `created_at`.
- Reimbursement status must not affect the total.
- Red → green evidence required:
  1. Green baseline: run only this test with the correct implementation; show
     full passing output.
  2. Temporary red: temporarily break ONLY the grocery-total calculation in a
     safe, reversible way (e.g. include another month's purchase); run the same
     test; show full failing output; STOP and wait — do not restore until told.
- Do not leave the broken implementation in the final code.
- Documentation: `tests/dashboard-total-evidence.md` (plain-English test
  description, red result, green result placeholder, what would break the
  test).
- Final committed state must have all tests passing.
