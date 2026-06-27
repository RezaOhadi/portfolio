import { sendEmail, emailLayout, type SendResult } from "./index";
import { absoluteUrl, formatPrice } from "@/lib/utils";
import type { Purchase } from "@/lib/types";

/**
 * Sends the purchase confirmation with a secure download link. The link points
 * at our own /api/download endpoint (which mints a fresh signed URL each time),
 * so it keeps working while the underlying storage URLs stay short-lived.
 */
export async function sendPurchaseEmail(purchase: Purchase): Promise<SendResult> {
  const downloadUrl = absoluteUrl(`/api/download?token=${purchase.downloadToken}`);
  const libraryUrl = absoluteUrl(`/library`);
  const title = purchase.productTitle ?? "Your sheet music";

  const html = emailLayout(
    "Your score is ready",
    `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#cfcfd6;">
       Thank you for your purchase of
       <strong style="color:#f2eee6;">${escape(title)}</strong>
       (${formatPrice(purchase.amountCents, purchase.currency)}).
     </p>
     <p style="margin:28px 0;">
       <a href="${downloadUrl}" style="display:inline-block;background:#f2eee6;color:#0a0a0c;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:16px 28px;">Download your PDF</a>
     </p>
     <p style="font-family:Arial,sans-serif;font-size:13px;line-height:1.7;color:#9a9aa6;">
       This is a personal, secure link. You can also access your purchases anytime from your
       <a href="${libraryUrl}" style="color:#f2eee6;">download library</a>.
     </p>
     <p style="font-family:Arial,sans-serif;font-size:12px;color:#6f6f78;">Order reference: ${purchase.stripeSessionId?.slice(-12) ?? purchase.id.slice(-12)}</p>`,
  );

  return sendEmail({
    to: purchase.customerEmail,
    subject: `Your score: ${title}`,
    html,
  });
}

function escape(s: string) {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );
}
