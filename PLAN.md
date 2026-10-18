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

| Planned feature | Shipped / Changed / Cut | Status | Learning | Final outcome and reason |
|---|---|---|---|---|
| Authentication and data isolation | Shipped | Done | Privacy requires database enforcement, not just hidden pages. | Email/password auth, owner-only records and private receipt access shipped, with an extra provider ownership check. |
| Maintenance and groceries | Changed | Done | One transaction view is easier to understand than separate directories. | Both workflows now share the Expenses ledger while keeping separate underlying tables. |
| CRUD | Shipped | Done | Transaction-centric actions reduce navigation. | Add individual expenses, open details, edit, and delete with confirmation; provider records remain underneath. |
| Validation | Shipped | Done | Shared helpers make boundary rules testable. | Required fields and nonnegative amounts receive friendly errors; receipt uploads are validated. |
| Stars | Shipped, then changed | Done | Starring individual line items better fits a transaction-centric ledger. | The original starring requirement shipped first as service-provider stars. Final usability cleanup changed starring to individual Grocery and service/maintenance expenses. Starred on Expenses filters both Upcoming and History to starred line items; star state persists in the database and is user-owned. Legacy provider stars remain stored. |
| Search / filter / sort | Changed | Done | Fewer controls can still support useful retrieval. | Compact Status / Type / Month / Year filtering replaces broad search and visible Sort controls; actual expense dates determine order automatically. |
| Dashboard | Changed | Done | Household totals are more useful than isolated grocery statistics. | Total Spend (This Month / Last 3 Months / All Time), Total Amount Due, Summary, and a distinct-color three-month stacked spending chart replaced the original monthly stats and grocery chart. |
| Grocery receipt photos | Shipped and extended | Done | Private storage can be reused across transaction types. | Optional receipt photos shipped for groceries and service/maintenance expenses. |
| Upcoming / Due maintenance | Changed | Done | Scheduling should follow the actual transaction date. | Future purchase_date / visit_date records are Upcoming; today/past are History, both inside Expenses; next_service_date remains stored but is no longer the UI model. |
| Monthly grocery budget | Cut from final UI | Done | Simplification can preserve historical data without retaining every screen. | Budget controls were removed from the final product; the budgets table and history were preserved. |
| Payment / reimbursement | Added | Done | Amount does not establish whether a bill is paid. | Paid / Unpaid is standardized; History offers Mark Paid using paid for visits and reimbursed internally for groceries, without deleting records. |
| Navigation | Changed | Done | Consolidation reduces competing destinations. | Dashboard / Expenses / Settings gear (Log Out); standalone Groceries, Amount Due, Upcoming and History destinations redirect to Expenses. |
| Provider detail page | Retired from normal flow | Done | The expense, not the provider directory, is the primary object. | Provider detail redirects to Expenses; provider records remain available for service expense creation, with legacy provider stars retained in the database. |
| Database model | Preserved with additions | Done | Visible simplification does not require destructive migrations. | Seven tables remain, including the added expense_stars table, legacy provider stars, status/receipt fields and legacy category, next_service_date and budget data. |
| Technology | Changed | Done | Managed services can preserve the original technical goals. | The original direct-backend plan became Lovable Cloud for auth/database/storage, with React/TypeScript, TanStack Start, and GitHub source control. |
| Design | Changed | Done | A restrained hierarchy improves readability. | Classic black / white / ivory styling, compact controls, and distinct chart category colors replaced the earlier accent-led design. |
| Shared household access | Still out of scope | Backlogged | Stranger testing exposed demand for household sharing and permissions. | One account owns its records; household invitations, shared access and role-based permissions remain future work. |
| Stranger-test fix | Added | Done | A title must consistently identify the same kind of thing. | The stranger-test PR fix standardized Expense Type as every transaction detail heading, with Provider/Store and Service Performed in separate labeled fields. |
| Required tests and broader suite | Shipped | Done | Red/green checks establish that regression tests can fail meaningfully. | Both required tests retain red/green evidence; the broader suite covers validation, date grouping/order, financial calculations, settlement, routing, stars and detail reads. |
