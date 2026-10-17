Add ONLY the first required automated test for HomeOps: data isolation.

IMPORTANT
- Work only on the current `test-data-isolation` branch.
- Do not make changes directly to `main`.
- Do not modify PLAN.md.
- Do not build any new product features.
- Save this prompt and any important follow-up instructions in `prompts/test-data-isolation.md`.
- The final committed state must have all tests passing.

TEST REQUIREMENT

Create an automated test that verifies:

Given User A has HomeOps records,
when User B is the signed-in user,
then User B cannot see User A's records.

Use two clearly separate test users / user IDs in the test setup.

The test should verify at least one real user-owned HomeOps data type, preferably service providers or grocery expenses.

For example:
- User A owns Provider A
- User B owns Provider B
- Query/load records as User B
- User B should receive Provider B
- User B should NOT receive Provider A

The goal is to prove that records belonging to one user are not exposed to another user.

TEST IMPLEMENTATION

- Use the existing test framework already in the project.
- Keep the test deterministic.
- Do not depend on real production user accounts.
- Use test fixtures, mocks, or a safe isolated test setup as appropriate.
- Do not weaken the real production database security rules.
- Name the test clearly so it is obvious that it checks user data isolation.

RED → GREEN EVIDENCE

The class assignment requires evidence that the test can catch a broken feature.

After the correct test is written:

1. GREEN BASELINE
- Run the test in the correct implementation.
- Confirm it passes.

2. TEMPORARY RED TEST
- Temporarily break the application logic being tested in a safe, reversible way so User B would incorrectly receive User A's record.
- Do NOT weaken or alter the live production database security configuration.
- Prefer temporarily changing the application/testable data-access logic on this branch.
- Run the test again.
- Confirm the test fails for the expected reason.
- Clearly show the failing test output so I can take a screenshot for the assignment.

3. RESTORE GREEN
- Restore the correct isolation logic immediately.
- Run the same test again.
- Confirm it passes.
- Clearly show the passing test output so I can take a second screenshot.

IMPORTANT:
- Do not leave the intentionally broken implementation in the final code.
- Final branch state must be secure and all tests must pass.

DOCUMENTATION

Create a short file:

`tests/data-isolation-evidence.md`

Include:

1. Test in plain English
Explain in simple language what the test checks.

2. Red result
Briefly explain what was temporarily changed and why the test failed.

3. Green result
Explain that the correct ownership filtering/security was restored and the test passed.

4. What would break this test
Include one sentence describing a realistic code change that would make the test fail, such as:
"Removing the ownership check from the provider query could allow one user to receive another user's records."

Do not fabricate screenshots. I will take screenshots of the real failing and passing test output.

PROMPT LOG

Create:

`prompts/test-data-isolation.md`

Save the important instructions from this prompt in that file.

BEFORE FINISHING

Confirm:
- The automated data isolation test exists.
- The test uses two different users.
- User B cannot receive User A's record in the correct implementation.
- You demonstrated a temporary failing/red result.
- You restored the implementation.
- The same test passes afterward.
- All final tests pass.
- `tests/data-isolation-evidence.md` exists.
- `prompts/test-data-isolation.md` exists.
- No production feature was left intentionally broken.
- No unrelated HomeOps features were added.

Stop after the data isolation test and evidence documentation are complete.