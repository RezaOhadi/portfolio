/**
 * Username rules shared by the browser (live check) and the server (the only
 * place a username is ever written). 3-20 characters: letters, numbers and
 * underscore. Uniqueness is case-insensitive (see supabase/accounts.sql).
 */
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

/** Handles that would be confusing or impersonate the site owner. */
const RESERVED = new Set([
  "admin", "administrator", "root", "support", "help", "staff", "owner",
  "reza", "rezaohadi", "reza_ohadi", "ohadi", "official",
  "account", "accounts", "me", "login", "signin", "signup", "settings",
  "null", "undefined", "anonymous", "guest", "store", "library", "piano",
]);

export type UsernameProblem = "short" | "long" | "chars" | "reserved";

/** Returns why a candidate is not acceptable, or null when it is. */
export function usernameProblem(raw: string): UsernameProblem | null {
  const value = raw.trim();
  if (value.length < USERNAME_MIN) return "short";
  if (value.length > USERNAME_MAX) return "long";
  if (!USERNAME_RE.test(value)) return "chars";
  if (RESERVED.has(value.toLowerCase())) return "reserved";
  return null;
}

export const USERNAME_MESSAGES: Record<UsernameProblem | "taken", string> = {
  short: `At least ${USERNAME_MIN} characters.`,
  long: `At most ${USERNAME_MAX} characters.`,
  chars: "Letters, numbers and underscores only.",
  reserved: "That name is reserved.",
  taken: "That name is already taken.",
};
