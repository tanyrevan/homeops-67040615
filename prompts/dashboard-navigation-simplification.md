Simplify the HomeOps Dashboard and navigation while preserving all existing core functionality.

IMPORTANT
- Work on the currently synced GitHub branch:
  `feature-dashboard-navigation-simplification`
- Do not commit directly to main.
- Do not delete or redesign the database schema.
- Do NOT delete the budgets table, migrations, or historical budget data.
- Do not remove CRUD, stars, search/filter/sort, receipts, payment/reimbursement status, Upcoming maintenance, or data-isolation security.
- Reuse existing production data and calculation helpers where practical.
- Keep the app responsive on desktop and mobile.
- Save the important prompt/instructions for this feature in:
  `prompts/dashboard-navigation-simplification.md`
- Run the existing automated test suite after the changes and fix any regressions caused by this work.
- Do not update PLAN.md, README.md, or schema.md yet. I will update documentation separately after final testing.

==================================================
1. SIMPLIFY THE DASHBOARD
==================================================

The Dashboard currently feels too grocery-focused and has too many separate sections.

Remove from the visible Dashboard:
- the existing three large monthly statistic cards
- the Monthly Grocery Budget section
- the Grocery Spending — Last 6 Months chart

Do NOT delete budget data, database tables, or migrations. Only remove/hide the budget feature from the user-facing Dashboard.

Replace the current Dashboard with:

A. TWO COMPACT OVERALL SUMMARY STATS
B. CATEGORY SUMMARY TABLE
C. THREE-MONTH STACKED HOUSEHOLD SPENDING CHART

--------------------------------------------------
A. TWO COMPACT OVERALL SUMMARY STATS
--------------------------------------------------

At the top of the Dashboard show two compact summary figures:

1. Total Recorded Spend
2. Total Amount Due

TOTAL RECORDED SPEND

Calculate:

- ALL grocery expense amounts belonging to the signed-in user
PLUS
- ALL maintenance visit amounts belonging to the signed-in user

Rules:
- A maintenance visit with no amount counts as $0.
- Paid/unpaid status does not change Total Recorded Spend.
- Reimbursed/not reimbursed status does not change Total Recorded Spend.

TOTAL AMOUNT DUE

Calculate:

- grocery expenses where reimbursed = false
PLUS
- maintenance visits where paid = false

Rules:
- Blank maintenance amounts count as $0.

Add a small link/button next to Total Amount Due:

"View Needs Attention"

This should link to the existing `/attention` page.

Keep these summary figures visually compact rather than using the current oversized cards.

--------------------------------------------------
B. CATEGORY SUMMARY TABLE
--------------------------------------------------

Below the overall summary figures, add a clean responsive table.

Columns:

Category | Total Amount | Amount Due | Last Activity | Next Visit

ROWS

The rows should consist of:

- Groceries
- Each distinct maintenance service category actually used by this account

CATEGORY RULES

- Groceries should always appear first.
- Do not display a row whose actual saved category/service type is literally "Other".
- If the user selected Other but saved a custom service type such as "Plumber", show "Plumber".
- Do not hard-code only Gardener, Jacuzzi, A/C, Electrician, etc.
- Custom service types must work automatically.
- Sort maintenance categories alphabetically after Groceries.

GROCERIES ROW

Total Amount:
- Sum all grocery expense amounts for the account.

Amount Due:
- Sum grocery expenses where reimbursed = false.

Last Activity:
- Most recent purchase_date.
- Show "—" if there are no grocery purchases.

Next Visit:
- Always "—".

MAINTENANCE CATEGORY ROWS

Use the service category associated with the maintenance provider / visit according to the existing data model.

Total Amount:
- Sum all maintenance amounts in that category.
- Missing amounts count as $0.

Amount Due:
- Sum amounts for visits in that category where paid = false.
- Missing amounts count as $0.

Last Activity:
- Most recent visit_date for that category.
- Show "—" if none exists.

Next Visit:
- Look at the most recent maintenance visit for that category.
- Display that visit's next_service_date.
- If the most recent visit has no next_service_date, show "—".
- If the displayed next date is already past, clearly show that it is overdue while still displaying the date.

Use clear user-friendly date formatting.

On mobile, allow horizontal scrolling or another clean responsive approach instead of wrapping values into an unreadable layout.

--------------------------------------------------
C. THREE-MONTH STACKED HOUSEHOLD SPENDING CHART
--------------------------------------------------

Replace the existing grocery-only chart with:

"Household Spending — Last 3 Months"

Use a stacked bar chart with EXACTLY THREE calendar-month bars:

1. Current calendar month
2. Previous calendar month
3. Two months ago

Always display all three months, even if a month contains $0 spending.

Each bar represents TOTAL household spending for that month, split into stacked segments.

Segments should include:

- Groceries
- Each maintenance service category with relevant spending during the three-month period

Example:

October bar might contain:
- Groceries
- Gardener
- Jacuzzi
- Electrician

Do NOT combine all maintenance spending into one Maintenance segment.

Each distinct maintenance service category should be its own stack segment.

GROCERY CHART LOGIC

- Use purchase_date to decide which month a purchase belongs to.
- Use the entire grocery amount regardless of reimbursement status.

MAINTENANCE CHART LOGIC

- Use visit_date to decide which month a visit belongs to.
- Group spending by actual maintenance service category.
- Use the entire recorded amount regardless of paid/unpaid status.
- Blank maintenance amounts count as $0.

CATEGORY RULES

- Do not show a literal "Other" category.
- Custom service categories such as Plumber should display under their actual saved name.
- The chart legend should clearly identify Groceries and each maintenance category.
- Use distinct colors through the existing chart library/theme.
- Keep the chart readable on desktop and mobile.

==================================================
2. SIMPLIFY TOP NAVIGATION
==================================================

Change the authenticated top navigation to only:

Dashboard | Maintenance | Groceries | Log Out

Remove these as separate TOP-LEVEL navigation links:

- Providers
- Upcoming
- Needs Attention

Do NOT delete their routes or functionality.

==================================================
3. CONSOLIDATE MAINTENANCE
==================================================

Maintenance should become the umbrella area for all maintenance-related functionality.

Within Maintenance, add a clear secondary navigation / segmented control:

Providers | History | Upcoming

Existing routes can remain:

Providers:
`/providers`

History:
`/maintenance`

Upcoming:
`/upcoming`

Expected behavior:

- Clicking Maintenance in the TOP navigation opens `/maintenance`.
- Inside the Maintenance area, users can easily switch between Providers, History, and Upcoming.
- Show this secondary navigation consistently across these maintenance sections where practical.

Preserve all existing functionality including:

- provider CRUD
- provider starring
- provider search/filter/sort
- maintenance visit CRUD
- maintenance search/filter/sort
- Paid/Unpaid status
- receipts
- upcoming-service functionality

==================================================
4. NEEDS ATTENTION
==================================================

Remove Needs Attention from the TOP navigation.

Do NOT delete:

`/attention`

Keep its existing functionality.

Users should reach it from the Dashboard using the:

"View Needs Attention"

link/button beside Total Amount Due.

==================================================
5. GROCERIES
==================================================

Keep Groceries as its own top-level navigation item.

Preserve:

- grocery CRUD
- grocery search
- category filtering
- reimbursement filtering
- date filtering
- sorting
- receipt uploads
- reimbursement status

The grocery budget UI should no longer appear on the Dashboard.

Do not delete the budgets table or existing historical budget data.

==================================================
6. TESTING
==================================================

Update or add automated unit tests as needed for the new Dashboard logic.

At minimum verify:

1. Total Recorded Spend correctly combines grocery and maintenance spending.

2. Total Amount Due includes:
   - unreimbursed groceries
   - unpaid maintenance
   and excludes settled items.

3. Category summary calculations correctly produce:
   - Total Amount
   - Amount Due

4. Last Activity uses:
   - purchase_date for Groceries
   - visit_date for maintenance

5. The three-month chart assigns records based on:
   - purchase_date for groceries
   - visit_date for maintenance

6. The chart always produces exactly three calendar months.

7. Months without spending appear with zero values.

8. Maintenance categories remain separated rather than being combined into one maintenance stack.

9. Custom service categories work.

10. Existing required data-isolation test still passes.

11. Existing required Dashboard test should remain valid unless a shared production helper genuinely needs to change.

Do NOT redo the intentional red/green testing exercise from the required assignment tests.

Run the full automated test suite when finished.

==================================================
7. FINAL VERIFICATION
==================================================

Before finishing, confirm all of the following:

- Main navigation shows only:
  Dashboard / Maintenance / Groceries / Log Out

- Dashboard shows two compact summary figures:
  Total Recorded Spend / Total Amount Due

- Total Amount Due links to Needs Attention.

- Dashboard contains the table:
  Category / Total Amount / Amount Due / Last Activity / Next Visit

- Groceries appears as the first table row.

- Actual maintenance service categories appear correctly.

- A literal Other category is excluded.

- Custom categories still display correctly.

- Dashboard contains one stacked spending chart with exactly the last three calendar months.

- Each chart bar contains separate Grocery and maintenance-category segments.

- Spending totals ignore settlement status.

- Amount Due uses settlement status correctly.

- Grocery budget UI is removed from the Dashboard.

- Budget database/history remains untouched.

- Maintenance contains secondary navigation:
  Providers / History / Upcoming

- Provider functionality still works.

- Maintenance History functionality still works.

- Upcoming functionality still works.

- Needs Attention functionality still works.

- Grocery functionality still works.

- Receipt uploads still work.

- Stars still work.

- Search/filter/sort still works.

- Authentication and user data isolation remain unchanged.

- Mobile layouts remain usable.

- Full automated test suite passes.

- `prompts/dashboard-navigation-simplification.md` exists.

When complete, summarize:
1. What changed
2. Any files changed
3. Tests added/updated
4. Full test-suite result
5. Any remaining limitations

Stop after completing this feature.
---

## Follow-up refinements (2026-10-18)

- Rename "Total Recorded Spend" to "Total Spend" with a period selector: This Month (default), Last 3 Months, Since Inception. Selector must not affect Total Amount Due.
- Rename the "View Needs Attention" link to "View" (still links to /attention).
- Category Summary becomes current-month scoped: heading "Category Summary — <Mon>", columns Category (<Mon>) | Total (<Mon>) | Amount Due | Last Visit | Next Visit. Total = current calendar month; Amount Due = all-time outstanding; Groceries show "—" for Last/Next Visit; all columns centered.
- Chart Y-axis: $0–$1,000 in $200 increments, expanding to the next $200 increment when a month exceeds $1,000.
- Top navigation: Dashboard | Expenses | History | Upcoming | Log Out. Expenses (defaulting to Providers) holds secondary nav Providers | Groceries; the old Providers | History | Upcoming secondary nav is removed.
- No database changes; all existing functionality preserved; full test suite must pass.
