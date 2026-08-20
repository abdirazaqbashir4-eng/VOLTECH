import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = { title: "Admin sign in" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-1 flex-col justify-center bg-[var(--surface)] px-4">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm sm:p-8">
        <p className="mb-1 text-center font-display text-lg font-bold tracking-tight text-brand-ink">VOLTECH</p>
        <h1 className="mb-1 text-center font-display text-2xl font-bold text-slate-900">Admin sign in</h1>
        <p className="mb-6 text-center text-sm text-slate-500">Sign in with your administrator account</p>
        <LoginForm />
      </div>
    </main>
  );
}
