import { NextResponse } from "next/server";
import { usernameProblem } from "@/lib/username";
import { isUsernameAvailable } from "@/lib/data/profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live availability check for the sign-up and username forms.
 * GET /api/account/username?u=<candidate>
 *   -> { available: true } | { available: false, reason } | { available: null }
 * `null` means it could not be checked (service role not configured); the
 * form then relies on the server-side check at save time.
 */
export async function GET(req: Request) {
  const candidate = (new URL(req.url).searchParams.get("u") ?? "").trim();
  const headers = { "Cache-Control": "no-store" };

  const problem = usernameProblem(candidate);
  if (problem) return NextResponse.json({ available: false, reason: problem }, { headers });

  const available = await isUsernameAvailable(candidate);
  if (available === null) return NextResponse.json({ available: null }, { headers });
  return NextResponse.json(
    available ? { available: true } : { available: false, reason: "taken" },
    { headers },
  );
}
