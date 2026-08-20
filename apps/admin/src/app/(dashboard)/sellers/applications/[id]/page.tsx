import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { requireAdmin } from "@/lib/session";
import ApplicationDecisionForm from "@/components/ApplicationDecisionForm";

export const metadata: Metadata = { title: "Seller application" };

export default async function ApplicationDetailPage({ params }: PageProps<"/sellers/applications/[id]">) {
  const { id } = await params;
  await requireAdmin();

  const application = await db.sellerApplication.findUnique({ where: { id }, include: { user: true } });
  if (!application) notFound();

  const payoutDetails = JSON.parse(application.payoutDetails);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">{application.storeName}</h1>
      <p className="mb-6 text-sm text-slate-500">Applicant: {application.user.fullName} ({application.user.email})</p>

      <div className="space-y-4 rounded-lg border border-[var(--border)] bg-white p-5 shadow-xs text-sm">
        <Row label="Store description" value={application.storeDescription} />
        <Row label="Business type" value={application.businessType} />
        {application.businessRegistrationNumber && <Row label="Registration number" value={application.businessRegistrationNumber} />}
        <Row label="ID type" value={application.idType} />
        <Row label="ID number" value={application.idNumber} />
        <Row label="ID document" value={application.idDocumentUrl} link />
        {application.proofOfAddressUrl && <Row label="Proof of address" value={application.proofOfAddressUrl} link />}
        <Row label="Payout method" value={application.payoutMethod} />
        <Row label="Payout details" value={JSON.stringify(payoutDetails)} />
        <Row label="Status" value={application.status} />
        {application.reviewNotes && <Row label="Review notes" value={application.reviewNotes} />}
      </div>

      {(application.status === "SUBMITTED" || application.status === "UNDER_REVIEW") && (
        <div className="mt-4">
          <ApplicationDecisionForm applicationId={application.id} />
        </div>
      )}
    </div>
  );
}

function Row({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-400">{label}</p>
      {link ? (
        <a href={value} target="_blank" rel="noreferrer" className="break-all text-brand-teal hover:underline">
          {value}
        </a>
      ) : (
        <p className="break-words text-slate-800">{value}</p>
      )}
    </div>
  );
}
