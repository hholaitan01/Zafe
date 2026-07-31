"use client";

/* Timeline — binds the current deal's real item, amount, trust line, and seller
   into Deji's summary card. (The visual stepper stays as the design.) */

import { useEffect, useState } from "react";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/timeline";
import { getCurrentDealId, getDeal, naira } from "@/lib/client";

const RISK: Record<string, string> = { safe: "Low risk", caution: "Caution", risky: "High risk" };

export default function Page() {
  const [data, setData] = useState<Record<string, string | number>>();

  useEffect(() => {
    const id = getCurrentDealId();
    if (!id) return;
    let alive = true;
    getDeal(id)
      .then((d) => {
        if (!alive) return;
        setData({
          title: d.item.title,
          amount: naira(d.item.amount),
          seller: d.seller.name || "Seller",
          trustLine: d.trust ? `Score ${d.trust.score} · ${RISK[d.trust.verdict] ?? ""}` : "Not scored",
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return <ScreenHtml html={html} data={data} />;
}
