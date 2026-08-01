"use client";

/* Settings — account + activity + selling links, and sign out. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/settings";
import { getCurrentUser, signOut } from "@/lib/auth";

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<Record<string, string | number>>();

  useEffect(() => {
    let alive = true;
    getCurrentUser()
      .then((u) => {
        if (alive) setData({ email: u?.email || "Not signed in" });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const actions = {
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
