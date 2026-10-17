Build ONLY Feature 9 for HomeOps: Upcoming / Due maintenance.

IMPORTANT
- Work only on the current `feature-upcoming-maintenance` branch.
- Do not make changes directly to `main`.
- Use the existing `PLAN.md` as the product source of truth.
- Do not modify `PLAN.md`.
- Use the existing Lovable Cloud backend and authentication.
- Build on top of the existing Providers, Maintenance Visits, Payment Status, Dashboard, and Search/Filter/Sort features.
- Do not build the monthly grocery budget feature yet.
- Save this prompt and any important follow-up instructions in `prompts/upcoming-maintenance.md` on this same branch.
- Stop when this feature is complete.

FEATURE GOAL

Add an Upcoming / Due maintenance view that helps users see which services are coming up and which ones are already overdue.

Use the existing `next_service_date` field on maintenance visits.

Only maintenance visits with a `next_service_date` should appear in this feature.

UPCOMING / DUE PAGE

Add a top-level navigation item called:

Upcoming

The page should show all maintenance records belonging to the signed-in user that have a next service date.

Sort everything by `next_service_date`, soonest first.

Each item should clearly show:
- Provider name
- Service performed
- Next service date
- Amount from the original visit, if useful
- Paid / Unpaid status if useful
- Whether the next service is Overdue, Due Soon, or Upcoming

STATUS LOGIC

Use the current calendar date.

Overdue:
- `next_service_date` is before today

Due Soon:
- `next_service_date` is today or within the next 7 days

Upcoming:
- `next_service_date` is more than 7 days in the future

Use clear labels:
- Overdue
- Due Soon
- Upcoming

Make Overdue visually noticeable without making the page overly aggressive or cluttered.

If a service is due today, treat it as Due Soon, not Overdue.

Do not show visits with no `next_service_date`.

LINKING

Each item should allow the user to open the related maintenance visit detail page.

Also make the provider name clearly visible so the user immediately knows who the service relates to.

If practical, the provider name can also link to the existing provider detail page.

EMPTY STATE

If the user has no maintenance visits with a next service date, show a friendly message such as:

"No upcoming maintenance scheduled."

Do not show an empty table or broken layout.

PROVIDER PAGE

Keep the existing provider Visit History.

Where useful, make the next service date/status clearer on each visit, but do not redesign the provider page unnecessarily.

If a visit's next service date is overdue, it can show an Overdue label there too.

MAINTENANCE PAGE

Keep the existing global Maintenance page and search/filter/sort behavior.

If easy and consistent with the current UI, show the same Overdue / Due Soon / Upcoming status beside records that have a next service date.

Do not break any existing filters or sorting.

DATE HANDLING

Use `next_service_date` for all Upcoming / Due calculations.

Do not use:
- `visit_date`
- `created_at`

for deciding whether something is overdue or upcoming.

The logic should use calendar dates rather than time-of-day differences so a service due today does not become overdue partway through the day.

SECURITY / DATA ISOLATION

Users must only see Upcoming / Due records belonging to them.

A user must never see another user's:
- maintenance visits
- provider names
- next service dates
- payment status

Continue using the existing backend ownership rules.

UI

Keep the existing HomeOps visual style.

The page should be:
- simple
- clean
- mobile-friendly
- easy to scan quickly

Suggested structure:

Upcoming

Overdue
- overdue records

Due Soon
- records due today or within 7 days

Upcoming
- future records

If a section has no records, it can either be hidden or show a minimal empty message.

Do not create unnecessary complexity.

DO NOT BUILD THESE YET

Do not add:
- monthly grocery budgets
- unrelated new features

The grocery budget will be a separate feature branch and pull request.

PROMPT LOG

Create:

`prompts/upcoming-maintenance.md`

Save the important instructions from this prompt in that file.

Append any important follow-up prompts for this feature to the same file.

BEFORE FINISHING

Test with signed-in sample data and confirm:

- A visit with no next service date does not appear.
- A next service date before today appears as Overdue.
- A next service date today appears as Due Soon.
- A next service date within the next 7 days appears as Due Soon.
- A next service date more than 7 days away appears as Upcoming.
- Records are sorted by next service date, soonest first.
- Provider names display correctly.
- Clicking a record opens the correct visit detail page.
- Empty state works when there are no scheduled services.
- Users only see their own records.
- Logged-out users are redirected to login.
- Existing Maintenance and Provider pages still work.
- `prompts/upcoming-maintenance.md` exists.
- No grocery budget feature was built.

Stop after Feature 9 is complete.