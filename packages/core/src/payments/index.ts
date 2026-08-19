import type { PaymentProvider } from "../enums";
import type { PaymentProviderAdapter } from "./types";
import { mockProvider } from "./mock";
import { mpesaProvider } from "./mpesa";
import { cardProvider } from "./card";

const registry: Record<PaymentProvider, PaymentProviderAdapter> = {
  MOCK: mockProvider,
  MPESA: mpesaProvider,
  CARD: cardProvider,
};

/** Providers a customer can actually pick at checkout right now. */
export function availablePaymentProviders(): PaymentProviderAdapter[] {
  const real = [mpesaProvider, cardProvider].filter((p) => p.isConfigured());
  return real.length > 0 ? real : [mockProvider];
}

export function getPaymentProvider(name: PaymentProvider): PaymentProviderAdapter {
  const provider = registry[name];
  if (!provider.isConfigured() && provider.name !== "MOCK") {
    throw new Error(`Payment provider ${name} is not configured.`);
  }
  return provider;
}

export * from "./types";
