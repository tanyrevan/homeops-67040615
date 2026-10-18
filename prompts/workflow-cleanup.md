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

## Follow-up: History includes groceries + monochrome theme + expense-type overflow menu
- History now combines completed maintenance visits and grocery purchases for display (tables stay separate). `HistoryItem`/`HistoryFilters`/`filterHistory`/`historyFilterOptions` in `src/lib/list-filters.ts` replace the visit-only filter; `src/routes/_authenticated/maintenance.tsx` queries both tables and maps them to history items.
- Type dropdown includes "Grocery" whenever grocery records exist, plus the actual service types. Grocery cards show store, purchase date, "Grocery", amount, Reimbursed/Not Reimbursed; visit cards keep Paid/Unpaid. No next-service or Upcoming info. Newest first (record date desc, created_at desc).
- "Payment status" is now "Status" with All / Outstanding (unpaid visits + unreimbursed groceries) / Settled (paid + reimbursed). Works with Type, Month, Year.
- Theme: `src/styles.css` `:root` replaced with a black-and-white colonial-inspired palette — warm ivory background, white cards, charcoal text, muted gray secondary text, gray borders, black primary buttons with white text, grayscale chart tokens, smaller radius. Serif heading font (Libre Baskerville via Google Fonts link in `src/routes/__root.tsx`; `h1–h3` rule in styles.css). Red kept only for errors/overdue/unpaid. No calculation or functionality changes.
- Expense Type detail (`providers.$id.index.tsx`): large Edit/Delete buttons and the star icon removed; a small "..." overflow menu (top-right) holds "Edit expense type" and a destructive "Delete expense type" with the existing confirmation dialog. Starring remains on the Expenses directory cards only. Edit page relabeled "Edit Expense Type".
- Tests: history section of `src/test/list-filters.test.ts` rewritten — 10 tests covering newest-first across both kinds, Grocery in type options, Grocery-only filtering, maintenance type filtering, Outstanding/Settled definitions, month/year on both record dates, all four filters together, empty result.

## Tests
- `src/test/grocery-validation.test.ts`: rewritten — category tests replaced with "saves without a category" (asserts the validated payload has no `category` key).
- `src/test/list-filters.test.ts`: "Other category" filter test replaced with "historical category values still load and are ignored by filters".
- Full suite run with `bunx vitest run`; all tests pass (see final summary in chat).

## Follow-up: Dashboard/Amount Due/chart refinements + grocery Paid/Unpaid wording
- Dashboard: section heading is now "Summary"; table columns are Category | Amount Due | Last Visit | Next Visit (month abbreviation and current-month Total column removed); "View" link beside Total Amount Due removed; chart title "Household Spending (Last 3 Months)"; calculations unchanged.
- Chart: `--chart-1..8` tokens in `src/styles.css` changed from grayscale to distinct muted colors (green, terracotta, slate blue, ochre, plum, teal, olive, rust) compatible with the ivory theme; axis logic unchanged.
- Grocery status: user-facing wording is Paid / Unpaid everywhere (form label "Paid?", list filter "Status", detail "Status", History badges, Amount Due). The `reimbursed` database field is unchanged internally; `groceryStatusLabel` in `src/lib/grocery-status.ts` documents the mapping.
- Amount Due: sections renamed "Unpaid Maintenance" / "Unpaid Groceries"; every outstanding item has a compact "Mark Paid" button that updates `paid = true` (visits) or `reimbursed = true` (groceries) via `settleUpdate`/`settleTable` in `src/lib/settle.ts`, disables while saving, invalidates all queries (Dashboard totals refresh), and never deletes records.
- Tests: new `src/test/grocery-status.test.ts` (Paid/Unpaid mapping, no reimbursement wording) and `src/test/settle.test.ts` (settle payloads and tables).
- No database/schema changes; no records deleted.

## Follow-up: Expenses becomes the unified transaction ledger
- Expenses (`providers.index.tsx`) is now the transaction ledger: it combines grocery_expenses and completed maintenance_visits for display only (tables stay separate), sorted newest first by purchase_date/visit_date. Cards show date, type · provider/store, service, amount, Paid/Unpaid, receipt indicator, and link to the record detail.
- Filters moved from History into Expenses: Status (All/Outstanding/Settled) | Type (Grocery + real service types) | Month | Year, all combining; no manual Sort control.
- "Add Expense Type" renamed "Add Expense" (`providers.new.tsx`): choose Expense Type (Grocery, preset service types, custom types already in use). Grocery → existing grocery workflow (grocery_expenses). Service type → choose an existing matching provider (then the existing visit form: date, service, amount, Paid?, notes, receipt, next visit) or create a new provider first. Visits save to maintenance_visits; no unified expenses table.
- Expense-type directory UI removed from the main page; starring preserved low-profile via the "..." menu → "Starred service providers" panel (links to provider detail pages). Individual grocery transactions are not star-able.
- Amount Due (`attention.tsx`) is now one "Outstanding Expenses" list, newest first, combining unpaid visits and groceries; each row shows date, type, provider/store, amount, Unpaid badge, and Mark Paid (visits → paid = true, groceries → reimbursed = true internally; no reimbursement wording). Settled items disappear immediately and all queries refresh (Dashboard totals, Expenses statuses). Records are never deleted.
- Top navigation is now Dashboard | Expenses | Amount Due | Upcoming | Log Out; History removed from the nav. The /maintenance route still exists internally; no historical records deleted.
- Upcoming unchanged (scheduling-only).
- No database/schema changes.

## Follow-up: final structural simplification (transaction-centric ledger)

- Top nav: Dashboard | Expenses | Amount Due | Upcoming | History | Log Out (History restored).
- Expenses = master ledger of every line item (past, today, future), newest first; cards show only Date, Expense Type, Amount, Paid/Unpaid, receipt indicator, plus a subtle "Upcoming" badge on future-dated items. No provider/store names on cards; cards open the transaction detail directly.
- The four always-visible filter dropdowns collapsed into one compact Filter button (popover with Status | Type | Month | Year | Clear filters, active-count badge) on both Expenses and History.
- Upcoming redefined: future-dated expenses (visit_date/purchase_date > today), soonest first, scheduling-only cards (Date + Type). next_service_date retired from the UI; the column and historical values remain untouched.
- History = expenses dated today or earlier, newest first, no creation actions.
- Maintenance transaction detail: Next Service Date, Add Visit, Upcoming Visits, and History sections removed; back link is "Back to Expenses"; Edit/Delete live in a low-profile "..." menu (delete keeps its confirmation).
- Legacy provider-detail route (/providers/$id) now redirects to Expenses; provider records and the service_providers table are untouched. Starred providers in the Expenses "..." menu filter the ledger by provider instead of linking to the retired page.
- Add/Edit Expense no longer shows or writes Next Service Date; new scheduling = future-dated expense line items.
- Dashboard Last Visit = latest visit_date <= today; Next Visit = earliest visit_date > today; Groceries stay "—".
- Amount Due unchanged: one combined Outstanding Expenses list with Mark Paid.
- No database/schema changes. Tests updated (household-stats Last/Next Visit rules, visit-validation without nextDate, new ledger-dates tests); scheduled-visit and due-status tests removed with the retired model.

## Follow-up: retire legacy Grocery navigation

- Grocery transaction detail and add-form back links now say "Back to Expenses" and open the unified Expenses ledger at `/providers`.
- Adding a grocery purchase returns to Expenses after save or cancel. Editing keeps save/cancel on the current transaction detail; deleting returns to Expenses.
- The published `/groceries` URL is preserved as a redirect to `/providers`; its standalone list and filter controls are retired. Individual grocery detail/edit URLs and Add Expense → Grocery are preserved.
- Grocery CRUD, receipt storage, existing records, database schema, and security rules are unchanged.
- Added a routing regression test for the legacy list redirect. Full automated suite: 91 tests passed across 15 files; build OK. Signed-in checks verified the redirect, Add Expense → Grocery, add back/cancel/save, detail back, edit cancel/save with saved notes, and delete returning to Expenses. Only a temporary test purchase was created/edited/deleted; existing records were preserved and an existing purchase detail was checked without editing. No browser console errors.
