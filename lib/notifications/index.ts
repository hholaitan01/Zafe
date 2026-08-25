/* ==========================================================================
   Notifications — composing and sending the messages Zafe sends outside a
   screen. Right now: telling a seller they've been asked to receive an escrow
   payment.

   Two cases, per the product spec:
   - The seller ISN'T a user yet → email them: "someone wants to pay you, register
     to receive it", with a link to sign up. Signing up with that email makes them
     the deal's seller automatically (the deal already names them by that contact).
   - The seller IS a user → they see the deal in their sales + activity in-app, and
     we also email their registered address that a new escrow is waiting.

   Everything here is best-effort: a failure never blocks creating the deal.
   ========================================================================== */

import type { Deal } from "@/lib/deals/types";
import { sendEmail } from "./email";

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://getzafe.vercel.app").replace(/\/$/, "");
}

function looksLikeEmail(v?: string): boolean {
  return !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function money(amount: number): string {
  try {
    return "₦" + amount.toLocaleString("en-NG");
  } catch {
    return "₦" + amount;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

/**
 * Notify the seller named on a deal that an escrow payment is waiting for them.
 * `isUser` decides the tone (welcome-and-register vs you-have-a-new-escrow).
 * No-ops quietly when the seller has no email contact.
 */
export async function notifySellerOfEscrow(deal: Deal, opts: { isUser: boolean }): Promise<void> {
  const to = deal.seller?.contact;
  if (!looksLikeEmail(to)) return; // only the email channel for now

  const amount = money(deal.item.amount);
  const item = escapeHtml(deal.item.title);
  const buyer = escapeHtml(deal.buyerEmail || "A buyer");
  const link = opts.isUser ? `${appUrl()}/selling` : `${appUrl()}/login`;
  const cta = opts.isUser ? "View the escrow" : "Register to receive your money";

  const subject = opts.isUser
    ? `New escrow: ${buyer} wants to pay you ${amount}`
    : `${buyer} wants to pay you ${amount} through Zafe escrow`;

  const intro = opts.isUser
    ? `You have a new protected payment waiting on Zafe. It's already in your sales.`
    : `Someone wants to pay you safely through Zafe escrow. The money is held securely and released to you once the buyer confirms delivery. Register with this email address to receive it.`;

  const text = [
    `${buyer} wants to pay you ${amount} for "${deal.item.title}" through Zafe escrow.`,
    "",
    opts.isUser
      ? "It's waiting in your sales."
      : "Zafe holds the money safely and releases it to you once the buyer confirms delivery. Register with this email address to receive it.",
    "",
    `${cta}: ${link}`,
  ].join("\n");

  const html = `
  <div style="font-family:'IBM Plex Sans',system-ui,Arial,sans-serif;max-width:520px;margin:0 auto;color:#0F172A">
    <div style="font-weight:800;font-size:18px;letter-spacing:-.02em;color:#0F172A;margin-bottom:18px">Zafe</div>
    <div style="background:#ECFDF5;border:1px solid #C7EAD9;border-radius:14px;padding:18px 20px">
      <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#059669">Escrow payment</div>
      <div style="font-size:26px;font-weight:800;letter-spacing:-.02em;margin-top:6px">${amount}</div>
      <div style="font-size:14px;color:#334155;margin-top:4px">for <b>${item}</b> · from ${buyer}</div>
    </div>
    <p style="font-size:15px;line-height:1.6;color:#334155;margin:18px 0">${escapeHtml(intro)}</p>
    <a href="${link}" style="display:inline-block;background:#059669;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:13px 22px;border-radius:12px">${cta}</a>
    <p style="font-size:12.5px;line-height:1.6;color:#94A3B8;margin-top:22px">Zafe holds the buyer's money in escrow. You're paid once the buyer confirms delivery, or automatically if they go silent past the timer. If you weren't expecting this, you can ignore this email.</p>
  </div>`;

  await sendEmail({ to: to as string, subject, html, text });
}
