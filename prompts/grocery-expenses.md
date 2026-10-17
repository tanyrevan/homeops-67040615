Build ONLY Feature 4 for HomeOps: grocery expense tracking.

IMPORTANT
- Work only on the current `feature-grocery-expenses` branch.
- Do not make changes directly to `main`.
- Use the existing `PLAN.md` as the product source of truth.
- Do not modify `PLAN.md`.
- Use the existing Lovable Cloud backend and authentication.
- Reuse the same general CRUD and receipt-upload patterns already built for maintenance visits where appropriate.
- Do not build stars, search/filter/sort, dashboard, Upcoming / Due, or budget features yet.
- Save this prompt and any important follow-up instructions in `prompts/grocery-expenses.md` on this same branch.
- Stop when grocery expense tracking is complete.

FEATURE GOAL

Add a top-level Groceries section where each signed-in user can track grocery purchases, spending, and receipt images.

Each grocery purchase should belong to exactly one authenticated user.

GROCERY PURCHASE FIELDS

Each grocery purchase should include:

- Purchase date — required
- Store — required
- Amount — required and must be 0 or greater
- Category — optional
- Notes — optional
- Receipt image — optional
- Created date/time

CATEGORY

Use these category choices:
- General Groceries
- Produce
- Meat / Seafood
- Dairy
- Household
- Snacks / Drinks
- Other

If the user selects "Other", show an optional text field where they can enter a custom category.

If a custom category is entered, save that custom value as the purchase category.

DATABASE

Create a `grocery_expenses` table with:

- id — uuid primary key
- user_id — uuid, required, owned by the authenticated user
- purchase_date — date, required
- store — text, required
- amount — numeric, required, must be >= 0
- category — text, optional
- notes — text, optional
- receipt_url — text or storage path, optional
- created_at — timestamp

SECURITY / DATA ISOLATION

Users must only be able to:
- view their own grocery purchases
- create grocery purchases for themselves
- edit their own grocery purchases
- delete their own grocery purchases
- access their own grocery receipt images

A user must never be able to access another user's grocery records or receipt images.

Enforce this through backend/database/storage rules, not only through the UI.

GROCERIES PAGE

Add a top-level "Groceries" section to HomeOps navigation.

The Groceries page should include:
- "Add Grocery Purchase" button
- Grocery purchase history
- Friendly empty state if the user has no purchases yet

Show grocery purchases newest first.

Each purchase in the list should clearly show:
- Purchase date
- Store
- Amount
- Category, if present
- Receipt indicator if an image exists

Allow the user to open a purchase to see its full details.

CREATE

The Add Grocery Purchase form should include:
- Purchase Date
- Store
- Amount
- Category
- Notes
- Optional Receipt Image upload

Validation:
- Purchase date is required
- Store is required
- Amount is required
- Amount cannot be negative
- Show friendly validation messages
- Receipt image is optional

RECEIPT IMAGE UPLOAD

Allow the user to optionally upload an image of the grocery receipt.

Requirements:
- Accept common image formats such as JPG, JPEG, PNG, and HEIC if supported
- Store files privately using Lovable Cloud storage
- Receipt files must only be accessible by the authenticated owner
- Store the file path/reference on the grocery expense record
- If a purchase has a receipt, show a "View Receipt" option
- Opening the receipt should display the uploaded image clearly
- If no receipt exists, do not show a broken image or empty receipt area
- When replacing a receipt during editing, update the record to reference the new file
- When deleting a grocery purchase, clean up its receipt file if practical and safe

DETAIL VIEW

The grocery purchase detail view should display:
- Purchase date
- Store
- Amount
- Category
- Notes
- Receipt image or View Receipt button if uploaded
- Edit button
- Delete button

EDIT

Users should be able to edit an existing grocery purchase.

The edit form should:
- pre-fill all current values
- allow date, store, amount, category, notes, and receipt to be changed
- apply the same validation rules as creation
- correctly handle custom categories entered through "Other"

DELETE

Users should be able to delete a grocery purchase.

Before deleting, show a confirmation such as:

"Are you sure you want to delete this grocery purchase?"

Do not delete until the user confirms.

After deletion:
- return to the Groceries page
- remove the purchase from history
- show a friendly success message if appropriate

UI

Keep the existing HomeOps visual style.

Make the Groceries feature:
- clean
- simple
- mobile-friendly
- easy for non-technical household users

Use clear labels such as:
- Add Grocery Purchase
- Purchase Date
- Store
- Amount
- Category
- Notes
- Upload Receipt
- View Receipt
- Edit Purchase
- Delete Purchase

DO NOT BUILD THESE YET

Do not add:
- starred providers
- global search/filter/sort
- dashboard charts or summary statistics
- Upcoming / Due page
- monthly grocery budgets

Those will be separate feature branches and pull requests.

PROMPT LOG

Create:

`prompts/grocery-expenses.md`

Save the important instructions from this prompt in that file.

Append any important follow-up prompts for this feature to the same file.

BEFORE FINISHING

Confirm:
- A signed-in user can add a grocery purchase.
- Purchase date is required.
- Store is required.
- Amount is required.
- Negative amounts are rejected.
- The purchase appears in grocery history.
- Purchases are sorted newest first.
- A purchase can be opened and viewed.
- A purchase can be edited.
- Delete requires confirmation.
- Confirmed deletion removes the purchase.
- An optional receipt image can be uploaded.
- A saved receipt can be viewed again later.
- Users can only access their own grocery purchases and receipt images.
- Logged-out users cannot access grocery pages.
- `prompts/grocery-expenses.md` exists.
- No later HomeOps features were built.

Stop after Feature 4 is complete.