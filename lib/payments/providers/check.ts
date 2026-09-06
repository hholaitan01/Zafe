/* ==========================================================================
   Self-check for the payment-provider seam. Pure logic only (no live keys, no
   network): Paystack webhook signature verification and event parsing, and the
   idempotency guard. Run: `npx tsx lib/payments/providers/check.ts`.
   ========================================================================== */

import { createHmac } from "node:crypto";

// Set the secret BEFORE importing modules that read it at load time.
process.env.PAYSTACK_SECRET_KEY = "sk_test_zafe_check_secret";
// Keep this check hermetic: with no Supabase configured, idempotency resolves to
// the in-memory store, so the base claims below hit no network.
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

let failures = 0;
function assert(name: string, cond: boolean) {
  if (cond) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.error(`FAIL  ${name}`);
  }
}

async function main() {
  const { verifySignature, paystackProvider } = await import("./paystack");
  const { claimOnce } = await import("../idempotency");
  const secret = process.env.PAYSTACK_SECRET_KEY!;
  const sign = (body: string) => createHmac("sha512", secret).update(body, "utf8").digest("hex");

  // --- signature verification ---
  const body = JSON.stringify({ event: "charge.success", data: { reference: "ZF-123", id: 999, status: "success" } });
  assert("valid signature verifies", verifySignature(body, sign(body)) === true);
  assert("wrong signature rejected", verifySignature(body, sign("tampered")) === false);
  assert("missing signature rejected", verifySignature(body, null) === false);
  assert("length-mismatch signature rejected", verifySignature(body, "abc") === false);

  // --- webhook parsing ---
  const good = paystackProvider.parseWebhook(body, new Headers({ "x-paystack-signature": sign(body) }));
  assert("parse: authenticated on good signature", good?.authenticated === true);
  assert("parse: funded on charge.success", good?.funded === true);
  assert("parse: reference extracted", good?.reference === "ZF-123");
  assert("parse: stable event id", good?.eventId === "paystack:999");

  const forged = paystackProvider.parseWebhook(body, new Headers({ "x-paystack-signature": "deadbeef" }));
  assert("parse: not authenticated on bad signature", forged?.authenticated === false);

  const pending = JSON.stringify({ event: "charge.pending", data: { reference: "ZF-9", id: 1, status: "pending" } });
  const p = paystackProvider.parseWebhook(pending, new Headers({ "x-paystack-signature": sign(pending) }));
  assert("parse: non-success event does not fund", p?.funded === false);

  assert("parse: garbage body returns null", paystackProvider.parseWebhook("{not json", new Headers()) === null);

  // --- idempotency (in-memory default) ---
  assert("claimOnce: first claim succeeds", (await claimOnce("evt-A")) === true);
  assert("claimOnce: repeat claim refused", (await claimOnce("evt-A")) === false);
  assert("claimOnce: distinct key succeeds", (await claimOnce("evt-B")) === true);

  // --- durable-store seam ---
  // A fake with the same semantics as the Supabase adapter (first insert true,
  // duplicate false, real error throws). Proves claimOnce delegates to whatever
  // store is active, and that a store error propagates so the webhook returns
  // non-200 and the provider retries instead of silently skipping the event.
  const { setStore } = await import("../idempotency");
  const seen = new Set<string>();
  setStore({
    async claim(k: string) {
      if (k === "boom") throw new Error("db down");
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    },
  });
  assert("durable: first claim true", (await claimOnce("dur-1")) === true);
  assert("durable: repeat claim false", (await claimOnce("dur-1")) === false);
  let propagated = false;
  try {
    await claimOnce("boom");
  } catch {
    propagated = true;
  }
  assert("durable: store error propagates (webhook will retry)", propagated === true);

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
