"use client";

/* New Escrow — real inputs (in the design markup) → createDeal → route to the
   Trust Score result for this deal. */

import { useRouter } from "next/navigation";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/new-escrow";
import { getCurrentUser } from "@/lib/auth";
import { createDeal, setCurrentDealId } from "@/lib/client";

export default function Page() {
  const router = useRouter();

  const actions = {
    createDeal: async (fields: Record<string, string>) => {
      const amount = Number(String(fields.amount || "").replace(/[^0-9.]/g, "")) || 0;
      // In demo mode the server has no session, so pass the buyer's email so the
      // deal is attributed to them (and counts toward their reputation). In live
      // mode the server overrides this with the trusted session identity.
      const me = await getCurrentUser().catch(() => null);
      const deal = await createDeal({
        item: { title: fields.title?.trim() || "Untitled item", amount, currency: "NGN" },
        seller: { name: fields.seller?.trim() || "Unknown seller" },
        chat: fields.chat?.trim() || undefined,
        buyerEmail: me?.email,
      });
      setCurrentDealId(deal.id);
      // Deji's naming: /trust-score = the SAFE (green) screen, /trust-score-high = RISKY (red).
      router.push(deal.trust?.verdict === "safe" ? "/trust-score" : "/trust-score-high");
    },
  };

  return <ScreenHtml html={html} actions={actions} />;
}
