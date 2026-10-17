"use server";

import { getMemberUser } from "@/lib/member";
import { isUsernameAvailable, setUsername } from "@/lib/data/profiles";
import { USERNAME_MESSAGES, usernameProblem } from "@/lib/username";

export interface UsernameState {
  status: "idle" | "success" | "error";
  message?: string;
}

/** Saves the member's handle. The only place a username is ever written. */
export async function saveUsername(
  _prev: UsernameState,
  formData: FormData,
): Promise<UsernameState> {
  const member = await getMemberUser();
  if (!member) return { status: "error", message: "Please sign in again." };

  const username = String(formData.get("username") ?? "").trim();
  const problem = usernameProblem(username);
  if (problem) return { status: "error", message: USERNAME_MESSAGES[problem] };

  const own = member.profile?.username ?? null;
  if (own === username) return { status: "success" };

  // Changing only the capitalisation of your own name is always allowed.
  const sameAsOwn = own !== null && own.toLowerCase() === username.toLowerCase();
  if (!sameAsOwn) {
    const available = await isUsernameAvailable(username);
    if (available === false) return { status: "error", message: USERNAME_MESSAGES.taken };
  }

  const result = await setUsername(member.id, username);
  if (!result.ok) {
    return {
      status: "error",
      message:
        result.reason === "taken"
          ? USERNAME_MESSAGES.taken
          : result.reason === "not_configured"
            ? "Usernames cannot be saved in this environment (service role key missing)."
            : "Could not save that right now. Please try again.",
    };
  }
  return { status: "success" };
}
