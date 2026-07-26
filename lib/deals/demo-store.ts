/* ==========================================================================
   In-memory deal store (demo mode).

   Held on globalThis so it survives dev hot-reloads and repeated route calls
   within one server instance. Seeded on first use. Not durable across a real
   serverless deploy — that's what the Supabase store is for — but perfect for
   a live demo and local development.
   ========================================================================== */

import { newId, newReference, statusLabel } from "./helpers";
import { seedDeals } from "./seed";
import type { CreateDealInput, Deal, DealStatus, DealTrust } from "./types";

interface DemoDb {
  deals: Deal[];
}

// Reuse one instance across module reloads in dev.
const g = globalThis as unknown as { __trustflowDemoDb?: DemoDb };
function db(): DemoDb {
  if (!g.__trustflowDemoDb) g.__trustflowDemoDb = { deals: seedDeals() };
  return g.__trustflowDemoDb;
}

export const demoStore = {
  async list(): Promise<Deal[]> {
    // Newest first.
    return [...db().deals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async get(id: string): Promise<Deal | null> {
    return db().deals.find((d) => d.id === id) ?? null;
  },

  async create(input: CreateDealInput, trust?: DealTrust): Promise<Deal> {
    const at = new Date().toISOString();
    const deal: Deal = {
      id: newId(),
      reference: newReference(),
      item: {
        title: input.item.title,
        amount: input.item.amount,
        currency: input.item.currency ?? "NGN",
      },
      seller: input.seller,
      buyerEmail: input.buyerEmail,
      chat: input.chat,
      status: "created",
      trust,
      timeline: [{ at, status: "created", label: statusLabel("created") }],
      createdAt: at,
      updatedAt: at,
    };
    db().deals.unshift(deal);
    return deal;
  },

  async setStatus(id: string, status: DealStatus, note?: string): Promise<Deal | null> {
    const deal = db().deals.find((d) => d.id === id);
    if (!deal) return null;
    const at = new Date().toISOString();
    deal.status = status;
    deal.updatedAt = at;
    deal.timeline.push({ at, status, label: statusLabel(status), note });
    return deal;
  },
};
