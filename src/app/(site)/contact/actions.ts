"use server";

import { env } from "@/lib/env";
import { sendEmail, emailLayout } from "@/lib/email";
import { contactSchema } from "@/lib/validation";

export interface ContactState {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string>;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );
}

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Honeypot — bots fill hidden fields. Pretend success, do nothing.
  if (formData.get("company")) {
    return { status: "success", message: "Thank you — your message has been sent." };
  }
  // Time trap — submissions faster than 2s are almost certainly bots.
  const startedAt = Number(formData.get("startedAt") ?? 0);
  if (startedAt && Date.now() - startedAt < 1500) {
    return { status: "success", message: "Thank you — your message has been sent." };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    inquiryType: formData.get("inquiryType"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!errors[key]) errors[key] = issue.message;
    }
    return { status: "error", message: "Please check the highlighted fields.", errors };
  }

  const { name, email, inquiryType, message } = parsed.data;

  const html = emailLayout(
    `New ${inquiryType.toLowerCase()} inquiry`,
    `<p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#cfcfd6;">
      <strong style="color:#f2eee6;">From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;<br/>
      <strong style="color:#f2eee6;">Type:</strong> ${escapeHtml(inquiryType)}
     </p>
     <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#e7e1d4;white-space:pre-line;">${escapeHtml(message)}</p>`,
  );

  const result = await sendEmail({
    to: env.contactTo,
    subject: `New ${inquiryType} inquiry — ${name}`,
    html,
    replyTo: email,
  });

  if (result.ok) {
    return { status: "success", message: "Thank you — your message has been sent." };
  }
  if (result.skipped) {
    // Email delivery not configured (e.g. local/demo). Don't lose the message UX.
    return {
      status: "success",
      message:
        "Thanks! Your message was received. (Email delivery isn't configured in this environment yet.)",
    };
  }
  return {
    status: "error",
    message: "Something went wrong sending your message. Please email directly.",
  };
}
