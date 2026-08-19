import type { InitiatePaymentInput, InitiatePaymentResult, PaymentProviderAdapter } from "./types";

/**
 * Card payment adapter — integration point for a hosted-checkout provider
 * (e.g. Stripe, Flutterwave, Paystack). Requires CARD_PROVIDER_SECRET_KEY /
 * CARD_PROVIDER_PUBLIC_KEY (see .env.example). Raw card numbers must never
 * pass through this app's servers — always use the provider's hosted
 * fields / redirect checkout so card data never touches our stack.
 */
export const cardProvider: PaymentProviderAdapter = {
  name: "CARD",
  isConfigured() {
    return Boolean(process.env.CARD_PROVIDER_SECRET_KEY && process.env.CARD_PROVIDER_PUBLIC_KEY);
  },
  async initiate(_input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    throw new Error(
      "Card payments are not configured. Set CARD_PROVIDER_SECRET_KEY and CARD_PROVIDER_PUBLIC_KEY, " +
        "then implement a hosted-checkout session request in src/lib/payments/card.ts.",
    );
  },
};
