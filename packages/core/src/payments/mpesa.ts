import type { InitiatePaymentInput, InitiatePaymentResult, PaymentProviderAdapter } from "./types";

/**
 * Safaricom M-Pesa Daraja (STK Push) adapter. Requires real credentials —
 * see .env.example (MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET,
 * MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL). Without them,
 * isConfigured() returns false and getPaymentProvider() falls back to the
 * mock provider instead of silently pretending to charge a real customer.
 *
 * Not wired to Daraja yet — this is the integration point. Implementing it
 * requires: OAuth token fetch from Daraja, STK push request, and a public
 * HTTPS callback endpoint (MPESA_CALLBACK_URL) that Safaricom calls back on
 * completion — none of which can be exercised without a registered
 * shortcode and Daraja app credentials.
 */
export const mpesaProvider: PaymentProviderAdapter = {
  name: "MPESA",
  isConfigured() {
    return Boolean(
      process.env.MPESA_CONSUMER_KEY &&
        process.env.MPESA_CONSUMER_SECRET &&
        process.env.MPESA_SHORTCODE &&
        process.env.MPESA_PASSKEY &&
        process.env.MPESA_CALLBACK_URL,
    );
  },
  async initiate(_input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    throw new Error(
      "M-Pesa is not configured. Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, " +
        "MPESA_PASSKEY and MPESA_CALLBACK_URL, then implement the Daraja STK push request in src/lib/payments/mpesa.ts.",
    );
  },
};
