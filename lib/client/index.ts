/* ==========================================================================
   One import for the whole front-end API surface:

     import { listDeals, createDeal, releaseDeal, disputeDeal,
              getTrustScore, checkScam, ApiError } from "@/lib/client";

   Auth lives separately in "@/lib/auth" (signInOrUp, signInWithGoogle, …).
   ========================================================================== */

export { ApiError, apiFetch } from "./api";
export { getTrustScore, checkScam, judgeDispute } from "./ai";
export { listDeals, listMyDeals, getDeal, createDeal, setDealStatus, shipDeal, releaseDeal, disputeDeal, runAutoRelease } from "./deals";
export type { DisputeInput } from "./deals";
export { getMyReputation } from "./reputation";
export { setCurrentDealId, getCurrentDealId, naira } from "./session";
