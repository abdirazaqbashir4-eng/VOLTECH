"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideApplicationAction } from "@/app/actions/sellers";

export default function ApplicationDecisionForm({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function decide(decision: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      const result = await decideApplicationAction(applicationId, decision, notes || undefined);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-[var(--border)] bg-white p-4">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Review notes (shown to applicant if rejected)"
        rows={2}
        className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button disabled={isPending} onClick={() => decide("APPROVED")} className="rounded-md bg-brand-teal px-4 py-2 text-sm font-medium text-white hover:bg-brand-teal-dark">
          Approve
        </button>
        <button disabled={isPending} onClick={() => decide("REJECTED")} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
          Reject
        </button>
      </div>
    </div>
  );
}
