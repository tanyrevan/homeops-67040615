Build ONLY Feature 10 for HomeOps: monthly grocery budget tracking.

IMPORTANT
- Work only on the current `feature-grocery-budget` branch.
- Do not make changes directly to `main`.
- Use the existing `PLAN.md` as the product source of truth.
- Do not modify `PLAN.md`.
- Use the existing Lovable Cloud backend and authentication.
- Build on top of the existing Dashboard and Groceries features.
- Do not build unrelated new HomeOps features.
- Save this prompt and any important follow-up instructions in `prompts/grocery-budget.md` on this same branch.
- Stop when the grocery budget feature is complete.

FEATURE GOAL

Allow each signed-in user to set a grocery budget for each calendar month and track progress against it.

The main focus is the current month, but the data model should support one budget per user per month.

BUDGET FIELDS

Each monthly grocery budget should include:
- User
- Month
- Budget amount

Use one record per user per calendar month.

The month should represent the first day of that month internally, for example:
- October 2026 -> 2026-10-01

DATABASE

Create a `budgets` table consistent with PLAN.md:

- id — uuid primary key
- user_id — uuid, required
- month — date, required
- amount — numeric, required, must be >= 0
- created_at — timestamp
- updated_at — timestamp if useful

Add a unique constraint on:
- user_id
- month

This should prevent more than one budget record for the same user and month.

SECURITY / DATA ISOLATION

Users must only be able to:
- view their own budgets
- create their own budgets
- edit their own budgets

A user must never be able to see or modify another user's budget.

Enforce this through backend/database rules, not only through the UI.

CURRENT MONTH BUDGET

On the Dashboard, add a grocery budget section for the current calendar month.

Show:

- Monthly Grocery Budget
- Grocery Spending This Month
- Remaining Budget
- Progress toward budget

Use the existing grocery purchases and their `purchase_date` field.

Do not use `created_at`.

Include all grocery purchases dated in the current month regardless of whether they are reimbursed.

CALCULATIONS

Spending:
- Sum all grocery purchase amounts dated in the current calendar month.

Remaining:
- Budget amount minus grocery spending.

Examples:

Budget: $1,000
Spent: $650
Remaining: $350

If spending exceeds the budget:

Budget: $1,000
Spent: $1,150
Remaining: -$150

Clearly show that the user is:

"$150 over budget"

rather than displaying a confusing negative number by itself.

PROGRESS

Add a simple visual progress indicator.

For example:
- progress bar
- percentage used

Examples:
- $500 spent of $1,000 = 50%
- $1,000 spent of $1,000 = 100%
- $1,200 spent of $1,000 = 120%

If the user exceeds the budget:
- clearly indicate they are over budget
- do not break or overflow the UI
- the progress display can cap visually at 100% while still showing the true percentage/text, if that produces a cleaner result

SET / EDIT BUDGET

If the current month does not have a budget yet, show a clear action such as:

"Set Grocery Budget"

The user should be able to enter the monthly budget amount.

Validation:
- Budget amount is required
- Budget amount cannot be negative
- Show a friendly error message for invalid input

If the user already has a budget for the current month, show an:

"Edit Budget"

option.

Editing should update the existing month's record rather than creating a duplicate.

MONTH CHANGES

When the calendar month changes:
- The new month should not automatically reuse the previous month's budget unless explicitly implemented as a separate future feature.
- If there is no budget for the new month, show "Set Grocery Budget".
- Previous budget records should remain stored.

Do not delete or overwrite prior months' budgets.

DASHBOARD INTEGRATION

Keep the existing Dashboard summary cards and grocery spending chart.

Add the grocery budget section without making the dashboard cluttered.

A sensible layout could be:

Dashboard summary cards

Grocery Budget
- Budget: $X
- Spent: $Y
- Remaining: $Z
- Progress bar
- Edit Budget

Grocery Spending — Last 6 Months chart

Keep it clean and easy to scan.

EMPTY / EDGE STATES

Handle these cases correctly:

1. No budget and no grocery purchases:
- show $0 grocery spending
- show Set Grocery Budget

2. No budget but grocery purchases exist:
- continue showing current grocery spending
- show Set Grocery Budget
- do not pretend there is a $0 budget

3. Budget exists but no purchases:
- show $0 spent
- show the full budget remaining

4. Spending exactly equals budget:
- show 100%
- show $0 remaining

5. Spending exceeds budget:
- clearly show how much over budget

6. Budget = $0:
- handle safely without division-by-zero errors
- if spending is also $0, show a sensible zero state
- if spending is greater than $0, clearly show over budget

UI

Keep the existing HomeOps visual style.

The budget feature should be:
- simple
- mobile-friendly
- easy for non-technical household users
- visually consistent with the existing Dashboard

Use US dollar formatting.

DO NOT BUILD

Do not add:
- recurring automatic budgets
- notifications
- budget history charts
- unrelated new features

Those are outside this feature.

PROMPT LOG

Create:

`prompts/grocery-budget.md`

Save the important instructions from this prompt in that file.

Append any important follow-up prompts for this feature to the same file.

BEFORE FINISHING

Test with signed-in sample data and confirm:

- A user can set the current month's grocery budget.
- A user can edit the current month's budget.
- Duplicate budgets for the same user/month cannot be created.
- Current-month grocery spending is calculated correctly.
- Reimbursement status does not affect spending calculation.
- Remaining budget is calculated correctly.
- Exactly-at-budget works correctly.
- Over-budget works correctly.
- Budget = $0 does not cause errors.
- A user with no budget gets a clear Set Grocery Budget option.
- Previous month budget records are not overwritten.
- Users can only access their own budgets.
- Logged-out users cannot access the dashboard/budget area.
- `prompts/grocery-budget.md` exists.
- No unrelated features were built.

Stop after Feature 10 is complete.