import { z } from "zod";

// Verified against the hosted signup service; keep login's existing minimum.
export const MIN_PASSWORD_LENGTH = 6;
export const passwordSchema = z.string().min(MIN_PASSWORD_LENGTH);

type PasswordError = { message: string; reasons?: string[] };

export function passwordFailure(error: PasswordError) {
  const message = error.message.toLowerCase();
  if (error.reasons?.includes("pwned") || /breach|leaked|compromised/.test(message))
    return { kind: "compromised" } as const;
  if (error.reasons?.includes("characters") || /password.*contain/.test(message))
    return { kind: "characters" } as const;
  const length = message.match(/(?:at least|minimum(?: of)?)\s+(\d+)\s+characters/);
  if (length) return { kind: "length", minimum: Number(length[1]) } as const;
  return { kind: "other" } as const;
}

export function friendlyPasswordError(error: PasswordError) {
  const failure = passwordFailure(error);
  if (failure.kind === "length")
    return `Please use a password with at least ${failure.minimum} characters.`;
  if (failure.kind === "compromised")
    return "This password has appeared in a data breach. Please choose a different password.";
  if (failure.kind === "characters")
    return "Please choose a password with a mix of uppercase and lowercase letters, numbers, and symbols.";
  return "This password doesn't meet the security requirements. Please choose a different password.";
}