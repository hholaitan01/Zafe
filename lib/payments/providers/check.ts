/* ==========================================================================
   Self-check for the payment-provider seam. Pure logic only (no live keys, no
   network): Paystack webhook signature verification and event parsing, and the
   idempotency guard. Run: `npx tsx lib/payments/providers/check.ts`.
   ========================================================================== */

import { createHmac } from "node:crypto";

// Set the secrets BEFORE importing modules that read them at load time.
process.env.PAYSTACK_SECRET_KEY = "sk_test_zafe_check_secret";
process.env.FLW_SECRET_HASH = "flw_test_zafe_verif_hash";

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

  // --- Flutterwave: verif-hash auth + event parsing ---
  const { verifyHash, flutterwaveProvider } = await import("./flutterwave");
  const flwHash = process.env.FLW_SECRET_HASH!;
  assert("flw: correct hash verifies", verifyHash(flwHash) === true);
  assert("flw: wrong hash rejected", verifyHash("nope") === false);
  assert("flw: missing hash rejected", verifyHash(null) === false);

  const flwBody = JSON.stringify({ event: "charge.completed", data: { tx_ref: "ZF-77", id: 42, status: "successful" } });
  const flwGood = flutterwaveProvider.parseWebhook(flwBody, new Headers({ "verif-hash": flwHash }));
  assert("flw: authenticated on correct hash", flwGood?.authenticated === true);
  assert("flw: funded on successful charge.completed", flwGood?.funded === true);
  assert("flw: reference from tx_ref", flwGood?.reference === "ZF-77");
  assert("flw: stable event id", flwGood?.eventId === "flutterwave:42");

  const flwForged = flutterwaveProvider.parseWebhook(flwBody, new Headers({ "verif-hash": "forged" }));
  assert("flw: not authenticated on wrong hash", flwForged?.authenticated === false);

  const flwPending = JSON.stringify({ event: "charge.completed", data: { tx_ref: "ZF-8", id: 2, status: "pending" } });
  const flwP = flutterwaveProvider.parseWebhook(flwPending, new Headers({ "verif-hash": flwHash }));
  assert("flw: non-success status does not fund", flwP?.funded === false);

  assert("flw: garbage body returns null", flutterwaveProvider.parseWebhook("{bad", new Headers()) === null);

  // --- idempotency ---
  assert("claimOnce: first claim succeeds", (await claimOnce("evt-A")) === true);
  assert("claimOnce: repeat claim refused", (await claimOnce("evt-A")) === false);
  assert("claimOnce: distinct key succeeds", (await claimOnce("evt-B")) === true);

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
