"use client";

/* Dispute — runs the AI dispute judge on the case shown and binds its real
   recommendation (decision, split amounts, rationale) into Deji's mediator card. */

import { useEffect, useState } from "react";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/dispute";
import { getCurrentDealId, getDeal, judgeDispute, naira } from "@/lib/client";

// The two sides shown on the screen.
const BUYER = { claim: "Screen has a dead pixel line, not shown in the listing photos.", evidence: ["Close-up photo", "Unboxing video"] };
const SELLER = { claim: "Item was fine when shipped. Willing to refund part of it.", evidence: ["Pre-ship photo"] };
const LABEL: Record<string, string> = { release_to_seller: "PAY SELLER", refund_buyer: "FULL REFUND", split: "PARTIAL REFUND" };

export default function Page() {
  const [data, setData] = useState<Record<string, string | number>>();

  useEffect(() => {
    let alive = true;
    (async () => {
      let amount = 450000;
      const id = getCurrentDealId();
      if (id) {
        try {
          const d = await getDeal(id);
          if (d?.item?.amount) amount = d.item.amount;
        } catch {
          /* fall back to the default amount */
        }
      }
      try {
        const r = await judgeDispute({ item: { title: "disputed item", amount, currency: "NGN" }, amount, buyer: BUYER, seller: SELLER });
        const buyerShare =
          r.decision === "refund_buyer" ? amount : r.decision === "split" ? Math.round(amount * (r.splitBuyerPercent / 100)) : 0;
        const sellerShare = amount - buyerShare;
        if (alive) {
          setData({
            decisionLabel: LABEL[r.decision] ?? "REVIEWED",
            toSeller: naira(sellerShare),
            toBuyer: naira(buyerShare),
            rationale: r.rationale,
          });
        }
      } catch {
        /* leave the design defaults if the judge call fails */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return <ScreenHtml html={html} data={data} />;
}
