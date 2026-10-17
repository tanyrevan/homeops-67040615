Build ONLY Feature 7 for HomeOps: search, filtering, and sorting.

IMPORTANT
- Work only on the current `feature-search-filter-sort` branch.
- Do not make changes directly to `main`.
- Use the existing `PLAN.md` as the product source of truth.
- Do not modify `PLAN.md`.
- Use the existing Lovable Cloud backend and authentication.
- Build on top of the existing Providers, Maintenance Visits, Groceries, Payment Status, and Starred Providers features.
- Do not build dashboard charts, Upcoming / Due, or grocery budget features yet.
- Save this prompt and any important follow-up instructions in `prompts/search-filter-sort.md` on this same branch.
- Stop when search, filtering, and sorting are complete.

FEATURE GOAL

Make it easier for users to find records across Providers, Maintenance Visits, and Groceries.

Keep all controls simple, mobile-friendly, and easy for non-technical users.

PROVIDERS

On the Providers page, add:

Search:
- Search by provider name.
- Search should update the visible provider list.

Filter:
- Filter by service type.
- Service type choices should match the current provider system:
  - Gardener
  - Jacuzzi
  - A/C
  - Electrician
  - Other
- Keep the existing Starred only filter.

Sort:
- Sort by:
  - Name A–Z
  - Name Z–A
  - Date added newest first
  - Date added oldest first

Star behavior:
- If no explicit sort is selected, keep the current behavior where starred providers appear above unstarred providers.
- If a user selects an explicit sort, preserve a sensible and predictable ordering while still clearly showing which providers are starred.

MAINTENANCE VISITS

Add a Maintenance history/search view if needed so users can find visits across all providers, not only inside one provider page.

Search:
- Search by provider name.
- Search by service performed.

Filters:
- Payment status:
  - All
  - Paid
  - Unpaid
- Date range:
  - Start date
  - End date

Sort:
- Visit date newest first
- Visit date oldest first
- Amount highest to lowest
- Amount lowest to highest

Each result should clearly show:
- Provider name
- Visit date
- Service performed
- Amount
- Paid / Unpaid status

Clicking a result should open the existing visit detail page.

Do not remove the visit history already shown inside each provider page.

GROCERIES

On the Groceries page, add:

Search:
- Search by store name.

Filters:
- Category
- Reimbursement status:
  - All
  - Reimbursed
  - Not Reimbursed
- Date range:
  - Start date
  - End date

Sort:
- Purchase date newest first
- Purchase date oldest first
- Amount highest to lowest
- Amount lowest to highest

Each result should continue to show the existing grocery information and receipt indicator.

FILTER BEHAVIOR

- Search, filters, and sorting should work together.
- Applying one control should not incorrectly clear the others.
- Include a simple "Clear filters" or "Reset" option where helpful.
- Empty filtered results should show a friendly message instead of a blank screen.
- Do not permanently modify or delete data when filtering or sorting.
- Keep sensible defaults:
  - newest records first for maintenance and groceries
  - current provider behavior unless the user changes sort

SECURITY / DATA ISOLATION

Users must only be able to search, filter, and sort records they are already allowed to access.

A user must never receive another user's providers, maintenance visits, grocery purchases, stars, payment statuses, or receipt references through search or filtering.

Enforce this using the existing backend ownership rules, not only frontend filtering.

UI

Keep the existing HomeOps visual style.

Search/filter controls should:
- be easy to understand
- work well on mobile
- not overwhelm the page
- use clear labels
- collapse or wrap sensibly on smaller screens

Avoid adding unnecessary complexity.

DO NOT BUILD THESE YET

Do not add:
- dashboard charts or summary statistics
- Upcoming / Due maintenance page
- monthly grocery budgets

Those will be separate feature branches and pull requests.

PROMPT LOG

Create:

`prompts/search-filter-sort.md`

Save the important instructions from this prompt in that file.

Append any important follow-up prompts for this feature to the same file.

BEFORE FINISHING

Confirm:

Providers:
- Search by provider name works.
- Service type filter works.
- Starred only still works.
- Provider sorting works.

Maintenance:
- Search by provider works.
- Search by service performed works.
- Paid/Unpaid filtering works.
- Date-range filtering works.
- Date and amount sorting work.
- Results link to the correct visit.

Groceries:
- Search by store works.
- Category filtering works.
- Reimbursed/Not Reimbursed filtering works.
- Date-range filtering works.
- Date and amount sorting work.

General:
- Search, filters, and sort work together.
- Clear/reset works.
- Empty results show a friendly state.
- Users only see their own records.
- Logged-out users cannot access these pages.
- `prompts/search-filter-sort.md` exists.
- No later HomeOps features were built.

Stop after Feature 7 is complete.