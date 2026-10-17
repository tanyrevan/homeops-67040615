Build ONLY Feature 8 for HomeOps: the dashboard.

IMPORTANT
- Work only on the current `feature-dashboard` branch.
- Do not make changes directly to `main`.
- Use the existing `PLAN.md` as the product source of truth.
- Do not modify `PLAN.md`.
- Use the existing Lovable Cloud backend and authentication.
- Build on top of the existing Providers, Maintenance, Groceries, Payment Status, Needs Attention, Stars, and Search/Filter/Sort features.
- Do not build the Upcoming / Due maintenance feature or monthly grocery budget feature yet.
- Save this prompt and any important follow-up instructions in `prompts/dashboard.md` on this same branch.
- Stop when the dashboard is complete.

FEATURE GOAL

Replace the current basic logged-in Home/HomeOps screen with a useful dashboard that summarizes the signed-in user's household activity.

The dashboard should use the user's actual maintenance visit and grocery purchase data.

SUMMARY STATS

At the top of the dashboard, show three clear summary cards:

1. This Month's Grocery Total
- Sum the amount of all grocery purchases with a purchase date in the current calendar month.
- Include purchases regardless of whether they have been reimbursed, because this represents the amount spent on groceries.

2. This Month's Maintenance Total
- Sum the amount of all maintenance visits with a visit date in the current calendar month.
- Include the recorded service cost regardless of Paid / Unpaid status.
- If a maintenance visit has no amount entered, treat it as $0.

3. Maintenance Visits This Month
- Count all maintenance visits with a visit date in the current calendar month.

Use US dollar formatting for monetary values.

Examples:
- $1,245.50
- $320.00
- 4 visits

GROCERY SPENDING CHART

Add at least one dashboard chart showing grocery spending over time.

Use a simple bar chart or line chart.

Preferred approach:
- Show the last 6 calendar months, including the current month.
- Group grocery purchases by month.
- Sum the grocery amount for each month.
- Label the months clearly, such as:
  May
  Jun
  Jul
  Aug
  Sep
  Oct

The chart should:
- use only the signed-in user's grocery purchases
- show $0 for months with no purchases rather than skipping them
- display dollar values clearly
- be easy to read on desktop and mobile
- have a clear title such as "Grocery Spending — Last 6 Months"

If the existing app already uses a suitable chart library, reuse it. Otherwise use a lightweight chart solution appropriate for the project.

DASHBOARD LAYOUT

The dashboard should become the main signed-in Home page.

Keep the existing HomeOps navigation.

Suggested layout:

Top:
- "HomeOps Dashboard" or "Dashboard"
- Small friendly subtitle such as "Your household at a glance."

Next:
- Three summary cards:
  - Grocery Total
  - Maintenance Total
  - Maintenance Visits

Below:
- Grocery spending chart

Do not make the page overly busy.

EMPTY STATES

The dashboard must work correctly for a brand-new user with no records.

If there is no data:
- Summary totals should show $0.00
- Maintenance visits should show 0
- The grocery chart should still render cleanly with zero values, or show a friendly empty-state message if that produces a better result
- Do not show errors, NaN, undefined, or broken charts

DATE / CALCULATION RULES

Use the record dates:
- `purchase_date` for grocery expenses
- `visit_date` for maintenance visits

Do not use `created_at` to decide which month a purchase or visit belongs to.

"This month" means the current calendar month.

Make the calculations deterministic and easy to test.

SECURITY / DATA ISOLATION

All dashboard calculations must use only data belonging to the signed-in user.

A user must never see:
- another user's grocery totals
- another user's maintenance totals
- another user's visit count
- another user's chart data

Continue using the existing backend ownership/security rules.

UI

Keep the existing HomeOps visual style.

The dashboard should be:
- clean
- simple
- mobile-friendly
- easy for non-technical household users
- visually consistent with the rest of HomeOps

Summary cards should be easy to scan.

The chart should resize appropriately on narrow screens.

DO NOT BUILD THESE YET

Do not add:
- Upcoming / Due maintenance page or logic
- Monthly grocery budgets
- New unrelated HomeOps features

Those will be separate feature branches and pull requests.

PROMPT LOG

Create:

`prompts/dashboard.md`

Save the important instructions from this prompt in that file.

Append any important follow-up prompts for this feature to the same file.

BEFORE FINISHING

Test with signed-in sample data and confirm:

- This Month's Grocery Total equals the sum of this month's grocery purchases.
- This Month's Maintenance Total equals the sum of this month's maintenance visit amounts.
- Maintenance Visits This Month equals the correct number of visits.
- Records from a different month are not included in this month's summary cards.
- Grocery chart totals are correctly grouped by month.
- Months with no grocery purchases are handled correctly.
- A user with no records gets sensible zero/empty states.
- Logged-out users cannot access the dashboard.
- Dashboard calculations only use the signed-in user's records.
- Dashboard works on mobile-sized screens.
- `prompts/dashboard.md` exists.
- No Upcoming / Due or grocery budget feature was built.

Stop after Feature 8 is complete.