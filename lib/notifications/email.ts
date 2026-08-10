/* ==========================================================================
   Email seam — the same live/demo pattern as deals, payments, and KYC.

   - LIVE: send via Resend when RESEND_API_KEY (and a from address) are set.
   - DEMO: no provider, so record the message to an in-memory outbox and log it,
     returning ok. This keeps the invite/notify flow working end-to-end with zero
     keys, and never blocks a deal on email.

   WhatsApp is intentionally left as a future channel: add a sendWhatsApp() here
   behind its own keys and call it alongside sendEmail() in lib/notifications.
   ========================================================================== */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailResult {
  ok: boolean;
  mode: "live" | "mock";
  id?: string;
  error?: string;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && (process.env.EMAIL_FROM || process.env.RESEND_FROM));
}

/** The demo outbox, so a dev/test can inspect what "would have been sent". */
const g = globalThis as unknown as { __trustflowOutbox?: EmailMessage[] };
export function outbox(): EmailMessage[] {
  if (!g.__trustflowOutbox) g.__trustflowOutbox = [];
  return g.__trustflowOutbox;
}

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  if (!emailConfigured()) {
    outbox().push(msg);
    if (process.env.NODE_ENV !== "production") {
      console.info(`[notifications] (demo) email to ${msg.to}: ${msg.subject}`);
    }
    return { ok: true, mode: "mock" };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || process.env.RESEND_FROM,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, mode: "live", error: `Email send failed (${res.status}). ${detail}`.trim() };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, mode: "live", id: data.id };
  } catch (e) {
    return { ok: false, mode: "live", error: e instanceof Error ? e.message : "Email send failed." };
  }
}
