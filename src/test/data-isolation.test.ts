import { describe, expect, it } from "vitest";
import { filterOwnedRecords } from "@/lib/ownership";

const USER_A = "aaaaaaaa-0000-4000-8000-00000000000a";
const USER_B = "bbbbbbbb-0000-4000-8000-00000000000b";
const providers = [
  { id: "provider-a", user_id: USER_A, name: "Provider A", service_type: "Gardener" },
  { id: "provider-b", user_id: USER_B, name: "Provider B", service_type: "Electrician" },
];

describe("user data isolation", () => {
  it("User B cannot see User A's service providers", () => {
    const visibleToB = filterOwnedRecords(providers, USER_B);
    expect(visibleToB.map((p) => p.name)).toContain("Provider B");
    expect(visibleToB.map((p) => p.name)).not.toContain("Provider A");
  });
});
