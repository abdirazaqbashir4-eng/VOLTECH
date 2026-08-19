import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { auth } from "@/auth";
import PublicHeader from "@/components/PublicHeader";
import ApplyForm from "@/components/ApplyForm";

export const metadata: Metadata = { title: "Become a seller — VOLTECH" };

export default async function ApplyPage() {
  const session = await auth();

  if (session?.user) {
    if (session.user.role === "SELLER") redirect("/dashboard");
    const pending = await db.sellerApplication.findFirst({
      where: { userId: session.user.id, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    });
    if (pending) redirect("/apply/submitted");
  }

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="mb-2 text-xl font-bold text-slate-900">Become a VOLTECH seller</h1>
        {!session?.user ? (
          <div className="rounded-lg border border-[var(--border)] p-6 text-sm text-slate-600">
            You need an account to apply.{" "}
            <a href="/register" className="text-brand-teal hover:underline">
              Create one
            </a>{" "}
            or{" "}
            <a href="/login" className="text-brand-teal hover:underline">
              sign in
            </a>
            .
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-slate-500">Applications are reviewed by our team before your store goes live.</p>
            <ApplyForm />
          </>
        )}
      </main>
    </>
  );
}
