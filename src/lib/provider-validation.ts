export const SERVICE_TYPES = ["Gardener", "Jacuzzi", "A/C", "Electrician", "Other"] as const;
export const PRESET_TYPES = SERVICE_TYPES.filter((t) => t !== "Other") as string[];

export type ProviderFormValues = {
  name: string;
  serviceChoice: string; // one of SERVICE_TYPES or ""
  customType: string;
  phone: string;
  notes: string;
};

export type ProviderErrors = Partial<Record<"name" | "serviceChoice" | "customType", string>>;

export function validateProvider(v: ProviderFormValues):
  | { ok: true; data: { name: string; service_type: string; phone_or_contact: string | null; notes: string | null } }
  | { ok: false; errors: ProviderErrors } {
  const errors: ProviderErrors = {};
  const name = v.name.trim();
  if (!name) errors.name = "Please enter the provider's name.";
  if (!(SERVICE_TYPES as readonly string[]).includes(v.serviceChoice)) {
    errors.serviceChoice = "Please choose a service type.";
  } else if (v.serviceChoice === "Other" && !v.customType.trim()) {
    errors.customType = "Please type the service type (for example, Plumber).";
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      name,
      service_type: v.serviceChoice === "Other" ? v.customType.trim() : v.serviceChoice,
      phone_or_contact: v.phone.trim() || null,
      notes: v.notes.trim() || null,
    },
  };
}

/** Turn a saved service type back into form fields (custom types map to "Other"). */
export function splitServiceType(saved: string): { serviceChoice: string; customType: string } {
  return PRESET_TYPES.includes(saved) ? { serviceChoice: saved, customType: "" } : { serviceChoice: "Other", customType: saved };
}
