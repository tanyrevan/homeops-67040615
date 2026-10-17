# Dashboard monthly grocery total — test evidence

## 1. The test in plain English

The test (`src/test/dashboard-grocery-total.test.ts`, "Dashboard monthly
grocery total") checks that the Dashboard's grocery total for the current
calendar month equals the sum of the grocery purchases dated in that month.
It uses three fixed sample purchases: $100.25 and $45.25 in the current month
(expected total $145.50), and $300.00 in a different month, which must not be
counted. The calculation must use each purchase's `purchase_date` (not
`created_at`), and whether a purchase has been reimbursed must not change the
total. The test calls the same `monthSummary` helper the Dashboard uses, with
no real user accounts or live data.

## 2. Red result

In `src/lib/dashboard-stats.ts`, the line that keeps only the current month's
purchases was temporarily replaced so the calculation included **all**
purchases regardless of month:

```ts
const g = groceries; // TEMPORARILY BROKEN for red-test evidence: includes all months
```

The test then failed as expected: it received `445.5` (100.25 + 45.25 + 300.00)
instead of `145.5`, proving the test catches a calculation that wrongly
includes purchases from another month. No database or security configuration
was changed.

## 3. Green result

_To be filled in after the correct calculation is restored: the same test is
expected to pass with the current-month filter back in place, and the full
test suite should pass._

## 4. What would break this test

Changing the Dashboard calculation to include purchases from another month
would make this test fail.
