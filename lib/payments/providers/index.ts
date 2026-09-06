/* ==========================================================================
   Provider registry. Each gateway implements the PaymentProvider interface in
   its own file (./paystack, ./flutterwave); nothing else in the app changes
   when one is added or swapped.
   ========================================================================== */

import type { PaymentProvider } from "./types";
import { paystackProvider } from "./paystack";
import { flutterwaveProvider } from "./flutterwave";

export function getProvider(id: "paystack" | "flutterwave"): PaymentProvider {
  switch (id) {
    case "paystack":
      return paystackProvider;
    case "flutterwave":
      return flutterwaveProvider;
    default:
      throw new Error(`Unsupported payment provider: ${id}`);
  }
}

export { paystackProvider, flutterwaveProvider };
export type { PaymentProvider } from "./types";
