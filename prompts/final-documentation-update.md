Update the final HomeOps project documentation so it accurately reflects the app that is now shipped.

IMPORTANT
- Work through the currently synced GitHub branch: `docs-final-update`.
- Do not change application code, database behavior, routes, styling, authentication, or tests.
- This is documentation only.
- Do NOT rewrite PLAN.md Sections 1–7.
- Only update Section 8: Plan vs. Reality.
- Inspect the current final implementation before documenting anything.
- Save this prompt in:
  `prompts/final-documentation-update.md`

==================================================
1. UPDATE README.md
==================================================

Update README.md so it describes the FINAL HomeOps app rather than earlier versions.

Keep the live URL:

https://olive16.lovable.app

The README should explain that HomeOps is a household expense and operations tracker.

Accurately describe the final user-facing structure:

TOP NAVIGATION
- Dashboard
- Expenses
- Settings/gear menu with Log Out

DASHBOARD
- Total Spend with:
  - This Month
  - Last 3 Months
  - All Time
- Total Amount Due
- Summary table:
  - Category
  - Amount Due
  - Last Visit
  - Next Visit
- Household Spending (Last 3 Months) stacked chart
- distinct chart colors by expense type

EXPENSES
- Main ledger for all grocery and service/maintenance expenses
- Add Expense
- Grocery and service expenses remain stored in separate underlying tables
- Upcoming section:
  - future-dated expenses
  - soonest first
  - shows date, expense type, and amount
- History section:
  - today/past expenses
  - newest first
  - Paid / Unpaid status
  - Mark Paid on unpaid records
- compact Filter control:
  - Status
  - Type
  - Month
  - Year
- transaction cards open their own detail pages
- detail pages use Expense Type as the main heading
- provider/store information appears as labeled detail fields
- Edit/Delete are in a low-profile three-dot menu
- legacy Groceries/provider pages are no longer part of the normal user flow

PAID / UNPAID
- Service visits use the existing `paid` field
- Grocery purchases use the existing `reimbursed` field internally but display Paid / Unpaid to users
- Paid is shown in green and Unpaid in red
- Mark Paid updates the appropriate existing field and does not delete the record

UPCOMING / HISTORY MODEL
- `next_service_date` remains in the database for backward compatibility but is no longer the user-facing scheduling model
- future-dated purchase_date / visit_date records are Upcoming
- today/past records are History
- Upcoming and History now live inside Expenses rather than separate top-level pages

STARS
- Keep an accurate description of the stars functionality
- Service providers can still be starred
- starred service providers remain accessible through the low-profile Expenses options menu
- do not claim grocery transactions can be starred

RECEIPTS
- Grocery and maintenance/service records can still have receipt uploads

THEME
- Final visual style is classic black / white / ivory with restrained styling
- chart categories retain distinct colors

TECHNOLOGIES
Inspect package.json and describe the technologies actually used.
Keep Lovable Cloud, GitHub, React/TypeScript/etc. accurate.

RUNNING LOCALLY
Keep accurate local setup and test instructions based on package.json.

TESTS
Describe the current test setup accurately.
Do not hard-code an outdated test count unless you verify the current count first.

==================================================
2. UPDATE PLAN.md — SECTION 8 ONLY
==================================================

Do NOT change Sections 1–7.

Update only:

## 8. Plan vs. Reality

Make this table reflect the actual FINAL product.

Keep it concise and honest.

Important differences to capture include:

AUTH / DATA ISOLATION
- Shipped as planned.

MAINTENANCE + GROCERIES
- Originally separate workflows/pages.
- Final app consolidated them into one Expenses ledger while preserving separate database tables.

CRUD
- Shipped.
- Users add individual expense records, open details, edit, and delete with confirmation.

VALIDATION
- Shipped.

STARS
- Shipped but evolved into a low-profile starred-service-provider function rather than a major Expenses filter.

SEARCH / FILTER / SORT
- Changed.
- Final Expenses UI uses compact Status / Type / Month / Year filtering.
- Records are automatically ordered by actual expense date rather than using a visible Sort dropdown.

DASHBOARD
- Changed substantially.
- Final Dashboard shows Total Spend with period selector, Total Amount Due, Summary table, and a three-month stacked spending chart.

GROCERY RECEIPTS
- Shipped.
- Receipt support was also extended to service/maintenance expenses.

UPCOMING / DUE MAINTENANCE
- Changed significantly.
- The final model no longer uses next_service_date in the UI.
- Future-dated expenses are Upcoming; today/past expenses are History.
- Both live directly inside Expenses.

MONTHLY GROCERY BUDGET
- Cut from the final user-facing product.
- Budget database/history was preserved but the feature was removed from the UI during simplification.

PAYMENT / REIMBURSEMENT
- Added beyond the original plan.
- Final UI standardizes everything as Paid / Unpaid.
- Users can Mark Paid directly from History.
- Grocery still uses the existing reimbursement field internally.

NAVIGATION
- Changed substantially.
- Final top-level navigation is Dashboard / Expenses / gear menu.
- Several separate pages were consolidated into Expenses.

PROVIDER DETAIL PAGE
- Retired from normal user flow.
- Provider records remain in the database.

TECHNOLOGY
- Planned Supabase directly.
- Final app uses Lovable Cloud for auth/database/storage.

DESIGN
- Changed to a classic black / white / ivory style.

SHARED HOUSEHOLD ACCESS
- Still out of scope / backlogged.
- Stranger testing identified household sharing and role-based permissions as useful future functionality.

STRANGER TEST FIX
- Add a row explaining:
  - tester found expense detail hierarchy inconsistent
  - final fix standardized every detail page so Expense Type is the main heading, with Provider/Store and Service Performed in labeled fields
  - this was fixed through the stranger-test PR

TESTS
- Both required tests shipped with red/green evidence.
- Final project also has a broader automated test suite.

Keep the table concise enough to be useful for the reflection.

==================================================
3. REVIEW schema.md
==================================================

Inspect the current final database and compare it with schema.md.

Because recent work intentionally avoided schema migrations, schema.md should probably require little or no change.

Only update schema.md if something is factually inaccurate.

IMPORTANT:
- Do not remove `category`, `next_service_date`, `budgets`, or other existing database fields/tables just because they are no longer prominent in the UI.
- schema.md should describe the actual database, not only the visible UI.

==================================================
4. PROMPT LOG
==================================================

Create:

`prompts/final-documentation-update.md`

Record the important instructions used for this final documentation update.

==================================================
5. FINAL CHECK
==================================================

Confirm:
- README describes the actual final product.
- Live URL is correct.
- README no longer describes obsolete standalone Groceries / provider / Amount Due / Upcoming / History navigation.
- PLAN.md Sections 1–7 are completely unchanged.
- Plan vs. Reality reflects the final shipped app honestly.
- Monthly grocery budget is recorded as cut from the final UI.
- Upcoming/History final date-based model is documented.
- Stranger-test fix is documented.
- schema.md still accurately reflects the real database.
- prompt log exists.
- no application code was changed.

Stop after documentation is complete and summarize which documentation files changed.