Fix the expense-detail consistency problem identified during the required stranger test.

IMPORTANT
- Work only on the current `fix-expense-detail-consistency` branch.
- Do not change the database schema.
- Do not change stored records.
- Preserve Edit/Delete, receipts, Paid/Unpaid status, authentication, and data isolation.
- Save this prompt in:
  `prompts/expense-detail-consistency.md`
- Run the full automated test suite and build afterward.

==================================================
1. PROBLEM
==================================================

The stranger tester found the expense detail pages confusing because the visual
hierarchy is inconsistent.

Examples in the current UI:

A Gardener transaction can show:

Gardener Inc
Gardening

while a Jacuzzi transaction can show:

Jacuzzi Maintenance
Cleaned filters

The large heading therefore sometimes represents the service performed rather
than the actual expense type.

Standardize this.

==================================================
2. SERVICE / MAINTENANCE DETAIL PAGES
==================================================

For every maintenance/service transaction, the LARGE primary page title should
always be the Expense Type.

Examples:

Gardener

Jacuzzi

Aircon

Electrician

The title should NOT be:
- provider/company name
- service performed

Below the title, show the transaction information consistently with labels.

Use:

Provider
<provider/name entered by user>

Visit Date
<date>

Service Performed
<service text>

Amount Paid
<amount>

Payment Status
<Paid / Unpaid>

Notes
<notes>

Receipt
<receipt information where applicable>

Example:

Gardener

Provider
Gardener Inc

Visit Date
Oct 13, 2026

Service Performed
Gardening

Amount Paid
$150.00

Payment Status
Paid

==================================================
3. GROCERY DETAIL PAGE
==================================================

Use the same visual hierarchy for Grocery.

The LARGE page title should be:

Grocery

Do not use the store name as the main page title.

Below it show:

Store
Fairprice

Purchase Date
Oct 15, 2026

Amount
$99.99

Status
Paid

Notes
...

Receipt
...

This should make Grocery consistent with the service expense details.

==================================================
4. BACK NAVIGATION
==================================================

Keep:

Back to Expenses

as the back navigation on all transaction detail pages.

Do not restore any legacy:
- Back to groceries
- Back to providers
- provider-detail navigation

==================================================
5. MANAGEMENT ACTIONS
==================================================

Keep Edit Expense and Delete Expense available through the current low-profile
three-dot menu.

Do not make them large primary buttons again.

Delete must continue requiring confirmation.

==================================================
6. TERMINOLOGY
==================================================

Use the existing user-facing expense type labels consistently.

Examples:
- Grocery
- Gardener
- Jacuzzi
- Aircon
- Electrician
- custom types

Do not expose old/internal terminology unnecessarily.

==================================================
7. TESTING
==================================================

Add/update tests as needed to verify:

- maintenance detail title is Expense Type
- provider name is shown under Provider
- service performed remains a separate field
- Grocery detail title is Grocery
- store appears under Store rather than as the main title
- Back to Expenses remains correct
- Edit/Delete behavior is unchanged
- existing records still display correctly
- required assignment tests still pass

Run the complete automated test suite and build.

When finished, summarize:
1. what was standardized
2. files changed
3. tests added/updated
4. full test-suite result
5. build result