"use client";

import { useActionState, useState } from "react";
import { submitApplicationAction } from "@/app/actions/apply";

export default function ApplyForm() {
  const [state, formAction, isPending] = useActionState(submitApplicationAction, { error: null as string | null });
  const [payoutMethod, setPayoutMethod] = useState<"MPESA" | "BANK">("MPESA");
  const [businessType, setBusinessType] = useState<"INDIVIDUAL" | "REGISTERED_BUSINESS">("INDIVIDUAL");

  return (
    <form action={formAction} className="space-y-6">
      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Store details</h2>
        <input name="storeName" placeholder="Store name" required className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        <textarea name="storeDescription" placeholder="Tell shoppers what you sell" required rows={3} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Business information</h2>
        <select name="businessType" value={businessType} onChange={(e) => setBusinessType(e.target.value as typeof businessType)} className="w-full rounded-md border border-[var(--border)] px-3 py-2">
          <option value="INDIVIDUAL">Individual seller</option>
          <option value="REGISTERED_BUSINESS">Registered business</option>
        </select>
        {businessType === "REGISTERED_BUSINESS" && (
          <input name="businessRegistrationNumber" placeholder="Business registration number" className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Identity verification (KYC)</h2>
        <select name="idType" defaultValue="NATIONAL_ID" className="w-full rounded-md border border-[var(--border)] px-3 py-2">
          <option value="NATIONAL_ID">National ID</option>
          <option value="PASSPORT">Passport</option>
        </select>
        <input name="idNumber" placeholder="ID / Passport number" required className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        <div>
          <input name="idDocumentUrl" placeholder="Link to a scan/photo of your ID document" required className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
          <p className="mt-1 text-xs text-slate-500">Upload your document to any file host and paste the link — direct file upload isn&apos;t wired up in this build.</p>
        </div>
        <input name="proofOfAddressUrl" placeholder="Link to proof of address (optional)" className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Payout details</h2>
        <select name="payoutMethod" value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value as typeof payoutMethod)} className="w-full rounded-md border border-[var(--border)] px-3 py-2">
          <option value="MPESA">M-Pesa</option>
          <option value="BANK">Bank transfer</option>
        </select>
        {payoutMethod === "MPESA" ? (
          <input name="mpesaPhone" placeholder="M-Pesa phone number" required className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        ) : (
          <div className="space-y-3">
            <input name="bankName" placeholder="Bank name" required className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
            <input name="accountNumber" placeholder="Account number" required className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
            <input name="accountName" placeholder="Account name" required className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
          </div>
        )}
      </section>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={isPending} className="w-full rounded-md bg-brand-teal py-2.5 font-semibold text-white hover:bg-brand-teal-dark disabled:opacity-50">
        {isPending ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
