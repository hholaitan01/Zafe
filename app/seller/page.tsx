"use client";

/* Become a seller — capture identity + payout account, save the seller profile
   (so payouts have somewhere to go), then continue to "My sales". */

import { useRouter } from "next/navigation";
import { useState } from "react";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/seller";
import { saveSellerProfile } from "@/lib/client";

export default function Page() {
  const router = useRouter();
  const [err, setErr] = useState<string>();

  const actions = {
    verify: (fields: Record<string, string>) => {
      const fullName = fields.fullName?.trim() || "";
      const idNumber = fields.idNumber?.trim() || "";
      const accountNumber = fields.accountNumber?.trim() || "";
      const bankName = fields.bankName?.trim() || "";
      const accountName = fields.accountName?.trim() || "";

      if (!fullName || idNumber.length < 10 || !bankName || accountNumber.length < 10 || !accountName) {
        setErr("Fill in your name, a valid BVN/NIN, and your full bank account details.");
        return;
      }
      setErr(undefined);
      saveSellerProfile({ verified: true, fullName, payout: { bankName, accountNumber, accountName } });
      router.push("/selling");
    },
  };

  return <ScreenHtml html={html} data={{ err }} actions={actions} />;
}
