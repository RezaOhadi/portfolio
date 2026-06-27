"use server";

import { libraryLookupSchema } from "@/lib/validation";
import { getPurchasesByEmail } from "@/lib/data/purchases";
import { sendLibraryEmail } from "@/lib/email/library";

export interface LibraryState {
  status: "idle" | "success" | "error";
  message?: string;
}

/**
 * Anti-enumeration: we ALWAYS return the same generic message, regardless of
 * whether the email has purchases. Links are delivered only by email, never
 * shown on screen — so a guest can't browse someone else's library by guessing.
 */
export async function requestLibraryAccess(
  _prev: LibraryState,
  formData: FormData,
): Promise<LibraryState> {
  const parsed = libraryLookupSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  const purchases = await getPurchasesByEmail(parsed.data.email);
  if (purchases.length > 0) {
    await sendLibraryEmail(parsed.data.email, purchases);
  }

  return {
    status: "success",
    message:
      "If we found purchases for that address, a secure link to your library is on its way. Please check your inbox (and spam folder).",
  };
}
