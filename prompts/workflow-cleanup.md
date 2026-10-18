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

## Follow-up: actual-date ordering, Paid/Unpaid filters, Upcoming amounts, Air Conditioner

- Combined ledger mapping now sorts by actual `purchase_date` / `visit_date` descending, `created_at` descending for equal dates, and a deterministic kind/id fallback for exact ties. The shared filter applies the same ordering; input and insertion order cannot override expense dates.
- Compact Expenses Status options display All / Unpaid / Paid. Internal filter keys and grocery `reimbursed` remain unchanged; false flags are Unpaid, true flags are Paid.
- Upcoming still includes only dates after the local calendar date, sorted soonest first. Cards now show Date, Expense Type, and Amount, with no payment badge, and open the actual transaction.
- `expenseTypeLabel` maps only the exact legacy `A/C` type to `Air Conditioner`. Ledger/History/Upcoming/Type filter models, Amount Due, Dashboard Summary/chart series, starred providers, and Add Expense/provider-form selectors use the mapping. Stored selector values and existing records remain unchanged; canonical and legacy Dashboard categories group together.
- Added ten regression tests covering mixed-table actual-date ordering, insertion independence, equal-date ties, both payment booleans, future dates/amounts, exact legacy mapping and unchanged inputs, plus Dashboard category/chart grouping. Full suite: 101 tests across 15 files passed.
- Signed-in read-only checks verified actual ledger order, All / Unpaid / Paid options and filtering (two records each), Air Conditioner Type/Add Expense labels, real Upcoming amount with no status, transaction opening, Dashboard/History/Amount Due terminology, and mobile Upcoming layout. No runtime errors; no records modified; no database/schema changes.
- No branch creation or switch performed; Lovable's internal edit workspace remains in use for the existing workflow-cleanup work.

## Follow-up: final Aircon terminology

- Changed the shared expense-type display mapping from Air Conditioner to Aircon throughout selectors/forms, Expenses, Type filters, Upcoming, History, Dashboard Summary/chart legends, Amount Due, and all other mapped type labels.
- Both exact stored `A/C` and `Air Conditioner` values display as `Aircon`; stored values, existing records, database schema, and validation-compatible selector values remain unchanged. No migration.
- Updated mapping and Dashboard grouping regression expectations. Full suite: 101 tests passed across 15 files; automatic build OK. Signed-in checks confirmed Aircon in Type filters, Add Expense, Upcoming, Dashboard, History, and Amount Due; transaction opening and existing sorting/status behavior preserved. No runtime errors or records modified.

## Follow-up: blank Name placeholder in the service/provider creation flow

- Removed the `e.g. Maria's Gardening` example placeholder from the Name input in `src/components/ProviderForm.tsx`, so the field renders blank when empty. This is the only place that exact example appeared; the same form is used by both Add Expense → new service provider and provider edit, so the cleanup covers the whole service/provider creation flow.
- The `Name *` label, required validation, saved values, and all database logic are unchanged; other optional/example hints in unrelated forms were left as they were.


## Follow-up: central Expenses workspace and final navigation

- Navigation is Dashboard | Expenses | Log Out; /attention, /upcoming and /maintenance remain as redirects to /providers. No branch creation or switching.
- Expenses shows exactly Upcoming Expenses first (future actual dates, soonest first, no settlement display) and History second (today/past, newest expense date first). Both show date, type, amount and optional receipts, not provider/store names; cards open transaction details. Empty sections remain visible.
- The compact Filter keeps All / Unpaid / Paid, Type, Month, Year and Clear filters. Status applies only to History; Type/Month/Year and starred-provider scoping apply to both. Add Expense and the low-profile starred-provider menu remain.
- Unpaid History cards offer Mark Paid, updating maintenance paid=true or grocery reimbursed=true, immediately updating the cached status and invalidating queries to refresh Dashboard due; paid cards have no button. Failure preserves the unpaid item and offers retry.
- Shared Paid badges use restrained green tokens, Unpaid stays red; the ivory/black theme and chart remain unchanged. Dashboard keeps Total Amount Due without a View link.
- No schema changes, migrations, or changes to authentication, isolation, receipt storage, stars, existing CRUD or stored types.
- Verification: 112 tests across 15 files passed, including new section/filter and legacy redirect regressions; automatic build OK. Signed-in checks confirmed navigation, section order, redirects, future amounts without status, filtering, and both grocery and maintenance Mark Paid persisted through transaction details and refreshed Dashboard due. Only two temporary test transactions were created and removed; pre-existing records were preserved. Desktop/mobile checks showed no horizontal overflow or runtime errors.

## Follow-up: compact navigation controls and Settings menu

- Dashboard and Expenses use compact bordered navigation buttons: inactive ivory with dark text and hover feedback; active charcoal with light text and an accessible current-page indicator. The navigation controls stay together on narrow screens.
- Replaced the standalone Log Out button with a labeled Settings gear and a keyboard-accessible dropdown containing Log Out, using the unchanged existing sign-out action. The menu closes after selection or Escape.
- Renamed the Expenses section heading to Upcoming; History and all date, sorting, settlement and filter logic remain unchanged.
- No database, authentication, business-logic, records or branch changes.
- Verification: all 112 tests across 15 files passed; automatic build OK. Signed-in checks confirmed selected Dashboard/Expenses states, Upcoming/History headings, gear menu keyboard opening, Escape dismissal and focus return, and successful Log Out to /auth. Navigation controls stayed together at 390px and 320px with no horizontal overflow or runtime errors. No records modified.
Make one final improvement to the Expenses starring workflow.

The current provider-level starred workflow is no longer intuitive in the final
unified Expenses design. Change starring so users star INDIVIDUAL EXPENSE
LINE ITEMS instead.

IMPORTANT
- Stay on the current branch.
- Preserve all existing expense records.
- Preserve authentication and user data isolation.
- Do not make unrelated UI changes.
- Append this follow-up to the current prompt log.
- Run the complete automated test suite and build afterward.

==================================================
1. STAR INDIVIDUAL EXPENSES
==================================================

Every expense card in BOTH sections should have a star control:

- Upcoming
- History

Use:

☆ = not starred
★ = starred

Place the star on the right side of the expense card near the amount/status,
without making the layout cluttered.

The star belongs to the individual transaction, NOT the provider.

Examples:

A user may star:
- one specific Grocery purchase
- one specific Gardener visit
- one specific Jacuzzi visit
- one future Aircon expense

Starring one Gardener expense must NOT automatically star every Gardener
expense from the same provider.

==================================================
2. INTERACTION
==================================================

Clicking an empty star should immediately star that expense.

Clicking a filled star should immediately unstar it.

The state must persist across:
- page refresh
- logout/login
- navigation between Dashboard and Expenses

IMPORTANT:
Clicking the star must NOT trigger the surrounding expense-card navigation.
The user should remain on the Expenses page.

The rest of the expense card should continue opening the transaction detail.

==================================================
3. STARRED FILTER
==================================================

Remove the current three-dot button beside Add Expense.

That menu currently exists mainly to expose "Starred service providers".
Remove that provider-level starred UI from the normal workflow.

Instead, place a clear secondary button beside the existing Filter button:

☆ Starred

Clicking it should show ONLY starred individual expense records.

When the Starred filter is active:
- show starred Upcoming expenses in Upcoming
- show starred past/today expenses in History
- preserve the existing date ordering inside each section

Use an active visual state so it is obvious when Starred filtering is enabled.

Clicking Starred again should return to all expenses.

The existing Filter button and filters should continue working.

If Starred and another filter are active at the same time, apply both filters.

==================================================
4. DATABASE / PERSISTENCE
==================================================

Inspect the current stars implementation before changing anything.

The final behavior must persist stars at the individual expense-record level
for BOTH:
- maintenance/service visits
- grocery expenses

Do not use localStorage as the source of truth.

Use a proper user-owned database relationship so each user can only see and
modify their own stars.

Because Grocery and maintenance records live in different underlying tables,
choose the simplest safe relational implementation.

If the existing provider-level stars table cannot correctly represent
individual grocery and maintenance transactions, do not force it.

It is acceptable to introduce a small expense-star junction structure if
needed, but:
- preserve existing data
- preserve current tables
- enforce user ownership/data isolation
- avoid unrelated schema changes

==================================================
5. REMOVE OLD PROVIDER STAR UX
==================================================

The final Expenses page should no longer have:

- three-dot menu beside Add Expense
- "Starred service providers" menu item
- provider-level starring as the primary user-facing star workflow

Do not delete provider records.

Do not restore the old provider directory.

==================================================
6. CARD LAYOUT
==================================================

Keep the current clean Expenses card design.

History should still show:
- date
- expense type
- amount
- Paid / Unpaid
- Mark Paid where applicable

Upcoming should still show:
- date
- expense type
- amount

Add the star without replacing any of those fields.

Do not display provider/company/store names on the top-level expense cards.

==================================================
7. TESTING
==================================================

Add/update tests covering at minimum:

- every expense card exposes a star control
- maintenance expense can be starred/unstarred
- grocery expense can be starred/unstarred
- one expense being starred does not star another expense from the same provider
- starred state persists
- clicking star does not open detail page
- Starred button filters to starred expenses only
- Starred filter works for both Upcoming and History
- Starred can combine with existing filters
- removing a star while Starred filter is active removes that item from the visible list
- users cannot access another user's stars
- existing required data-isolation test still passes
- existing Dashboard test still passes

Run the full automated test suite and build.

When finished, summarize:
1. UI changes
2. how individual expense stars are stored
3. whether any database migration was required
4. tests added/updated
5. full test-suite result
6. build result

## Individual expense stars — verification
- Added public.expense_stars (one visit_id or grocery_id, unique per owner/transaction, owner-only SELECT/INSERT/DELETE policies and foreign-key cleanup). Legacy provider stars and existing expense records preserved.
- Replaced provider-star menu with per-card stars and a combined Starred toggle beside Filter; optimistic updates roll back on failure.
- Added 15 tests for persistence calls, transaction independence, owner-scoped queries/deletes, both sections and combined filters, unstar removal, card click separation and database policy/constraint contracts. Full suite: 139 tests across 20 files passed; automatic build OK.
- Signed-in browser verified both kinds, refresh and Dashboard navigation persistence, sibling independence, combined filters, immediate removal, card navigation and narrow-screen layout. Backend rejected spoofed-owner insertion. Logout/login and full two-user backend checks were not exercised; policy contracts were inspected and tested. All temporary QA records removed.
Make a small visual cleanup to the new expense-star UI. Do not change any
database behavior or starring logic.

Stay on the current branch and append this follow-up to the existing prompt log.

==================================================
1. ALIGN HISTORY CARD ACTIONS
==================================================

The current Unpaid card looks inconsistent because the Mark Paid button creates
an awkward vertical stack.

For History cards:

- Keep the amount at the top-right.
- Under the amount, show payment controls on ONE horizontal row.

For an unpaid item:

Unpaid   Mark Paid

For a paid item:

✓ Paid

Do not place Mark Paid on a separate third row.

The goal is for paid and unpaid History cards to have roughly the same height
and visual alignment.

Keep Mark Paid functional exactly as it is now.

==================================================
2. CENTER STAR VERTICALLY
==================================================

On every Upcoming and History expense card:

- Keep the star at the far right edge.
- Vertically center the star within the entire card.
- Do not align it to the amount or payment-status row.
- Give it enough spacing so it does not feel cramped against the right border.

The star should remain:

☆ unstarred
★ starred

Clicking it must still not navigate into the expense detail page.

==================================================
3. CLEAN UP TOP STARRED BUTTON
==================================================

The Starred button beside Filter currently looks gray and visually inconsistent.

Change it so:

- background is white / the same neutral background as the Filter button
- border matches the Filter button
- text color matches Filter
- no gray filled appearance when inactive
- use the SAME star icon style and apparent size as the line-item stars

Inactive:

☆ Starred

When Starred filtering is active, use a subtle active state that fits the
existing black / white / ivory design. Do not use a heavy gray fill.

Filter and Starred should look like matching secondary controls.

==================================================
4. PRESERVE EVERYTHING ELSE
==================================================

Do not change:
- star persistence
- new expense-star database structure
- filters
- expense ordering
- card navigation
- Upcoming/History logic
- Paid/Unpaid behavior
- Mark Paid behavior
- Dashboard
- existing records

Run the full test suite and build afterward.

When finished, summarize:
1. layout changes
2. test result
3. build result

## Expense-star visual cleanup — verification
- History amount sits above one payment row; paid and unpaid cards retain equal heights. Card stars are centered vertically with right-side spacing. Starred matches Filter and uses matching star glyphs with a subtle active outline.
- Signed-in checks verified payment alignment, equal card heights, Mark Paid readback, star persistence, combined filtering, independent transaction navigation and mobile rendering. Temporary QA records removed. No database or starring logic changes.
- Full suite: 140 tests across 20 files passed. Automatic build: OK.
