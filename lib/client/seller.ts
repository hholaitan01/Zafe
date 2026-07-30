/* Client call for a seller's standing, shown on the payment screen. */

import type { SellerStanding } from "@/lib/seller/standing";
import { apiFetch } from "./api";

export function getSellerStanding(contact: string): Promise<SellerStanding> {
  return apiFetch<{ standing: SellerStanding }>(`/api/seller-standing?contact=${encodeURIComponent(contact)}`).then((r) => r.standing);
}
