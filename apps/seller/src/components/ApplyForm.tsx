"use client";

import { useActionState, useState } from "react";
import { submitApplicationAction } from "@/app/actions/apply";
import FileUploadField from "./FileUploadField";

export default function ApplyForm() {
  const [state, formAction, isPending] = useActionState(submitApplicationAction, { error: null as string | null });
  const [payoutMethod, setPayoutMethod] = useState<"MPESA" | "BANK">("MPESA");
  const [businessType, setBusinessType] = useState<"INDIVIDUAL" | "REGISTERED_BUSINESS">("INDIVIDUAL");
  const [idDocumentUrl, setIdDocumentUrl] = useState("");
  const [proofOfAddressUrl, setProofOfAddressUrl] = useState("");

  return (
    <form action={formAction} className="space-y-6">
      <section className="space-y-3 rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs">
        <h2 className="font-semibold text-slate-900">Store details</h2>
        <input name="storeName" placeholder="Store name" required className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15" />
        <textarea name="storeDescription" placeholder="Tell shoppers what you sell" required rows={3} className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15" />
      </section>

      <section className="space-y-3 rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs">
        <h2 className="font-semibold text-slate-900">Business information</h2>
        <select name="businessType" value={businessType} onChange={(e) => setBusinessType(e.target.value as typeof businessType)} className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15">
          <option value="INDIVIDUAL">Individual seller</option>
          <option value="REGISTERED_BUSINESS">Registered business</option>
        </select>
        {businessType === "REGISTERED_BUSINESS" && (
          <input name="businessRegistrationNumber" placeholder="Business registration number" className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15" />
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs">
        <h2 className="font-semibold text-slate-900">Identity verification (KYC)</h2>
        <select name="idType" defaultValue="NATIONAL_ID" className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15">
          <option value="NATIONAL_ID">National ID</option>
          <option value="PASSPORT">Passport</option>
        </select>
        <input name="idNumber" placeholder="ID / Passport number" required className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15" />
        <div>
          <input type="hidden" name="idDocumentUrl" value={idDocumentUrl} required />
          <p className="mb-1 text-sm text-slate-700">ID document scan/photo</p>
          <FileUploadField folder="kyc-documents" value={idDocumentUrl} onChange={setIdDocumentUrl} accept="image/*,.pdf" label="Upload ID document" />
        </div>
        <div>
          <input type="hidden" name="proofOfAddressUrl" value={proofOfAddressUrl} />
          <p className="mb-1 text-sm text-slate-700">Proof of address (optional)</p>
          <FileUploadField folder="kyc-documents" value={proofOfAddressUrl} onChange={setProofOfAddressUrl} accept="image/*,.pdf" label="Upload proof of address" />
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs">
        <h2 className="font-semibold text-slate-900">Payout details</h2>
        <select name="payoutMethod" value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value as typeof payoutMethod)} className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15">
          <option value="MPESA">M-Pesa</option>
          <option value="BANK">Bank transfer</option>
        </select>
        {payoutMethod === "MPESA" ? (
          <input name="mpesaPhone" placeholder="M-Pesa phone number" required className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15" />
        ) : (
          <div className="space-y-3">
            <input name="bankName" placeholder="Bank name" required className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15" />
            <input name="accountNumber" placeholder="Account number" required className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15" />
            <input name="accountName" placeholder="Account name" required className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15" />
          </div>
        )}
      </section>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={isPending} className="w-full rounded-lg bg-brand-teal shadow-sm transition-colors py-2.5 font-semibold text-white hover:bg-brand-teal-dark disabled:opacity-50">
        {isPending ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
