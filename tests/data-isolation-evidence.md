# Data Isolation Test — Evidence

Test file: `src/test/data-isolation.test.ts` ("User B cannot see User A's service providers")
Logic under test: `filterOwnedRecords` in `src/lib/ownership.ts`, used by the provider list loader.

## 1. Test in plain English
Two separate test users exist: User A owns "Provider A" and User B owns "Provider B". When records are loaded for User B, the test checks that User B gets Provider B and does **not** get Provider A. It uses fixed fake data and IDs, so it never touches real accounts or the live database.

## 2. Red result
The ownership check in `filterOwnedRecords` was temporarily replaced so it returned every record. The test then failed with:
`AssertionError: expected [ 'Provider A', 'Provider B' ] to not include 'Provider A'`
— meaning User B was wrongly shown User A's provider. The live database security rules were not changed.

## 3. Green result
The ownership filter (`row.user_id === signed-in user's id`) was restored and the same test passed again. The full test suite passes.

## 4. What would break this test
Removing the ownership check from the provider loading logic could let one user receive another user's service providers.
