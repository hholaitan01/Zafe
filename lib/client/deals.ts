/* ==========================================================================
   Client calls for the escrow deal lifecycle. One function per screen action.
   ========================================================================== */

import type { DisputeResult } from "@/lib/ai/types";
import type { CreateDealInput, Deal, DealStatus } from "@/lib/deals/types";
import { apiFetch } from "./api";

/** Both sides of a dispute, as the Dispute screen collects them. */
export interface DisputeInput {
  buyer: { claim: string; evidence?: string[] };
  seller: { claim: string; evidence?: string[] };
}

/** Dashboard — list every deal (newest first). */
export function listDeals(): Promise<Deal[]> {
  return apiFetch<{ deals: Deal[] }>("/api/deals").then((r) => r.deals);
}

/** Dashboard — list the signed-in trader's own deals (per-user scoping). In
    demo mode the server has no session, so we pass the local user's email. */
export function listMyDeals(email?: string): Promise<Deal[]> {
  const qs = email ? `?buyer=${encodeURIComponent(email)}` : "";
  return apiFetch<{ deals: Deal[] }>(`/api/deals${qs}`).then((r) => r.deals);
}

/** Timeline / deal detail — one deal by id. */
export function getDeal(id: string): Promise<Deal> {
  return apiFetch<{ deal: Deal }>(`/api/deals/${id}`).then((r) => r.deal);
}

/** New Escrow — create a deal. The response's deal.trust is the Trust Score. */
export function createDeal(input: CreateDealInput): Promise<Deal> {
  return apiFetch<{ deal: Deal }>("/api/deals", { method: "POST", body: JSON.stringify(input) }).then((r) => r.deal);
}

/** Simple status move (e.g. fund from the Fund Escrow screen). */
export function setDealStatus(id: string, status: DealStatus, note?: string): Promise<Deal> {
  return apiFetch<{ deal: Deal }>(`/api/deals/${id}`, { method: "PATCH", body: JSON.stringify({ status, note }) }).then((r) => r.deal);
}

/** Seller ships → mints the buyer's handover code + starts the auto-release timer. */
export function shipDeal(id: string): Promise<Deal> {
  return apiFetch<{ deal: Deal }>(`/api/deals/${id}/ship`, { method: "POST" }).then((r) => r.deal);
}

/** Code screen — buyer confirms with the handover code to pay the seller. */
export function releaseDeal(id: string, code: string): Promise<Deal> {
  return apiFetch<{ deal: Deal }>(`/api/deals/${id}/release`, { method: "POST", body: JSON.stringify({ code }) }).then((r) => r.deal);
}

/** Timeline "Confirm Received" — release the money to the seller (buyer confirms). */
export function confirmReceipt(dealId: string): Promise<{ ok: boolean; deal?: Deal }> {
  return apiFetch<{ ok: boolean; deal?: Deal }>(`/api/payout`, { method: "POST", body: JSON.stringify({ dealId, via: "buyer_confirm" }) });
}

/** Dispute screen — open a dispute; the AI judge rules and the money moves. */
export function disputeDeal(id: string, input: DisputeInput): Promise<{ deal: Deal; resolution?: DisputeResult }> {
  return apiFetch<{ deal: Deal; resolution?: DisputeResult }>(`/api/deals/${id}/dispute`, { method: "POST", body: JSON.stringify(input) });
}

/** Release any deals whose auto-release timer has run out. */
export function runAutoRelease(): Promise<number> {
  return apiFetch<{ released: number }>("/api/deals/auto-release", { method: "POST" }).then((r) => r.released);
}
