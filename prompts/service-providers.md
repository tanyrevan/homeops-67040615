Build ONLY Feature 2 for HomeOps: service provider management.

IMPORTANT
- Work only on the current `feature-service-providers` branch.
- Do not make changes directly to `main`.
- Use the existing `PLAN.md` as the source of truth for the product requirements.
- Do not modify `PLAN.md`.
- Use the existing authentication system and Lovable Cloud backend already set up for HomeOps.
- Do not build maintenance visits or any later HomeOps features yet.
- Save this prompt and any important follow-up instructions in `prompts/service-providers.md` on this same branch.
- Stop when service provider management is complete.

FEATURE REQUIREMENTS

Authenticated users should be able to manage their own household service providers.

Each service provider should have:
- Name — required
- Service type — required
- Phone or contact information — optional
- Notes — optional
- Created date/time

SERVICE TYPE

For service type, give the user these options only:
- Gardener
- Jacuzzi
- A/C
- Electrician
- Other

If the user selects "Other", show an additional required text field where they can manually enter the service type.

For example, if "Other" is selected, they could type:
- Plumber
- Cleaner
- Handyman
- Pest control

The manually entered service type should be saved as the provider's actual service type.

CRUD

Users must be able to:

1. CREATE
- Add a new service provider.
- Required fields cannot be blank.
- Show a friendly validation message if name or service type is missing.
- If "Other" is selected, the custom service-type field must also be completed before saving.

2. READ / LIST
- See a list of all of their service providers.
- Each provider should clearly show at least name and service type.
- If the user has no providers yet, show a friendly empty state with an option to add one.

3. READ / DETAIL
- Open a provider and view its full details.
- Show name, service type, contact information, and notes.

4. UPDATE
- Edit an existing provider.
- Pre-fill the form with the current information.
- Apply the same required-field validation when saving edits.
- If the provider has a custom service type, make sure editing still correctly handles the "Other" option and the custom value.

5. DELETE
- Delete a provider.
- Before deleting, show a clear confirmation such as:
  "Are you sure you want to delete this provider?"
- Do not delete until the user confirms.
- After deletion, return the user to the provider list and show a friendly success message if appropriate.

DATABASE

Create a `service_providers` table consistent with PLAN.md.

Fields:
- id — uuid primary key
- user_id — uuid, required, references the authenticated user
- name — text, required
- service_type — text, required
- phone_or_contact — text, optional
- notes — text, optional
- created_at — timestamp

Every provider must belong to exactly one authenticated user.

SECURITY / DATA ISOLATION

Users must only be able to:
- view their own service providers
- create providers belonging to themselves
- edit their own providers
- delete their own providers

A user must not be able to view or change another user's provider records.

Use the appropriate Lovable Cloud database security / ownership rules to enforce this on the backend, not only through the UI.

UI

Add a Providers area to the authenticated HomeOps app.

Keep the interface:
- simple
- clean
- mobile-friendly
- easy for non-technical household users

Include:
- Providers page
- "Add Provider" button
- Provider list
- Provider detail view
- Add/edit provider form
- Delete confirmation

Maintain the existing HomeOps visual style.

Do not redesign authentication unless a small navigation change is necessary to access Providers.

DO NOT BUILD THESE YET

Do not add:
- maintenance visits
- grocery expenses
- stars / favorites
- search, filters, or sorting
- dashboard charts or statistics
- receipt uploads
- upcoming maintenance
- monthly grocery budgets

These will be separate features and pull requests later.

PROMPT LOG

Create:
`prompts/service-providers.md`

Save the important instructions from this prompt in that file. Append any important follow-up prompts for this feature to the same file.

BEFORE FINISHING

Confirm:
- An authenticated user can add a provider.
- Name and service type are required.
- The service type choices are Gardener, Jacuzzi, A/C, Electrician, and Other.
- Selecting Other reveals a required manual service-type input.
- The provider appears in the provider list.
- The provider detail page works.
- The provider can be edited.
- Delete requires confirmation.
- Confirmed deletion removes the provider.
- Logged-out users cannot access provider management.
- Users can only access their own provider records.
- `prompts/service-providers.md` exists.
- No later HomeOps features were built.

Stop after Feature 2 is complete.