Build ONLY Feature 3 for HomeOps: maintenance visit and payment tracking.

IMPORTANT
- Work only on the current `feature-maintenance-visits` branch.
- Do not make changes directly to `main`.
- Use the existing `PLAN.md` as the product source of truth.
- Do not modify `PLAN.md`.
- Use the existing Lovable Cloud backend and authentication.
- Build on top of the existing service provider feature.
- Do not build grocery tracking or later HomeOps features yet.
- Save this prompt and any important follow-up instructions in `prompts/maintenance-visits.md` on this same branch.
- Stop when maintenance visit tracking is complete.

FEATURE GOAL

Each service provider should have a history of maintenance visits and payments.

From a provider's detail page, the user should be able to:
- Add a visit
- See previous visits
- See how much was paid for each visit
- View an uploaded receipt or payment image if one exists
- Edit a visit
- Delete a visit

Each maintenance visit should belong to one service provider and one authenticated user.

VISIT FIELDS

Each visit should include:

- Provider — automatically linked to the provider the user is viewing
- Visit date — required
- Service performed — required
- Amount paid — optional, but if entered must be 0 or greater
- Notes — optional
- Next service date — optional
- Receipt / payment image — optional
- Created date/time

DATABASE

Create a `maintenance_visits` table with:

- id — uuid primary key
- user_id — uuid, required, owned by the authenticated user
- service_provider_id — uuid, required, references service_providers
- visit_date — date, required
- service_performed — text, required
- amount_paid — numeric, optional, must be >= 0 if provided
- notes — text, optional
- next_service_date — date, optional
- receipt_url — text or storage path, optional
- created_at — timestamp

Relationships:
- One service provider can have many maintenance visits.
- Each maintenance visit belongs to exactly one provider.
- Each maintenance visit belongs to exactly one authenticated user.

SECURITY / DATA ISOLATION

Users must only be able to:
- view their own maintenance visits
- create visits for their own service providers
- edit their own visits
- delete their own visits
- access their own uploaded receipt images

A user must never be able to access:
- another user's maintenance visits
- another user's provider records
- another user's receipt images

Enforce this through the backend/database/storage rules, not only through the UI.

CREATE VISIT

On each provider detail page, add an:

"Add Visit"

button.

The add visit form should include:

- Visit Date
- Service Performed
- Amount Paid
- Notes
- Next Service Date
- Optional Receipt / Payment Image upload

Validation:
- Visit date is required.
- Service performed is required.
- Amount paid cannot be negative.
- Show friendly validation messages.
- Receipt image is optional.

RECEIPT IMAGE UPLOAD

Allow the user to optionally upload an image of a receipt, invoice, or payment record for the visit.

Requirements:
- Accept common image formats such as JPG, JPEG, PNG, and HEIC if supported.
- Store uploaded files securely using Lovable Cloud storage.
- Receipt files must be private to the authenticated owner.
- Store the file path/reference on the maintenance visit record.
- If a visit has a receipt, show a "View Receipt" option.
- Opening the receipt should display the uploaded image clearly.
- If no receipt exists, do not show a broken image or empty receipt area.
- When replacing a receipt during editing, update the visit to reference the new file.
- When deleting a visit, clean up its receipt file if practical and safe to do so.

VISIT HISTORY

On the provider detail page, add a section called something like:

"Visit History"

Show all visits for that provider.

Each visit should clearly display:
- Visit date
- Service performed
- Amount paid, if entered
- Next service date, if entered
- Receipt indicator/link if a receipt exists

Sort visits with the newest visit first.

Allow the user to open a visit to see its full details.

VISIT DETAIL

The visit detail view should display:

- Provider name
- Visit date
- Service performed
- Amount paid
- Notes
- Next service date
- Receipt image or View Receipt button if uploaded
- Edit button
- Delete button

EDIT

Users should be able to edit an existing visit.

The edit form should:
- pre-fill all existing values
- allow date, service, amount, notes, next service date, and receipt to be changed
- apply the same validation rules as creating a visit

DELETE

Users should be able to delete a visit.

Before deleting, show a confirmation such as:

"Are you sure you want to delete this visit?"

Do not delete until they confirm.

After deletion:
- return to that provider's detail page
- remove the visit from history
- show a friendly success message if appropriate

PROVIDER DETAIL PAGE

Keep the existing provider information at the top.

Below it, add:
- Add Visit button
- Visit History
- Payment amounts
- Next service dates
- Receipt access where applicable

The provider page should now function as the main history page for that service provider.

UI

Keep the existing HomeOps visual style.

Make it:
- clean
- simple
- mobile-friendly
- easy for non-technical household users

Use clear labels such as:
- Add Visit
- Visit Date
- Service Performed
- Amount Paid
- Next Service Date
- Upload Receipt
- View Receipt
- Edit Visit
- Delete Visit

DO NOT BUILD THESE YET

Do not add:
- grocery expense tracking
- grocery receipt uploads
- starred providers
- global search/filter/sort
- dashboard charts or summary statistics
- Upcoming / Due page
- monthly grocery budgets

Those will be separate feature branches and pull requests.

PROMPT LOG

Create:

`prompts/maintenance-visits.md`

Save the important instructions from this prompt in that file.

Append any important follow-up prompts for this feature to the same file.

BEFORE FINISHING

Confirm:
- A signed-in user can add a visit from a provider page.
- Visit date is required.
- Service performed is required.
- Negative payment amounts are rejected.
- The visit appears in that provider's Visit History.
- Visits are sorted newest first.
- A visit can be opened and viewed.
- A visit can be edited.
- Delete requires confirmation.
- Confirmed deletion removes the visit.
- An optional receipt image can be uploaded.
- A saved receipt can be viewed again later.
- Users can only access their own visits and receipts.
- Logged-out users cannot access maintenance visit pages.
- `prompts/maintenance-visits.md` exists.
- No later HomeOps features were built.

Stop after Feature 3 is complete.