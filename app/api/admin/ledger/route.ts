/* ==========================================================================
   GET /api/admin/ledger
   The reconciliation view: the money at a glance from Zafe's own ledger (held,
   funded, paid out, refunded, revenue, and whether the books balance), the most
   recent entries, and two operator to-do lists — the settlement exception queue
   (money-moves that failed or are stuck) and deal-vs-ledger discrepancies (a
   settled deal whose money-move was never recorded, or one recorded twice).
   Read-only. Admin-only (isAdmin: open in demo, ADMIN_EMAILS in live); returns
   404 to non-admins so the view isn't confirmed to outsiders.
   ========================================================================== */

import { jsonError } from "@/lib/ai/http";
import { requireCapability } from "@/lib/auth/server";
import { listDeals } from "@/lib/deals/store";
import { allLedgerEntries, listEntries, reconciliation } from "@/lib/ledger/store";
import { reconcileDeals } from "@/lib/ledger/reconcile";
import { listSettlementExceptions } from "@/lib/payments/settlement";

export async function GET(): Promise<Response> {
  if (!(await requireCapability("reconciliation.view"))) return jsonError("Not found", 404);
  const [summary, entries, allEntries, deals, exceptions] = await Promise.all([
    reconciliation(),
    listEntries(100),
    allLedgerEntries(),
    listDeals(),
    listSettlementExceptions(),
  ]);
  const discrepancies = reconcileDeals(deals, allEntries);
  return Response.json({ summary, entries, exceptions, discrepancies });
}
