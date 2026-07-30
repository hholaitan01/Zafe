"use client";

/* Fund — pay into escrow marks the deal "funded", then continues to the
   money-locked screen. (Live ALAT payment is Jerry's; this owns the status.) */

import { useRouter } from "next/navigation";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/fund";
import { getCurrentDealId, setDealStatus } from "@/lib/client";

export default function Page() {
  const router = useRouter();

  const actions = {
    fund: async () => {
      const id = getCurrentDealId();
      if (id) {
        try {
          await setDealStatus(id, "funded", "Buyer paid into escrow");
        } catch {
          /* keep the flow moving even if the status write fails */
        }
      }
      router.push("/locked");
    },
  };

  return <ScreenHtml html={html} actions={actions} />;
}
