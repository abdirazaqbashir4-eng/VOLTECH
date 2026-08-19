import type { InitiatePaymentInput, InitiatePaymentResult, PaymentProviderAdapter } from "./types";

/**
 * Sandbox provider used whenever a real provider isn't configured (see
 * getPaymentProvider in ./index.ts). It settles instantly so the full
 * checkout → order → commission → payout flow can be exercised end-to-end
 * without real payment credentials. It is never selected silently in a
 * deployment that has real credentials configured — see getPaymentProvider.
 */
export const mockProvider: PaymentProviderAdapter = {
  name: "MOCK",
  isConfigured() {
    return true;
  },
  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return {
      status: "PAID",
      providerReference: `MOCK-${input.transactionId}`,
    };
  },
};
