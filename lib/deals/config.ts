/* ==========================================================================
   Which deal store are we using?

   - SUPABASE — a real `deals` table, when NEXT_PUBLIC_SUPABASE_URL and the
     server-only SUPABASE_SERVICE_ROLE_KEY are both set. See schema.sql.
   - DEMO     — an in-memory store seeded with believable deals, so the
     Dashboard and Trust Score screens have real data to show on stage with
     no database. (This also covers the Day-6 "fill it with demo data" task.)
   ========================================================================== */

import type { DealBackend } from "./types";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function dealBackend(): DealBackend {
  return SUPABASE_URL && SERVICE_ROLE_KEY ? "supabase" : "demo";
}
