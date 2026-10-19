import { sendEmail, type SendResult } from "./index";
import { env } from "@/lib/env";
import { absoluteUrl } from "@/lib/utils";
import { formatMoment, type RequestInfo } from "@/lib/account/request-info";

/**
 * Member account emails: welcome, new sign-in, password changed, password
 * code. Same dark lacquer and champagne gold as the confirmation email
 * (supabase/email-templates), sent by the app through Resend from the
 * account address (env.accountEmailFrom).
 */

const INK = "#0a0a0c";
const CARD = "#111214";
const IVORY = "#f2eee6";
const GOLD = "#e0c17e";
const GOLD_DEEP = "#bf9a52";
const SILVER = "#b9b9c2";
const MUTE = "#6f6f78";
const FAINT = "#55555f";
const SANS = "Arial,Helvetica,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

export function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

interface Shell {
  preheader: string;
  kicker?: string;
  title: string;
  /** Inner HTML of the card below the title. */
  body: string;
  /** Small print under the card. */
  footer: string;
}

/** The shared frame: wordmark, lacquer card with a gold rule, small print. */
export function memberEmailLayout({ preheader, kicker = "Members", title, body, footer }: Shell): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${INK};color:${IVORY};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${INK};">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
            <tr>
              <td style="padding:0 8px 22px;font-family:${SERIF};font-size:26px;line-height:1;color:${IVORY};">
                Reza Ohadi<span style="color:${GOLD};">.</span>
                <div style="margin-top:8px;font-family:${SANS};font-size:9px;letter-spacing:4px;text-transform:uppercase;color:${GOLD_DEEP};">Pianist &middot; Composer</div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px;background:${CARD};border:1px solid #3a3120;border-top:1px solid ${GOLD};border-radius:8px;">
                <div style="font-family:${SANS};font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${GOLD};">${escapeHtml(kicker)}</div>
                <h1 style="margin:14px 0 10px;font-family:${SERIF};font-size:30px;font-weight:400;line-height:1.15;color:${IVORY};">${title}</h1>
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:22px 8px 0;font-family:${SANS};font-size:11px;line-height:1.6;color:${FAINT};">
                ${footer}<br />
                Reza Ohadi &mdash; Pianist &amp; Composer
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function paragraph(html: string, options: { muted?: boolean; top?: number } = {}) {
  return `<p style="margin:${options.top ?? 0}px 0 ${options.muted ? 0 : 22}px;font-family:${SANS};font-size:${options.muted ? 12 : 15}px;line-height:1.7;color:${options.muted ? MUTE : SILVER};">${html}</p>`;
}

export function button(href: string, label: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 26px;">
  <tr>
    <td align="center" bgcolor="${GOLD}" style="border-radius:999px;background:${GOLD};">
      <a href="${href}" style="display:inline-block;padding:15px 30px;border-radius:999px;background:${GOLD};color:#1b1307;font-family:${SANS};font-size:12px;font-weight:bold;letter-spacing:2.5px;text-transform:uppercase;text-decoration:none;">${label}</a>
    </td>
  </tr>
</table>`;
}

/** A small ledger: when, where, which browser. */
export function details(rows: [string, string][]) {
  const cells = rows
    .map(
      ([k, v]) => `<tr>
      <td style="padding:9px 0;border-top:1px solid #26231c;font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${GOLD_DEEP};white-space:nowrap;vertical-align:top;">${escapeHtml(k)}</td>
      <td style="padding:9px 0 9px 18px;border-top:1px solid #26231c;font-family:${SANS};font-size:14px;line-height:1.5;color:${IVORY};">${escapeHtml(v)}</td>
    </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;border-bottom:1px solid #26231c;">${cells}</table>`;
}

function link(href: string, label: string) {
  return `<a href="${href}" style="color:${GOLD};text-decoration:none;border-bottom:1px solid ${GOLD_DEEP};">${label}</a>`;
}

function eventRows(info: RequestInfo): [string, string][] {
  const rows: [string, string][] = [
    ["When", formatMoment(info.at, info.timeZone)],
    ["Browser", info.browser],
    ["Where", info.location],
  ];
  if (info.ip) rows.push(["Address", info.ip]);
  return rows;
}

function send(to: string, subject: string, html: string): Promise<SendResult> {
  return sendEmail({ to, subject, html, from: env.accountEmailFrom });
}

/* ------------------------------------------------------------------------ */

/** 1. Welcome: the account exists and the address is confirmed. */
export function sendWelcomeEmail(to: string, name: string | null) {
  const greeting = name ? `Welcome, ${escapeHtml(name)}` : "Welcome";
  const html = memberEmailLayout({
    preheader: "Your account is ready. Every score you buy now stays in one place.",
    title: greeting,
    body:
      paragraph(
        "Thank you for joining. Your account keeps every score you purchase in one place, ready to download again whenever you need it, on any device.",
      ) +
      button(absoluteUrl("/store"), "Browse the catalogue") +
      paragraph(
        `Your scores and settings live at ${link(absoluteUrl("/account"), "your account")}. For your security, we will also write to this address whenever your account is signed in from a new browser, and whenever your password changes.`,
        { muted: true },
      ),
    footer: `Sent to ${escapeHtml(to)} because an account was created with this address.`,
  });
  return send(to, "Welcome · Reza Ohadi", html);
}

/** 2. New sign-in from a browser this account has not used before. */
export function sendNewSignInEmail(to: string, info: RequestInfo) {
  const html = memberEmailLayout({
    preheader: `New sign-in from ${info.browser}, ${info.location}.`,
    kicker: "Security",
    title: "New sign-in to your account",
    body:
      paragraph("Your account was just signed in from a browser or device it had not used before.") +
      details(eventRows(info)) +
      paragraph("If this was you, there is nothing to do.", { muted: false }) +
      paragraph(
        `If it was not you, change your password straight away: that signs out every other device at once. If you cannot sign in, ${link(absoluteUrl("/forgot-password"), "reset your password")} instead.`,
      ) +
      button(absoluteUrl("/account/password"), "Change my password") +
      paragraph(
        `Still worried? ${link(absoluteUrl("/contact"), "Write to us")} and we will help.`,
        { muted: true },
      ),
    footer: `Sent to ${escapeHtml(to)} because it is the address on this account. The location is an estimate from the network address and can be off by a city or more.`,
  });
  return send(to, "New sign-in to your account · Reza Ohadi", html);
}

/** 3. The password was changed or set. */
export function sendPasswordChangedEmail(to: string, info: RequestInfo, firstPassword: boolean) {
  const html = memberEmailLayout({
    preheader: firstPassword ? "A password was added to your account." : "Your password was changed.",
    kicker: "Security",
    title: firstPassword ? "A password was added" : "Your password was changed",
    body:
      paragraph(
        firstPassword
          ? "A password was just set on your account, so you can now sign in with your email and password as well as with Google."
          : "The password on your account was just changed. Every other device has been signed out; only the one that made the change stays signed in.",
      ) +
      details(eventRows(info)) +
      paragraph(
        `If this was you, there is nothing to do. If it was not, ${link(absoluteUrl("/forgot-password"), "reset your password now")} using the link we email you, then ${link(absoluteUrl("/contact"), "let us know")}.`,
      ) +
      button(absoluteUrl("/forgot-password"), "Reset my password"),
    footer: `Sent to ${escapeHtml(to)} because it is the address on this account.`,
  });
  return send(to, firstPassword ? "A password was added to your account · Reza Ohadi" : "Your password was changed · Reza Ohadi", html);
}

/** 4. One-time code for a member without a password who is setting one. */
export function sendPasswordCodeEmail(to: string, code: string, minutes: number) {
  const digits = code
    .split("")
    .map((d) => `<span style="display:inline-block;min-width:30px;padding:10px 0;margin:0 3px;border:1px solid #3a3120;border-radius:6px;background:${INK};font-family:${SERIF};font-size:30px;line-height:1;color:${GOLD};text-align:center;">${escapeHtml(d)}</span>`)
    .join("");
  const html = memberEmailLayout({
    preheader: `Your security code is ${code}.`,
    kicker: "Security",
    title: "Your security code",
    body:
      paragraph("Enter this code on the page where you are setting your password. It confirms that it is really you.") +
      `<div style="margin:0 0 26px;letter-spacing:0;">${digits}</div>` +
      paragraph(
        `The code works for the next ${minutes} minutes and only once. If you did not ask for it, you can ignore this email; nothing changes without the code.`,
        { muted: true },
      ),
    footer: `Sent to ${escapeHtml(to)} because it is the address on this account.`,
  });
  return send(to, `${code} is your security code · Reza Ohadi`, html);
}
