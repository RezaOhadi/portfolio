"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getPurchaseById } from "@/lib/data/purchases";
import { sendPurchaseEmail } from "@/lib/email/purchase";

export async function resendPurchaseEmail(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id === "string" && id) {
    const purchase = await getPurchaseById(id);
    if (purchase) await sendPurchaseEmail(purchase);
  }
  revalidatePath("/admin/purchases");
  redirect("/admin/purchases?sent=1");
}
