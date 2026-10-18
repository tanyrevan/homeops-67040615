# Workflow Cleanup — Grocery, Upcoming, History

Branch: `feature-workflow-cleanup` (synced branch; no commits to main).

## Request
Clean up the final grocery, Upcoming, and History workflows before the stranger test, without changing the database schema or erasing historical values.

## Changes

### 1. Grocery Category removed from the UI
- `src/components/GroceryForm.tsx`: Category select and custom-category input removed from the shared add/edit form. The form now contains: Purchase Date, Store, Amount, Reimbursed?, Notes, Receipt upload.
- `src/lib/grocery-validation.ts`: `GroceryFormValues` no longer has `categoryChoice`/`customCategory`; `validateGrocery` output no longer includes `category`. `GROCERY_CATEGORIES` and `splitCategory` removed.
- `src/routes/_authenticated/groceries.new.tsx` / `groceries.$groceryId.edit.tsx`: initial values updated; new purchases save without a category.
- `src/routes/_authenticated/groceries.$groceryId.index.tsx`: Category row removed from the detail display.
- `src/routes/_authenticated/groceries.index.tsx`: Category filter removed from the filter bar; category text removed from list cards.
- `src/lib/list-filters.ts`: `GroceryFilters.category` and the category branch of `filterGroceries` removed.
- The `grocery_expenses.category` database column is untouched; existing values remain and records load normally.

### 2. Upcoming page is scheduling-only
- `src/routes/_authenticated/upcoming.tsx`: amount and Paid/Unpaid badge removed from cards and from the query select. Cards show provider/expense type, service description, next scheduled date, and the Overdue / Due Soon / Upcoming badge, plus the link to the visit.

### 3–5. History page
- `src/routes/_authenticated/maintenance.tsx`:
  - Heading changed from "Maintenance" to "History" (metadata title updated too).
  - Empty state no longer offers a creation action ("Go to Providers" button removed); text explains completed visits appear automatically.
  - Cards no longer show "Next service" dates or DueBadge/Upcoming status; `next_service_date` removed from the query select. Cards show provider, completed date, service, amount, Paid/Unpaid, and a receipt indicator.
  - Search / Payment status / Sort / Start date / End date controls preserved.

### 6–8. Expense Type detail unchanged
- Expenses → Expense Type (e.g. Gardener) remains the action area: Upcoming Visits, Add Visit, Edit/postpone, Complete, receipt upload, amount, Paid/Unpaid, notes, next visit. History populates automatically from completed visits; no duplicate records.

## Database
No migrations, no schema changes, no records modified or deleted.

## Follow-up: History filter simplification
- Removed Search, Start date, End date, and the Sort dropdown from History.
- Filter area is now exactly: Payment status | Type | Month | Year.
- Type and Year options are derived from the signed-in user's actual completed visits (`visitFilterOptions`); Month is the 12 calendar months; all default to "All".
- Month/Year filter on `visit_date`; all four filters combine.
- History always sorts newest first (`visit_date` desc, `created_at` desc tiebreak) — no manual sort control.
- `VisitFilters` is now `{ paid, type, month, year }`; `filterVisits` always sorts date-desc.
- Cards unchanged: provider, completed date, service, amount, Paid/Unpaid, receipt indicator. No Next service, no Upcoming badge, no creation actions.
- Tests: `src/test/list-filters.test.ts` visits section rewritten — 9 tests covering default newest-first, each filter, month+year together, all four together, empty result, and derived type/year options.

## Tests
- `src/test/grocery-validation.test.ts`: rewritten — category tests replaced with "saves without a category" (asserts the validated payload has no `category` key).
- `src/test/list-filters.test.ts`: "Other category" filter test replaced with "historical category values still load and are ignored by filters".
- Full suite run with `bunx vitest run`; all tests pass (see final summary in chat).
