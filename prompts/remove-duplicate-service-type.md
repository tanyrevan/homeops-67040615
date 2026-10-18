Fix a duplicate field in the Add Expense service-provider flow that was found during final QA.

Current issue:
When a user selects a service Expense Type such as Electrician, the form later asks them to select "Service type" again. These represent the same concept in the final HomeOps workflow and this is confusing/redundant.

Please make the following change:

1. Keep "Expense Type" as the single user-facing category selection.
   Examples:
   - Gardener
   - Jacuzzi
   - Aircon
   - Electrician
   - other existing/custom service types

2. Remove the "Service type" field entirely from the user-facing Add Expense/provider form.

3. Do NOT change the database schema or delete existing fields/data.

4. If the existing provider/service_type database field is required internally, automatically populate it from the selected Expense Type.
   Example:
   Expense Type = Electrician
   → internally save service_type = Electrician

5. Keep the Name field separate.
   Name should represent the actual provider/person/company entered by the user, for example:
   - ABC Electric
   - Maria's Gardening

6. Preserve:
   - Phone/contact
   - Notes
   - all later expense/visit fields
   - editing
   - deleting
   - receipts
   - Paid/Unpaid behavior
   - existing records
   - authentication/data isolation

7. Existing records must continue displaying correctly.

8. Add/update tests so that:
   - users select the service category only once
   - no visible Service type field remains
   - the selected Expense Type is still saved correctly internally where needed
   - existing service records still load correctly

9. Save this prompt in:
   prompts/remove-duplicate-service-type.md

Run the full automated test suite and build afterward.

Do not make unrelated UI or workflow changes.