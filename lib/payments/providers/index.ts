/* ==========================================================================
   Provider registry. Add Flutterwave here when it lands — implement the
   PaymentProvider interface in ./flutterwave and register it below; nothing
   else in the app changes.
   ========================================================================== */

import type { PaymentProvider } from "./types";
import { paystackProvider } from "./paystack";

export function getProvider(id: "paystack" | "flutterwave"): PaymentProvider {
  switch (id) {
    case "paystack":
      return paystackProvider;
    default:
      throw new Error(`Unsupported payment provider: ${id}`);
  }
}

export { paystackProvider };
export type { PaymentProvider } from "./types";
