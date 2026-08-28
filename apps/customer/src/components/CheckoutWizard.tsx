"use client";

import { useState, useTransition } from "react";
import { formatKES } from "@voltech/core/money";
import { addAddressAction, getShippingMethodsForAddress, placeOrderAction } from "@/app/actions/checkout";

interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  county: string;
  city: string;
  street: string;
  isDefault: boolean;
}

interface ShippingMethod {
  id: string;
  name: string;
  fee: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

interface PaymentOption {
  provider: "MOCK" | "MPESA" | "CARD";
  label: string;
}

const KENYA_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu", "Kiambu", "Machakos", "Kajiado", "Nyeri", "Kilifi",
];

// Single-scroll checkout — matches voltech_secure_checkout_mobile exactly
// (address / delivery method / payment / summary all on one page, no
// step wizard), backed by the same Server Actions the old 4-step wizard
// used.
export default function CheckoutWizard({
  addresses: initialAddresses,
  initialShippingMethods,
  subtotal,
  sellerCount,
  paymentOptions,
}: {
  addresses: Address[];
  initialShippingMethods: ShippingMethod[];
  subtotal: number;
  sellerCount: number;
  paymentOptions: PaymentOption[];
}) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [addingAddress, setAddingAddress] = useState(addresses.length === 0);
  const [changingAddress, setChangingAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "");
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>(initialShippingMethods);
  const [selectedShippingId, setSelectedShippingId] = useState(initialShippingMethods[0]?.id ?? "");
  const [paymentProvider, setPaymentProvider] = useState<PaymentOption["provider"]>(paymentOptions[0]?.provider ?? "MOCK");
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const selectedShipping = shippingMethods.find((m) => m.id === selectedShippingId);
  const shippingTotal = (selectedShipping?.fee ?? 0) * sellerCount;
  const grandTotal = subtotal + shippingTotal;

  function selectAddress(id: string) {
    setSelectedAddressId(id);
    setChangingAddress(false);
    startTransition(async () => {
      const methods = await getShippingMethodsForAddress(id);
      setShippingMethods(methods);
      setSelectedShippingId(methods[0]?.id ?? "");
    });
  }

  function placeOrder() {
    if (!selectedAddressId) {
      setError("Please select a delivery address.");
      return;
    }
    if (!selectedShippingId) {
      setError("Delivery isn't currently available to this address.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await placeOrderAction({
        addressId: selectedAddressId,
        shippingMethodId: selectedShippingId,
        paymentProvider,
        couponCode: couponCode.trim() || undefined,
      });
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <main className="pt-[60px] px-margin-mobile flex flex-col gap-stack-lg max-w-2xl mx-auto pb-32">
      <div className="pt-stack-md">
        <h1 className="font-headline-md text-headline-md text-primary">Secure Checkout</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-[16px] text-success-green" style={{ fontVariationSettings: "'FILL' 1" }}>
            lock
          </span>
          256-bit SSL Encrypted
        </p>
      </div>

      {/* Delivery Address */}
      <section className="flex flex-col gap-stack-sm">
        <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">location_on</span>
          Delivery Address
        </h2>
        {selectedAddress && !changingAddress && !addingAddress && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded p-stack-md flex flex-col gap-stack-md relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-headline-sm text-headline-sm text-primary">{selectedAddress.label}</span>
                {selectedAddress.isDefault && <span className="bg-primary text-on-primary font-label-md text-label-md px-2 py-0.5 rounded-full">Default</span>}
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">{selectedAddress.street}, {selectedAddress.city}</p>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Attn: {selectedAddress.recipientName} ({selectedAddress.phone})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setChangingAddress(true)}
              className="font-label-lg text-label-lg text-secondary border border-outline-variant py-2 rounded w-full flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
              Change Address
            </button>
          </div>
        )}

        {changingAddress && (
          <div className="flex flex-col gap-stack-sm">
            {addresses.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => selectAddress(a.id)}
                className={`text-left bg-surface-container-lowest border rounded p-stack-md ${a.id === selectedAddressId ? "border-secondary" : "border-outline-variant"}`}
              >
                <span className="font-headline-sm text-headline-sm text-primary">{a.label}</span> — {a.recipientName}, {a.phone}
                <p className="font-body-sm text-body-sm text-on-surface-variant">{a.street}, {a.city}, {a.county}</p>
              </button>
            ))}
            <button type="button" onClick={() => { setChangingAddress(false); setAddingAddress(true); }} className="font-label-lg text-label-lg text-secondary text-left">
              + Add a new address
            </button>
          </div>
        )}

        {addingAddress && (
          <NewAddressForm
            onCancel={() => setAddingAddress(false)}
            onSaved={(addr) => {
              setAddresses((prev) => [...prev, addr]);
              setAddingAddress(false);
              selectAddress(addr.id);
            }}
          />
        )}
      </section>

      {/* Delivery Method */}
      {shippingMethods.length > 0 && (
        <section className="flex flex-col gap-stack-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">local_shipping</span>
            Delivery Method
          </h2>
          <div className="flex flex-col gap-stack-sm">
            {shippingMethods.map((m) => (
              <label
                key={m.id}
                className={`bg-surface-container-lowest border rounded p-stack-md flex items-start gap-3 cursor-pointer ${
                  selectedShippingId === m.id ? "border-secondary" : "border-outline-variant"
                }`}
              >
                <input type="radio" name="shipping" className="mt-1 accent-secondary" checked={selectedShippingId === m.id} onChange={() => setSelectedShippingId(m.id)} />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-headline-sm text-headline-sm text-primary">{m.name}</span>
                    <span className={`font-body-md text-body-md ${m.fee === 0 ? "text-success-green font-headline-sm" : "text-primary"}`}>
                      {m.fee === 0 ? "Free" : formatKES(m.fee)}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Estimated {m.estimatedDaysMin}-{m.estimatedDaysMax} day(s)
                  </p>
                </div>
              </label>
            ))}
          </div>
        </section>
      )}

      {/* Payment Method */}
      <section className="flex flex-col gap-stack-sm">
        <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">payments</span>
          Payment Method
        </h2>
        <div className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
          {paymentOptions.map((p) => (
            <label key={p.provider} className={`p-stack-md border-b border-outline-variant last:border-0 flex items-center justify-between cursor-pointer relative ${paymentProvider === p.provider ? "bg-surface-container-high/30" : ""}`}>
              {paymentProvider === p.provider && <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary" />}
              <div className="flex items-center gap-3">
                <input type="radio" name="payment" className="accent-secondary" checked={paymentProvider === p.provider} onChange={() => setPaymentProvider(p.provider)} />
                <span className="font-headline-sm text-headline-sm text-primary">{p.label}</span>
              </div>
              {p.provider === "MPESA" && (
                <div className="w-10 h-6 bg-success-green rounded-sm flex items-center justify-center">
                  <span className="font-label-md text-[8px] text-white font-bold">M-PESA</span>
                </div>
              )}
              {p.provider === "CARD" && <span className="material-symbols-outlined text-outline">credit_card</span>}
            </label>
          ))}
          {/* Bank Wire Transfer isn't a real payment provider in this app
              (Payment.provider is MPESA | CARD | MOCK) — kept visible per
              the design, disabled rather than faked. */}
          <label className="p-stack-md flex items-center justify-between cursor-not-allowed opacity-50">
            <div className="flex items-center gap-3">
              <input type="radio" name="payment" disabled />
              <span className="font-headline-sm text-headline-sm text-primary">Bank Wire Transfer</span>
            </div>
            <span className="font-label-md text-label-md text-on-surface-variant">Coming soon</span>
          </label>
        </div>
        {paymentOptions[0]?.provider === "MOCK" && (
          <p className="font-body-sm text-body-sm text-on-tertiary-container">
            No live payment provider is configured — this order will be completed with the sandbox/demo payment method.
          </p>
        )}
      </section>

      <div>
        <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">Coupon code (optional)</label>
        <input
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="e.g. WELCOME10"
          className="w-full max-w-xs rounded border border-outline-variant px-3 py-2 font-body-md text-body-md uppercase focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
        />
      </div>

      {/* Order Summary */}
      <section className="flex flex-col gap-stack-sm bg-surface-container-lowest border border-outline-variant rounded p-stack-md">
        <h2 className="font-headline-sm text-headline-sm text-on-surface border-b border-outline-variant pb-stack-sm mb-stack-xs">Order Summary</h2>
        <div className="flex justify-between items-center py-1">
          <span className="font-body-md text-body-md text-on-surface-variant">Subtotal</span>
          <span className="font-body-md text-body-md text-primary">{formatKES(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="font-body-md text-body-md text-on-surface-variant">Shipping</span>
          <span className={`font-body-md text-body-md ${shippingTotal === 0 ? "text-success-green" : "text-primary"}`}>
            {selectedShipping ? (shippingTotal === 0 ? "Free" : formatKES(shippingTotal)) : "—"}
          </span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-outline-variant pb-stack-sm">
          <span className="font-body-md text-body-md text-on-surface-variant">VAT</span>
          <span className="font-body-md text-body-md text-primary">{formatKES(0)}</span>
        </div>
        <div className="flex justify-between items-center pt-stack-xs">
          <span className="font-headline-sm text-headline-sm text-primary">Total</span>
          <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary">{formatKES(grandTotal)}</span>
        </div>
      </section>

      {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-outline-variant p-margin-mobile z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-body-sm text-body-sm text-on-surface-variant">Total</span>
            <span className="font-headline-md text-headline-md text-primary">{formatKES(grandTotal)}</span>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={placeOrder}
            className="bg-success-green text-white font-label-lg text-label-lg px-6 py-3 rounded min-h-touch-target-min flex items-center justify-center gap-2 flex-1 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              lock
            </span>
            {isPending ? "Placing order..." : "Confirm & Pay"}
          </button>
        </div>
      </div>
    </main>
  );
}

function NewAddressForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: (a: Address) => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-stack-sm bg-surface-container-lowest border border-outline-variant rounded p-stack-md"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await addAddressAction({
            label: String(form.get("label") || "Home"),
            recipientName: String(form.get("recipientName")),
            phone: String(form.get("phone")),
            county: String(form.get("county")),
            city: String(form.get("city")),
            street: String(form.get("street")),
            isDefault: true,
          });
          if (result.ok) onSaved(result.address);
          else setError(result.error);
        });
      }}
    >
      <div className="grid gap-stack-sm sm:grid-cols-2">
        <input name="recipientName" placeholder="Recipient name" required className="rounded border border-outline-variant px-3 py-2 font-body-md text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none" />
        <input name="phone" placeholder="Phone" required className="rounded border border-outline-variant px-3 py-2 font-body-md text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none" />
        <select name="county" required className="rounded border border-outline-variant px-3 py-2 font-body-md text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none">
          {KENYA_COUNTIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input name="city" placeholder="City / Town" required className="rounded border border-outline-variant px-3 py-2 font-body-md text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none" />
        <input name="street" placeholder="Street / Estate" required className="rounded border border-outline-variant px-3 py-2 font-body-md text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none sm:col-span-2" />
      </div>
      {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="bg-secondary text-on-secondary rounded px-4 py-1.5 font-label-lg text-label-lg">
          Save address
        </button>
        <button type="button" onClick={onCancel} className="border border-outline-variant rounded px-4 py-1.5 font-label-lg text-label-lg text-on-surface-variant">
          Cancel
        </button>
      </div>
    </form>
  );
}
