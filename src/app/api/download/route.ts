import { NextResponse } from "next/server";
import { getPurchaseByToken } from "@/lib/data/purchases";
import { getProductByIdAdmin } from "@/lib/data/products";
import { createSignedDownloadUrl } from "@/lib/supabase/storage";
import { absoluteUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Secure download. The `token` is the per-purchase secret. We verify it server
 * side, then 302-redirect to a freshly minted, short-lived signed URL. The
 * underlying storage path is never revealed to the client.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");

  const fail = (error: string) =>
    NextResponse.redirect(absoluteUrl(`/library?error=${error}`), 302);

  if (!token) return fail("missing");

  const purchase = await getPurchaseByToken(token);
  if (!purchase) return fail("invalid");
  if (purchase.status !== "paid") return fail("unpaid");

  const product = await getProductByIdAdmin(purchase.productId);
  if (!product?.pdfPath) return fail("unavailable");

  const filename = `${product.slug}.pdf`;
  const signed = await createSignedDownloadUrl(product.pdfPath, filename);
  if (!signed) return fail("unavailable");

  return NextResponse.redirect(signed, 302);
}
