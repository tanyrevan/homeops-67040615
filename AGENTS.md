<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Signed-in pages live under `src/routes/_authenticated/` (client-only gate redirecting to `/auth`); why: the session is in browser storage, so the server can't check it.
- `public.users` rows are created only by the `handle_new_user` trigger on signup; why: guarantees exactly one row per account.
- Password validation and password-error classification live in `src/lib/password-validation.ts`; why: boundary tests exercise the same rules the authentication form uses, without mistaking strength errors for length errors.
- Service provider form rules (service type choices, "Other" custom type, required fields) live in `src/lib/provider-validation.ts`; why: tests and the add/edit form share one source of truth. Provider rows are owner-only via RLS on `user_id`.
- Visit form rules live in `src/lib/visit-validation.ts`; receipt photos go in the private `receipts` bucket under `<user_id>/...` (storage rules check the first folder); why: owner-only access enforced by the backend.
- Grocery form rules live in `src/lib/grocery-validation.ts`; grocery receipts share the private `receipts` bucket under `<user_id>/groceries/`; why: one owner-only storage rule covers all receipts.
- Preserve `/groceries` as a redirect to the unified Expenses ledger; grocery add/detail/delete navigation returns to the ledger and edit save/cancel may return to the current detail; why: old public URLs stay usable without exposing a second list.
- Payment status: `maintenance_visits.paid` and `grocery_expenses.reimbursed` are explicit booleans (default false), never inferred from amounts; why: a cost can be owed but unpaid.
- Provider stars are a pin/priority flag in the `stars` junction table (unique per user+provider, insert only for owned providers); list ordering lives in `src/lib/stars.ts`; why: one tested sort rule.
- Search/filter/sort runs in the browser over rows already limited by RLS, via pure functions in `src/lib/list-filters.ts`; why: ownership stays enforced by the backend and the rules are unit-tested.
- Household dashboard calculations live in `src/lib/household-stats.ts`, reusing legacy monthly math in `src/lib/dashboard-stats.ts`; why: cent-based calculations and record-date rules stay deterministic and shared with tests.
- Dashboard reads are owner-filtered and paginated; why: all-time totals must include records beyond the backend page limit without weakening isolation.
- Maintenance secondary navigation is centralized in AppShell using the current path; why: providers, visits, history, and upcoming keep their existing URLs and share navigation.
- Overdue / Due Soon / Upcoming is computed only from `next_service_date` vs the local calendar date in `src/lib/due-status.ts`; why: no time-of-day drift, unit-tested.
- Monthly grocery budgets: one `budgets` row per user per month (month = first day, unique user+month, owner-only RLS, no delete); math in `src/lib/budget.ts`; why: tested, no division by zero, prior months preserved.
- Provider list also filters by the signed-in user via `filterOwnedRecords` in `src/lib/ownership.ts` (on top of RLS); why: a unit-tested data-isolation check.
