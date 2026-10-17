import { describe, expect, it } from "vitest";
import { passwordFailure, passwordSchema } from "@/lib/password-validation";

describe("Password validation", () => {
  it("rejects five characters", () => {
    expect(passwordSchema.safeParse("Ab7!x").success).toBe(false);
  });
  it("accepts exactly six characters", () => {
    expect(passwordSchema.safeParse("Ab7!xy").success).toBe(true);
  });
  it("accepts seven characters", () => {
    expect(passwordSchema.safeParse("Ab7!xyz").success).toBe(true);
  });
  it("uses the actual minimum reported by auth", () => {
    expect(passwordFailure({ message: "Password should be at least 8 characters." }))
      .toEqual({ kind: "length", minimum: 8 });
  });
  it("does not classify a breached password as too short", () => {
    expect(passwordFailure({ message: "Password is too weak", reasons: ["pwned"] }))
      .toEqual({ kind: "compromised" });
  });
  it("does not classify unspecified password errors as too short", () => {
    expect(passwordFailure({ message: "Password is too weak" }))
      .toEqual({ kind: "other" });
  });
});