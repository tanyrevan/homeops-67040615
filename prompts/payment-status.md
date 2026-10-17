Build ONLY Feature 5 for HomeOps: payment status tracking.

IMPORTANT
- Work only on the current `feature-payment-status` branch.
- Do not make changes directly to `main`.
- Use the existing `PLAN.md` as the product source of truth.
- Do not modify `PLAN.md`.
- Use the existing Lovable Cloud backend and authentication.
- Build on top of the existing maintenance visit and grocery expense features.
- Do not build starred providers, global search/filter/sort, dashboard charts, Upcoming / Due, or grocery budgets yet.
- Save this prompt and any important follow-up instructions in `prompts/payment-status.md` on this same branch.
- Stop when payment status tracking is complete.

FEATURE GOAL

Add payment-status tracking to both maintenance visits and grocery purchases so users can easily see what still needs to be paid or reimbursed.

MAINTENANCE VISITS

Add a field:

Paid? — Yes / No

Behavior:
- Default new maintenance visits to No unless the user explicitly selects Yes.
- Keep Amount Paid / Amount as the cost of the service regardless of whether it has actually been paid yet.
- If Paid = No, clearly show an "Unpaid" badge or label.
- If Paid = Yes, show a "Paid" status.
- The user must be able to change this status later when editing a visit.
- Show the payment status in:
  - provider Visit History
  - maintenance visit detail view
  - edit form

Do not infer payment status from the amount. A visit can have a $200 amount and still be marked Unpaid.

GROCERY PURCHASES

Add a field:

Reimbursed? — Yes / No

Behavior:
- Default new grocery purchases to No unless the user explicitly selects Yes.
- Keep Amount as the amount the helper/buyer spent regardless of reimbursement status.
- If Reimbursed = No, clearly show a "Not Reimbursed" badge or label.
- If Reimbursed = Yes, show a "Reimbursed" status.
- The user must be able to change this later when editing a grocery purchase.
- Show reimbursement status in:
  - Groceries purchase history
  - grocery purchase detail view
  - edit form

Do not infer reimbursement status from the amount.

DATABASE

Update the existing maintenance visit data model with:
- paid — boolean, required, default false

Update the existing grocery expense data model with:
- reimbursed — boolean, required, default false

Make sure existing records continue to work safely. Existing rows should be treated as false unless explicitly updated.

NEEDS ATTENTION VIEW

Add a simple top-level "Needs Attention" section or page.

It should show:

1. Unpaid Maintenance
- All maintenance visits where Paid = No
- Show provider name
- Visit date
- Service performed
- Amount
- Link to the visit

2. Not Reimbursed Groceries
- All grocery purchases where Reimbursed = No
- Show purchase date
- Store
- Amount
- Link to the purchase

Only show records belonging to the signed-in user.

If there are no items needing attention, show a friendly empty state such as:
"You're all caught up."

Keep this view simple and useful.

SECURITY / DATA ISOLATION

Users must only be able to view and update payment or reimbursement statuses on their own records.

A user must never be able to see another user's unpaid maintenance visits or unreimbursed groceries.

Enforce this through the backend/database rules already used in HomeOps, not only through the UI.

UI

Keep the existing HomeOps visual style.

Use clear status labels:
- Paid
- Unpaid
- Reimbursed
- Not Reimbursed

Make the unpaid / unreimbursed states visually noticeable without making the interface cluttered.

Keep the feature:
- clean
- mobile-friendly
- easy for non-technical household users

DO NOT BUILD THESE YET

Do not add:
- starred providers
- global search/filter/sort
- dashboard charts or summary statistics
- Upcoming / Due maintenance page
- monthly grocery budgets

Those will be separate feature branches and pull requests.

PROMPT LOG

Create:

`prompts/payment-status.md`

Save the important instructions from this prompt in that file.

Append any important follow-up prompts for this feature to the same file.

BEFORE FINISHING

Confirm:
- New maintenance visits have a Paid Yes/No field.
- New grocery purchases have a Reimbursed Yes/No field.
- Maintenance defaults to Unpaid unless changed.
- Groceries default to Not Reimbursed unless changed.
- Payment/reimbursement status can be edited later.
- Maintenance history displays payment status.
- Grocery history displays reimbursement status.
- The Needs Attention view shows unpaid maintenance visits.
- The Needs Attention view shows unreimbursed grocery purchases.
- Paid/reimbursed records disappear from Needs Attention after being updated.
- Users only see their own records.
- Logged-out users cannot access Needs Attention.
- Existing maintenance and grocery records still work.
- `prompts/payment-status.md` exists.
- No later HomeOps features were built.

Stop after Feature 5 is complete.