import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import RegisterForm from "@/components/RegisterForm";

export const metadata: Metadata = { title: "Create account — VOLTECH Seller Center" };

export default function RegisterPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center bg-[var(--surface)] px-4 py-12">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm sm:p-8">
          <h1 className="mb-1 text-center text-2xl font-bold text-slate-900">Become a seller</h1>
          <p className="mb-6 text-center text-sm text-slate-500">Create your account to get started</p>
          <RegisterForm />
        </div>
      </main>
    </>
  );
}
