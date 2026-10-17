Build ONLY Feature 6 for HomeOps: starred provider priority.

IMPORTANT
- Work only on the current `feature-starred-providers` branch.
- Do not make changes directly to `main`.
- Use the existing `PLAN.md` as the product source of truth.
- Do not modify `PLAN.md`.
- Use the existing Lovable Cloud backend and authentication.
- Build on top of the existing Providers feature.
- Keep this feature intentionally small.
- Save this prompt and any important follow-up instructions in `prompts/starred-providers.md` on this same branch.
- Stop when this feature is complete.

FEATURE GOAL

Add a simple star/pin system for service providers.

Do NOT describe starred providers as "trusted" or "favorites."

Treat the star as a simple priority/pin flag so users can keep important providers at the top of their Providers list.

STAR BEHAVIOR

On the Providers list and provider detail page:
- Show an empty star icon ☆ when the provider is not starred.
- Show a filled star icon ★ when the provider is starred.
- Clicking the star should star or unstar that provider.
- The change should happen without requiring the user to edit the provider form.

When viewing the Providers list:
- Starred providers should appear at the top.
- Unstarred providers should appear underneath.
- Within each group, keep a sensible consistent order.

STARRED-ONLY VIEW

Add a simple "Starred only" toggle or filter on the Providers page.

When enabled:
- Show only starred providers.

When disabled:
- Show all providers, with starred providers at the top.

This should satisfy the starred-items view requirement without adding a separate navigation page.

DATABASE

Use one junction table for stars, consistent with PLAN.md.

Create or use a `stars` table with:
- id — uuid primary key
- user_id — uuid, required
- service_provider_id — uuid, required
- created_at — timestamp

Add a unique constraint on:
- user_id
- service_provider_id

This must prevent duplicate stars for the same provider.

SECURITY / DATA ISOLATION

Users must only be able to:
- create stars for themselves
- view their own stars
- remove their own stars

A user must never be able to view or change another user's stars.

Users must also only be able to star providers they own.

Enforce this through backend/database rules, not only through the UI.

UI

Keep the current HomeOps visual style.

The star control should be:
- simple
- clear
- unobtrusive
- easy to tap on mobile

Do not add unnecessary explanatory text.

Do not use language such as:
- Trusted
- Favorite
- Preferred

The star simply means the provider is pinned / prioritized.

DO NOT BUILD THESE YET

Do not add:
- global search/filter/sort
- dashboard charts or summary statistics
- Upcoming / Due maintenance page
- monthly grocery budgets

Those will be separate feature branches and pull requests.

PROMPT LOG

Create:

`prompts/starred-providers.md`

Save the important instructions from this prompt in that file.

Append any important follow-up prompts for this feature to the same file.

BEFORE FINISHING

Confirm:
- A provider can be starred.
- A starred provider shows ★.
- An unstarred provider shows ☆.
- A starred provider can be unstarred.
- Starred providers appear at the top of the Providers list.
- The Starred only filter shows only starred providers.
- Duplicate stars cannot be created for the same provider.
- Users can only see and manage their own stars.
- Users cannot star another user's provider.
- Logged-out users cannot access provider management.
- `prompts/starred-providers.md` exists.
- No later HomeOps features were built.

Stop after Feature 6 is complete.