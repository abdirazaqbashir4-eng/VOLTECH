import type { PaymentProvider } from "../enums";

export interface InitiatePaymentInput {
  transactionId: string;
  amount: number;
  currency: string;
  customerPhone?: string;
  description: string;
}

export interface InitiatePaymentResult {
  /** Whether the provider confirmed payment synchronously (e.g. sandbox/mock) or is still processing (e.g. STK push awaiting the customer, card 3DS redirect). */
  status: "PAID" | "PROCESSING" | "FAILED";
  providerReference?: string;
  redirectUrl?: string;
  failureReason?: string;
}

/**
 * Every real payment provider (M-Pesa, card networks, ...) implements this
 * interface. The checkout flow and order/payment records never depend on a
 * specific provider's API shape — only on this contract — so adding a new
 * provider never requires touching checkout or order code.
 */
export interface PaymentProviderAdapter {
  readonly name: PaymentProvider;
  isConfigured(): boolean;
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
}
