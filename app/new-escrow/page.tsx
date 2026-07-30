"use client";

/* New Escrow — real inputs (in the design markup) → createDeal → route to the
   Trust Score result for this deal. */

import { useRouter } from "next/navigation";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/new-escrow";
import { createDeal, setCurrentDealId } from "@/lib/client";

export default function Page() {
  const router = useRouter();

  const actions = {
    createDeal: async (fields: Record<string, string>) => {
      const amount = Number(String(fields.amount || "").replace(/[^0-9.]/g, "")) || 0;
      const deal = await createDeal({
        item: { title: fields.title?.trim() || "Untitled item", amount, currency: "NGN" },
        seller: { name: fields.seller?.trim() || "Unknown seller" },
        chat: fields.chat?.trim() || undefined,
      });
      setCurrentDealId(deal.id);
      // Deji's naming: /trust-score = the SAFE (green) screen, /trust-score-high = RISKY (red).
      router.push(deal.trust?.verdict === "safe" ? "/trust-score" : "/trust-score-high");
    },
  };

  return <ScreenHtml html={html} actions={actions} />;
}
