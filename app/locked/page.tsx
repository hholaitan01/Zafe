"use client";

/* Locked — the "your money is safe" confirmation, bound to the real deal's
   amount and reference (was hardcoded ₦450,000 / TF-4821-AO in the design). */

import { useEffect, useState } from "react";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/locked";
import { getCurrentDealId, getDeal, naira } from "@/lib/client";

export default function Page() {
  const [data, setData] = useState<Record<string, string | number>>();

  useEffect(() => {
    const id = getCurrentDealId();
    if (!id) return;
    let alive = true;
    getDeal(id)
      .then((d) => {
        if (!alive) return;
        setData({ amount: naira(d.item.amount), escrowId: `Escrow ID · ${d.reference}` });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return <ScreenHtml html={html} data={data} />;
}
