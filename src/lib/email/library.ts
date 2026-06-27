import { sendEmail, emailLayout, type SendResult } from "./index";
import { absoluteUrl, formatDate } from "@/lib/utils";
import type { Purchase } from "@/lib/types";

/** Emails a customer secure links to every score they've purchased. */
export async function sendLibraryEmail(
  email: string,
  purchases: Purchase[],
): Promise<SendResult> {
  const rows = purchases
    .map((p) => {
      const url = absoluteUrl(`/api/download?token=${p.downloadToken}`);
      return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
          <div style="font-family:Georgia,serif;font-size:18px;color:#f2eee6;">${escape(p.productTitle ?? "Sheet music")}</div>
          <div style="font-family:Arial,sans-serif;font-size:12px;color:#9a9aa6;">${formatDate(p.createdAt)}</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.1);text-align:right;">
          <a href="${url}" style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#0a0a0c;background:#f2eee6;text-decoration:none;padding:10px 16px;">Download</a>
        </td>
      </tr>`;
    })
    .join("");

  const html = emailLayout(
    "Your download library",
    `<p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#cfcfd6;">
       Here are secure links to every score you've purchased. Each link generates a
       fresh, time-limited download.
     </p>
     <table style="width:100%;border-collapse:collapse;margin-top:8px;">${rows}</table>`,
  );

  return sendEmail({
    to: email,
    subject: "Your Reza Ohadi download library",
    html,
  });
}

function escape(s: string) {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );
}
