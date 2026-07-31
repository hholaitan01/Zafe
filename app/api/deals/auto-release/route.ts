/* ==========================================================================
   POST /api/deals/auto-release
   Releases any shipped deals whose timer has run out (buyer never confirmed or
   disputed). Safe to hit on a schedule (cron) or manually. Returns how many
   were released. Listing deals also runs this sweep automatically.
   ========================================================================== */

import { runAutoReleases } from "@/lib/deals/store";

export async function POST(): Promise<Response> {
  const released = await runAutoReleases();
  return Response.json({ released });
}
