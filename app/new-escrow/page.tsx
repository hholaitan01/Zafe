"use client";

/* New Escrow — real inputs (in the design markup). Creating the deal runs the
   Trust Score automatically *if* a chat was pasted (it's optional), then goes
   straight to Payment, where the scam/Trust banner and the seller's standing
   are shown before the buyer pays. */

import { useRouter } from "next/navigation";
import { useState } from "react";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/new-escrow";
import { getCurrentUser } from "@/lib/auth";
import { createDeal, setCurrentDealId } from "@/lib/client";

export default function Page() {
  const router = useRouter();
  const [err, setErr] = useState<string>();

  const actions = {
    createDeal: async (fields: Record<string, string>) => {
      const amount = Number(String(fields.amount || "").replace(/[^0-9.]/g, "")) || 0;
      const title = fields.title?.trim() || "";
      const seller = fields.seller?.trim() || "";

      // Amount + item are required to fund; the chat is optional.
      if (amount <= 0 || !title) {
        setErr("Enter an amount and what you're buying to continue.");
        return;
      }
      setErr(undefined);

      // In demo mode the server has no session, so pass the buyer's email so the
      // deal is attributed to them. In live mode the server uses the session.
      const me = await getCurrentUser().catch(() => null);
      const deal = await createDeal({
        item: { title, amount, currency: "NGN" },
        seller: { name: seller || "Unknown seller", contact: seller || undefined },
        chat: fields.chat?.trim() || undefined,
        buyerEmail: me?.email,
      });
      setCurrentDealId(deal.id);
      router.push("/fund");
    },
  };

  return <ScreenHtml html={html} data={{ err }} actions={actions} />;
}
