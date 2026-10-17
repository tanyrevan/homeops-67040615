import { describe, expect, it } from "vitest";
import { SERVICE_TYPES, splitServiceType, validateProvider } from "@/lib/provider-validation";

const base = { name: "Ana", serviceChoice: "Gardener", customType: "", phone: "", notes: "" };

describe("provider validation", () => {
  it("offers exactly the five service type choices", () => {
    expect([...SERVICE_TYPES]).toEqual(["Gardener", "Jacuzzi", "A/C", "Electrician", "Other"]);
  });
  it("requires a name", () => {
    const r = validateProvider({ ...base, name: "  " });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.name).toBeDefined();
  });
  it("requires a service type", () => {
    const r = validateProvider({ ...base, serviceChoice: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.serviceChoice).toBeDefined();
  });
  it("requires custom text when Other is chosen", () => {
    const r = validateProvider({ ...base, serviceChoice: "Other", customType: " " });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.customType).toBeDefined();
  });
  it("saves the custom text as the service type", () => {
    const r = validateProvider({ ...base, serviceChoice: "Other", customType: "Plumber" });
    expect(r.ok && r.data.service_type).toBe("Plumber");
  });
  it("maps custom saved types back to Other when editing", () => {
    expect(splitServiceType("Plumber")).toEqual({ serviceChoice: "Other", customType: "Plumber" });
    expect(splitServiceType("A/C")).toEqual({ serviceChoice: "A/C", customType: "" });
  });
});
