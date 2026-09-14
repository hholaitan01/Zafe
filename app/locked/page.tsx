"use client";

/* Locked — the "payment secured / held safe" confirmation, bound to the real
   deal's amount and reference. Receipt / Track / Share actions are wired here. */

import { useEffect, useState } from "react";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/locked";
import { getCurrentDealId, getDeal, naira } from "@/lib/client";
import type { Deal } from "@/lib/deals/types";

export default function Page() {
  const [deal, setDeal] = useState<Deal | null>(null);

  useEffect(() => {
    const id = getCurrentDealId();
    if (!id) return;
    let alive = true;
    getDeal(id).then((d) => alive && setDeal(d)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const data = deal
    ? { amount: naira(deal.item.amount), escrowId: deal.reference }
    : undefined;

  const actions = {
    // Share a short proof of the held payment; fall back to the clipboard.
    shareReceipt: () => {
      if (!deal) return;
      const text = `Zafe escrow\n${naira(deal.item.amount)} held safe for ${deal.item.title}\nRef: ${deal.reference}`;
      if (navigator.share) {
        navigator.share({ title: "Zafe escrow", text }).catch(() => {});
        return;
      }
      navigator.clipboard?.writeText(text).catch(() => {});
    },
  };

  return <ScreenHtml html={html} data={data} actions={actions} />;
}
