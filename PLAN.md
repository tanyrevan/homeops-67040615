# HomeOps — Project Plan

## 1. Pitch
HomeOps is a simple household operations tracker. My family and household staff currently log maintenance visits (gardener, jacuzzi, plumber, electrician, A/C) and grocery spending on paper forms and receipts. HomeOps replaces that with one place to record visits, track spending, see what service is due next, and stay within a monthly grocery budget — on a phone or a computer.

## 2. Features

### Required

1. As a user, I want to sign up, log in, and log out so that my household records are private to my account.

2. As a user, I want to see only my own data so that other households cannot view or change my records.

3. As a user, I want to log a maintenance visit (provider, service, date, amount paid, notes, optional next visit date) so that I have a history of work done at home.

4. As a user, I want to log a grocery purchase (date, store, amount, category, notes) so that I know where our money goes.

5. As a user, I want to create, view, edit, and delete providers, visits, and grocery expenses so that I can fix mistakes and keep records current.

6. As a user, I want clear errors when required fields are missing or invalid (for example, no date or a negative amount) so that my records stay accurate.

7. As a user, I want to star trusted service providers so that I can find them quickly.

8. As a user, I want to search, filter (by provider, service type, store, category, date range), and sort (by date or amount) so that I can find records fast.

9. As a user, I want a dashboard with a monthly grocery spending chart and summary stats (this month's grocery total, this month's maintenance total, number of visits) so that I can see our household spending at a glance.

### Custom

10. As a user, I want to attach a photo of a grocery receipt so that I keep proof of purchase without paper.

11. As a user, I want an "Upcoming / Due" view of maintenance based on the next expected service date so that nothing gets missed.

12. As a user, I want to set a monthly grocery budget and see progress toward it so that we avoid overspending.

## 3. Database

Every table except `users` has `user_id` so rows can be limited to their owner using row-level security.

| Table | Fields (type) | Keys |
|---|---|---|
| users | id (uuid), email (text), created_at (timestamptz) | PK id; id corresponds to the authenticated Supabase user |
| service_providers | id (uuid), user_id (uuid), name (text, required), service_type (text, required), phone_or_contact (text), notes (text), created_at (timestamptz) | PK id; FK user_id -> users.id |
| maintenance_visits | id (uuid), user_id (uuid), service_provider_id (uuid), visit_date (date, required), service_performed (text, required), amount_paid (numeric, >= 0), notes (text), next_service_date (date, optional), created_at (timestamptz) | PK id; FK user_id -> users.id; FK service_provider_id -> service_providers.id |
| grocery_expenses | id (uuid), user_id (uuid), purchase_date (date, required), store (text, required), amount (numeric, required, >= 0), category (text), notes (text), receipt_url (text, optional), created_at (timestamptz) | PK id; FK user_id -> users.id |
| stars | id (uuid), user_id (uuid), service_provider_id (uuid), created_at (timestamptz) | PK id; FK user_id -> users.id; FK service_provider_id -> service_providers.id; UNIQUE (user_id, service_provider_id) |
| budgets | id (uuid), user_id (uuid), month (date, first of month), amount (numeric) | PK id; FK user_id -> users.id; UNIQUE (user_id, month) |

### Relationships

- Each authenticated Supabase account has one corresponding row in the app's `users` table.
- One user has many service providers, maintenance visits, grocery expenses, stars, and budgets.
- One service provider has many maintenance visits (one-to-many).
- `stars` is a junction table connecting users to their favorite service providers.
- The unique constraint on `stars` prevents the same user from starring the same provider twice.
- Receipt images live in a private storage bucket; `receipt_url` stores the file path.

## 4. Tests

### Test 1 — Data isolation
Given User A has household records, when User B logs in, then User B cannot see User A's records.

### Test 2 — Dashboard
Given a user has several grocery expenses, when the dashboard calculates total grocery spending for the month, then the displayed total equals the sum of those expenses.

### Additional tests

Test 3 — Validation:
Given the grocery form, when a user submits with no amount or a negative amount, then the expense is not saved and an error is shown.

Test 4 — Upcoming view:
Given visits with next service dates in the past, near future, and none, when the Upcoming view loads, then only visits with a next date appear, sorted soonest first, with overdue ones marked.

Test 5 — Stars:
Given a provider, when a user stars it twice, then only one star exists.

## 5. Technologies

- Lovable — AI coding agent to build the app quickly from plain-language prompts.
- Supabase — authentication, Postgres database with row-level security for data isolation, and storage for receipt photos, all in one service.
- GitHub — source control, history, issues, branches, and pull requests to review changes.
- Lovable hosting — simple publishing with no separate server setup.

## 6. Design

- Simple, clean, and friendly for non-technical household users and staff.
- Mobile-first layout that also works well on desktop.
- Large, clearly labeled buttons such as "Add Visit" and "Add Grocery".
- Readable one-column forms with large inputs, date pickers, and helpful error messages.
- Cards on mobile and simple tables on desktop.
- Main navigation: Dashboard, Maintenance, Providers, Groceries, Upcoming.
- Calm neutral palette with one accent color and high contrast for readability.

## 7. Risks and cuts

- Risk: Receipt upload. File storage, permissions, and phone photo sizes add complexity.
- Out of scope: Multi-user household sharing, such as parents and staff sharing one household account. For this class version, each account is treated as one household.
- If time runs short, cut features in this order:
  1. Receipt upload
  2. Monthly grocery budget
  3. Keep the Upcoming view because it should be lower effort and high value

## 8. Plan vs. Reality

Do not complete this section until the end of the project.

| Planned feature | Shipped / Changed / Cut | Status (Done/Backlogged) | Learning | What changed and why (one line) |
|---|---|---|---|---|
| | | | | |
