"use client";

/* Shared wrapper for the two Trust Score design screens (safe/green and
   risky/red). Loads the current deal and drives the real score, risk label,
   and headline into the design markup. */

import { useEffect, useState } from "react";
import ScreenHtml from "./screen-html";
import { getCurrentDealId, getDeal } from "@/lib/client";

const RISK_LABEL: Record<string, string> = { safe: "LOW RISK", caution: "CAUTION", risky: "HIGH RISK" };

export default function TrustScreen({ html }: { html: string }) {
  const [data, setData] = useState<Record<string, string | number>>();

  useEffect(() => {
    const id = getCurrentDealId();
    if (!id) return;
    let alive = true;
    getDeal(id)
      .then((deal) => {
        if (alive && deal.trust) {
          setData({
            score: deal.trust.score,
            headline: deal.trust.headline,
            riskLabel: RISK_LABEL[deal.trust.verdict] ?? "",
          });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return <ScreenHtml html={html} data={data} />;
}
