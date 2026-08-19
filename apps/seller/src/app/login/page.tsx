import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = { title: "Sign in — VOLTECH Seller Center" };

export default function LoginPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <h1 className="mb-6 text-center text-xl font-bold text-slate-900">Seller sign in</h1>
        <LoginForm />
      </main>
    </>
  );
}
