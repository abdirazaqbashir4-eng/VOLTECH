import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import RegisterForm from "@/components/RegisterForm";

export const metadata: Metadata = { title: "Create account — VOLTECH Seller Center" };

export default function RegisterPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <h1 className="mb-6 text-center text-xl font-bold text-slate-900">Create your account</h1>
        <RegisterForm />
      </main>
    </>
  );
}
