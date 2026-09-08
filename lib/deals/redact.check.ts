/* ==========================================================================
   Self-check for the deal response projection (audit #6): the handover code and
   both payout/bank accounts are stripped from anything that leaves the API,
   while the rest of the deal is preserved.
   Run: `npx tsx lib/deals/redact.check.ts`.
   ========================================================================== */

export {}; // module scope

import type { Deal } from "./types";

let failures = 0;
function assert(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name}`); }
}

async function main() {
  const { publicDeal, publicDeals } = await import("./redact");

  const deal = {
    id: "d1",
    reference: "TF-ABCD2345",
    item: { title: "Phone", amount: 100000, currency: "NGN" },
    seller: { name: "S", contact: "s@x.com" },
    buyerEmail: "b@x.com",
    status: "shipped",
    handoverCode: "123456",
    sellerPayout: { bankCode: "058", accountNumber: "0011223344", accountName: "Seller" },
    buyerPayout: { bankCode: "044", accountNumber: "9988776655", accountName: "Buyer" },
    timeline: [],
    createdAt: "t",
    updatedAt: "t",
  } as unknown as Deal;

  const pub = publicDeal(deal)!;
  assert("handover code is stripped", pub.handoverCode === undefined);
  assert("seller payout/bank is stripped", pub.sellerPayout === undefined);
  assert("buyer payout/bank is stripped", pub.buyerPayout === undefined);
  assert("a masked payout hint is provided (bank + last 4)", pub.sellerPayoutMask === "058 ****3344");
  assert("non-sensitive fields are preserved", pub.id === "d1" && pub.reference === "TF-ABCD2345" && pub.status === "shipped");
  assert("buyer email (needed by the parties) is preserved", pub.buyerEmail === "b@x.com");
  assert("the original deal is not mutated", deal.handoverCode === "123456" && deal.sellerPayout !== undefined);

  const list = publicDeals([deal]);
  assert("publicDeals strips across a list", list[0]!.handoverCode === undefined && list[0]!.sellerPayout === undefined);

  assert("null passes through", publicDeal(null) === null);
  assert("undefined passes through", publicDeal(undefined) === undefined);

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
