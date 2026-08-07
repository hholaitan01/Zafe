/* ==========================================================================
   One import for the whole front-end API surface:

     import { listDeals, createDeal, releaseDeal, disputeDeal,
              getTrustScore, checkScam, ApiError } from "@/lib/client";

   Auth lives separately in "@/lib/auth" (signInOrUp, signInWithGoogle, …).
   ========================================================================== */

export { ApiError, apiFetch } from "./api";
export { getTrustScore, checkScam, judgeDispute } from "./ai";
export { listDeals, listMyDeals, listMySales, requestPayment, getDeal, createDeal, createEscrowAccount, setDealStatus, shipDeal, releaseDeal, confirmReceipt, disputeDeal, acceptDisputeResolution, escalateDispute, runAutoRelease } from "./deals";
export { getSellerProfile, saveSellerProfile, loadSellerProfile, isSellerVerified } from "./seller-profile";
export type { SellerProfileData, SellerPayout } from "./seller-profile";
export { getCachedProfile, saveUserProfile, loadUserProfile, splitName, deleteAccount } from "./user-profile";
export type { UserProfile, LoadedProfile } from "./user-profile";
export type { DisputeInput } from "./deals";
export { getMyReputation } from "./reputation";
export { getSellerStanding } from "./seller";
export { setCurrentDealId, getCurrentDealId, naira } from "./session";
