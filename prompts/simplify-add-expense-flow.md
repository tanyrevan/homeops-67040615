Simplify the HomeOps Add Expense workflow.

IMPORTANT
- Work on the current `simplify-add-expense-flow` branch.
- Preserve all existing records.
- Preserve authentication, data isolation, Dashboard calculations, starring,
  Paid/Unpaid behavior, receipts, editing, deleting, and existing database
  relationships.
- Do not make unrelated visual changes.
- Save this prompt in:
  `prompts/simplify-add-expense-flow.md`
- Run the full automated test suite and build afterward.

==================================================
1. GOAL
==================================================

The current service-expense workflow is unnecessarily multi-step.

Right now, a user can:
1. choose an Expense Type
2. choose/create a Provider
3. fill in provider information
4. save the provider
5. then go through another form to create the actual expense

Simplify this into ONE user-facing Add Expense flow.

The user should select the Expense Type and then enter all relevant information
on the same page.

Do not require the user to understand or manage the internal Provider record
separately.

==================================================
2. SERVICE EXPENSE FLOW
==================================================

For service categories such as:

- Gardener
- Jacuzzi
- Aircon
- Electrician
- other/custom service types

After the user selects the Expense Type, show one combined form.

Use fields in roughly this order:

Expense Type
<select>

Name *
<input>

Phone or contact
<input>

Visit Date *
<date>

Service Performed *
<input>

Amount
<input>

Paid?
Yes / No

Notes
<textarea>

Upload Receipt
<file>

Save Expense
Cancel

Do NOT show a separate user-facing:

Provider
<select>

Do NOT require the user to click Save Provider and then complete another form.

==================================================
3. INTERNAL PROVIDER HANDLING
==================================================

Do not remove the existing service_providers table or break existing
maintenance_visit relationships.

When the user saves a service expense:

- use the entered Name as the provider/company/person name
- create the required provider record automatically behind the scenes if needed
- if a suitable existing provider belonging to the same signed-in user already
  exists, reuse it rather than creating unnecessary duplicates where safe
- associate the maintenance visit with that provider
- save the expense/visit in the same user action

Phone/contact should continue to be stored with the provider where the current
schema expects it.

The user should not have to know this internal provider relationship exists.

Existing provider and maintenance records must continue working.

==================================================
4. GROCERY FORM
==================================================

For Grocery:

Change the Store placeholder from:

e.g. Trader Joe's

to:

e.g. Cold Storage

This app is being used for a home in Singapore, so use the Singapore example.

Do not change the actual Store field behavior.

==================================================
5. PAID DEFAULT
==================================================

For EVERY new expense form, including:

- Grocery
- Gardener
- Jacuzzi
- Aircon
- Electrician
- other service expenses

do NOT have either Paid option selected by default.

Currently "No" is preselected.

Change this so:

○ Yes
○ No

Both begin unselected.

Paid status should be a deliberate user choice.

If the current form requires a Paid status before saving, keep that validation
and show a friendly message asking the user to choose Yes or No.

Do not silently assume No.

==================================================
6. AMOUNT LABEL
==================================================

Across the add/edit expense forms, change the user-facing label:

Amount Paid

to:

Amount

For example:

Amount
e.g. 75.00

Remove wording such as:

Optional, e.g. 75.00

The placeholder should simply be:

e.g. 75.00

For Grocery, keep the existing Amount terminology consistent.

Also review expense detail pages. If they currently display the label
"Amount Paid" for the transaction amount, change that user-facing label to:

Amount

Do NOT change database column names merely for this wording change.

==================================================
7. RECEIPT HELPER TEXT
==================================================

Keep the Upload Receipt field and Choose File control.

Remove the helper sentence below the upload control, such as:

"Optional photo of a receipt or payment (JPG, PNG, HEIC — up to 10 MB)."

and the equivalent Grocery helper text.

Do not remove receipt upload functionality.

Do not change file-size or file-type validation behind the scenes.

==================================================
8. EDITING EXISTING EXPENSES
==================================================

Keep existing expense editing functional.

When editing a service expense:

- show the same simplified field structure where practical
- Name should represent the provider/company/person
- Amount should use the new label
- Paid status should reflect the existing saved value
- do not create duplicate provider records just because an existing transaction
  was edited

Existing historical records must continue displaying correctly.

==================================================
9. DO NOT CHANGE
==================================================

Preserve:

- Dashboard totals and chart
- Amount Due calculations
- Upcoming / History logic
- Mark Paid
- individual expense stars
- Starred filter
- Filter control
- receipts
- expense detail pages other than the Amount label wording
- auth/data isolation
- existing Grocery and maintenance records
- existing provider data
- database ownership/RLS rules

Do not delete the provider table or migrate existing records away from it.

==================================================
10. TESTING
==================================================

Add/update tests covering at minimum:

- service expense can be created in one user-facing flow
- no visible Provider selector is required
- provider record is still correctly created/reused internally
- maintenance visit is correctly linked to its provider
- existing providers/visits still load
- Grocery placeholder uses "Cold Storage"
- Paid starts with neither Yes nor No selected
- save validation handles missing Paid choice correctly if Paid is required
- "Amount Paid" is replaced by "Amount" in relevant forms/details
- amount placeholder no longer says "Optional"
- receipt helper sentence is removed while receipt upload still works
- existing required data-isolation test still passes
- existing Dashboard calculation test still passes

Run the complete automated test suite and build.

When finished, summarize:
1. the new Add Expense workflow
2. how provider records are handled internally
3. files changed
4. whether any database migration was required
5. tests added/updated
6. full test result
7. build result