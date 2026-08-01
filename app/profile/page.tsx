"use client";

/* Profile — account details: name parts (First/Other/Last), identity
   verification, email, payout account, and Be a Seller. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/profile";
import { getCurrentUser, signOut } from "@/lib/auth";
import { getMyReputation, getUserNames, loadSellerProfile, saveUserNames, splitName } from "@/lib/client";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0] || "?").slice(0, 2).toUpperCase();
}

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<Record<string, string | number>>();

  useEffect(() => {
    let alive = true;
    (async () => {
      const user = await getCurrentUser().catch(() => null);
      const email = user?.email || "";
      const fullName = user?.name || (email ? email.split("@")[0] : "there");
      // Name parts: saved edits win, else split the auth name.
      const names = getUserNames() ?? splitName(fullName);

      if (alive) {
        setData((p) => ({
          ...p,
          initials: initialsOf(fullName),
          name: fullName,
          email: email || "Not signed in",
          firstName: names.firstName,
          otherNames: names.otherNames,
          lastName: names.lastName,
        }));
      }

      const [rep, seller] = await Promise.all([
        getMyReputation(email, user?.name).catch(() => null),
        loadSellerProfile(email).catch(() => null),
      ]);
      if (!alive) return;
      const payout = seller?.payout;
      setData((p) => ({
        ...p,
        ...(rep ? { scoreLine: `Trust Score ${rep.score} · ${rep.tierLabel}` } : {}),
        idStatus: seller?.verified ? "✓ Verified" : "Not verified — tap to verify",
        payout: payout?.accountNumber ? `${payout.bankName ? payout.bankName + " · " : ""}${payout.accountNumber}` : "Not set — tap to add",
      }));
    })();
    return () => {
      alive = false;
    };
  }, []);

  const actions = {
    saveNames: (fields: Record<string, string>) => {
      saveUserNames({
        firstName: fields.firstName?.trim() || "",
        otherNames: fields.otherNames?.trim() || "",
        lastName: fields.lastName?.trim() || "",
      });
      // brief confirmation on the button
      setData((p) => ({ ...p, saveLabel: "Saved ✓" }));
      setTimeout(() => setData((p) => ({ ...p, saveLabel: "Save changes" })), 1600);
    },
    signout: async () => {
      try {
        await signOut();
      } catch {
        /* proceed to login regardless */
      }
      router.push("/login");
    },
  };

  return <ScreenHtml html={html} data={data} actions={actions} />;
}
