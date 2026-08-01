"use client";

/* Request a payment — seller-initiated escrow. The seller enters the item,
   amount, and buyer contact; we create the deal with the signed-in user as the
   seller and the entered contact as the buyer, then return to My sales. */

import { useRouter } from "next/navigation";
import { useState } from "react";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/request";
import { getCurrentUser } from "@/lib/auth";
import { getSellerProfile, requestPayment } from "@/lib/client";

export default function Page() {
  const router = useRouter();
  const [err, setErr] = useState<string>();

  const actions = {
    request: async (fields: Record<string, string>) => {
      const amount = Number(String(fields.amount || "").replace(/[^0-9.]/g, "")) || 0;
      const title = fields.title?.trim() || "";
      const buyer = fields.buyer?.trim() || "";

      if (amount <= 0 || !title || !buyer) {
        setErr("Enter an amount, what you're selling, and the buyer's phone or email.");
        return;
      }
      setErr(undefined);

      const me = await getCurrentUser().catch(() => null);
      const profile = getSellerProfile();
      await requestPayment({
        item: { title, amount, currency: "NGN" },
        // The signed-in user is the seller; in demo mode pass their contact.
        seller: { name: profile?.fullName || me?.name || "Seller", contact: me?.email },
        buyerEmail: buyer,
      });
      router.push("/selling");
    },
  };

  return <ScreenHtml html={html} data={{ err }} actions={actions} />;
}
