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

export default function CheckoutWizard({
  addresses: initialAddresses,
  subtotal,
  sellerCount,
  paymentOptions,
}: {
  addresses: Address[];
  subtotal: number;
  sellerCount: number;
  paymentOptions: PaymentOption[];
}) {
  const [step, setStep] = useState<"address" | "delivery" | "payment" | "review">("address");
  const [addresses, setAddresses] = useState(initialAddresses);
  const [addingAddress, setAddingAddress] = useState(addresses.length === 0);
  const [selectedAddressId, setSelectedAddressId] = useState(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "");
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState("");
  const [paymentProvider, setPaymentProvider] = useState<PaymentOption["provider"]>(paymentOptions[0]?.provider ?? "MOCK");
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const selectedShipping = shippingMethods.find((m) => m.id === selectedShippingId);
  const shippingTotal = (selectedShipping?.fee ?? 0) * sellerCount;
  const grandTotal = subtotal + shippingTotal;

  async function goToDelivery() {
    if (!selectedAddressId) {
      setError("Please select or add a delivery address.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const methods = await getShippingMethodsForAddress(selectedAddressId);
      if (methods.length === 0) {
        setError("Delivery is not currently available to this address.");
        return;
      }
      setShippingMethods(methods);
      setSelectedShippingId(methods[0].id);
      setStep("delivery");
    });
  }

  function placeOrder() {
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

  const steps: { key: typeof step; label: string }[] = [
    { key: "address", label: "Address" },
    { key: "delivery", label: "Delivery" },
    { key: "payment", label: "Payment" },
    { key: "review", label: "Review" },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <ol className="flex items-center text-sm">
          {steps.map((s, i) => {
            const currentIndex = steps.findIndex((x) => x.key === step);
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <li key={s.key} className="flex flex-1 items-center last:flex-none">
                <div className={`flex items-center gap-1.5 ${active ? "font-semibold text-brand-teal" : done ? "text-slate-700" : "text-slate-400"}`}>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      done ? "bg-brand-teal text-white" : active ? "border-2 border-brand-teal text-brand-teal" : "border border-[var(--border)] text-slate-400"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < steps.length - 1 && <span className={`mx-2 h-px flex-1 ${done ? "bg-brand-teal" : "bg-[var(--border)]"}`} />}
              </li>
            );
          })}
        </ol>

        {step === "address" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-900">Delivery address</h2>
            {addresses.map((a) => (
              <label key={a.id} className={`block cursor-pointer rounded-lg border p-4 text-sm ${selectedAddressId === a.id ? "border-brand-teal bg-brand-teal/5" : "border-[var(--border)]"}`}>
                <input type="radio" name="address" className="mr-2" checked={selectedAddressId === a.id} onChange={() => setSelectedAddressId(a.id)} />
                <span className="font-medium">{a.label}</span> — {a.recipientName}, {a.phone}
                <br />
                <span className="text-slate-500">{a.street}, {a.city}, {a.county}</span>
              </label>
            ))}

            {!addingAddress ? (
              <button type="button" onClick={() => setAddingAddress(true)} className="text-sm text-brand-teal hover:underline">
                + Add a new address
              </button>
            ) : (
              <NewAddressForm
                onCancel={() => setAddingAddress(false)}
                onSaved={(addr) => {
                  setAddresses((prev) => [...prev, addr]);
                  setSelectedAddressId(addr.id);
                  setAddingAddress(false);
                }}
              />
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="button"
              disabled={isPending}
              onClick={goToDelivery}
              className="rounded-lg bg-brand-teal shadow-sm transition-colors px-5 py-2.5 font-semibold text-white hover:bg-brand-teal-dark disabled:opacity-50"
            >
              Continue to delivery
            </button>
          </div>
        )}

        {step === "delivery" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-900">Delivery method</h2>
            {shippingMethods.map((m) => (
              <label key={m.id} className={`block cursor-pointer rounded-lg border p-4 text-sm ${selectedShippingId === m.id ? "border-brand-teal bg-brand-teal/5" : "border-[var(--border)]"}`}>
                <input type="radio" name="shipping" className="mr-2" checked={selectedShippingId === m.id} onChange={() => setSelectedShippingId(m.id)} />
                <span className="font-medium">{m.name}</span> — {formatKES(m.fee)} per seller
                <br />
                <span className="text-slate-500">Estimated {m.estimatedDaysMin}-{m.estimatedDaysMax} day(s)</span>
              </label>
            ))}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep("address")} className="rounded-md border border-[var(--border)] px-5 py-2.5 text-slate-700">
                Back
              </button>
              <button type="button" onClick={() => setStep("payment")} className="rounded-lg bg-brand-teal shadow-sm transition-colors px-5 py-2.5 font-semibold text-white hover:bg-brand-teal-dark">
                Continue to payment
              </button>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-900">Payment method</h2>
            {paymentOptions.map((p) => (
              <label key={p.provider} className={`block cursor-pointer rounded-lg border p-4 text-sm ${paymentProvider === p.provider ? "border-brand-teal bg-brand-teal/5" : "border-[var(--border)]"}`}>
                <input type="radio" name="payment" className="mr-2" checked={paymentProvider === p.provider} onChange={() => setPaymentProvider(p.provider)} />
                {p.label}
              </label>
            ))}
            {paymentOptions[0]?.provider === "MOCK" && (
              <p className="text-xs text-amber-700">
                No live payment provider is configured — this order will be completed with the sandbox/demo payment method.
              </p>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep("delivery")} className="rounded-md border border-[var(--border)] px-5 py-2.5 text-slate-700">
                Back
              </button>
              <button type="button" onClick={() => setStep("review")} className="rounded-lg bg-brand-teal shadow-sm transition-colors px-5 py-2.5 font-semibold text-white hover:bg-brand-teal-dark">
                Review order
              </button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-900">Review your order</h2>
            <div className="rounded-lg border border-[var(--border)] p-4 text-sm">
              <p className="font-medium text-slate-900">Deliver to</p>
              <p className="text-slate-600">
                {selectedAddress?.recipientName}, {selectedAddress?.street}, {selectedAddress?.city}, {selectedAddress?.county}
              </p>
              <p className="mt-3 font-medium text-slate-900">Delivery method</p>
              <p className="text-slate-600">{selectedShipping?.name}</p>
              <p className="mt-3 font-medium text-slate-900">Payment</p>
              <p className="text-slate-600">{paymentOptions.find((p) => p.provider === paymentProvider)?.label}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Coupon code (optional)</label>
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME10"
                className="w-full max-w-xs rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm uppercase"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep("payment")} className="rounded-md border border-[var(--border)] px-5 py-2.5 text-slate-700">
                Back
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={placeOrder}
                className="rounded-md bg-brand-amber px-5 py-2.5 font-semibold text-brand-ink hover:bg-brand-amber-dark disabled:opacity-50"
              >
                {isPending ? "Placing order..." : "Place order"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-fit rounded-lg border border-[var(--border)] p-5">
        <h2 className="mb-3 font-semibold text-slate-900">Price summary</h2>
        <div className="space-y-1 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>Product subtotal</span>
            <span>{formatKES(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery fee</span>
            <span>{selectedShipping ? formatKES(shippingTotal) : "—"}</span>
          </div>
        </div>
        <div className="mt-3 flex justify-between border-t border-[var(--border)] pt-3 font-semibold text-slate-900">
          <span>Total</span>
          <span>{formatKES(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}

function NewAddressForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: (a: Address) => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3 rounded-lg border border-[var(--border)] p-4"
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
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="recipientName" placeholder="Recipient name" required className="rounded border border-[var(--border)] px-2 py-1.5 text-sm" />
        <input name="phone" placeholder="Phone" required className="rounded border border-[var(--border)] px-2 py-1.5 text-sm" />
        <select name="county" required className="rounded border border-[var(--border)] px-2 py-1.5 text-sm">
          {KENYA_COUNTIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input name="city" placeholder="City / Town" required className="rounded border border-[var(--border)] px-2 py-1.5 text-sm" />
        <input name="street" placeholder="Street / Estate" required className="rounded border border-[var(--border)] px-2 py-1.5 text-sm sm:col-span-2" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-lg bg-brand-teal shadow-sm transition-colors px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-teal-dark">
          Save address
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-[var(--border)] px-4 py-1.5 text-sm text-slate-700">
          Cancel
        </button>
      </div>
    </form>
  );
}
