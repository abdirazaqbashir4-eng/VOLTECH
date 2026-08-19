import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = { title: "Admin sign in" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-1 flex-col justify-center px-4">
      <h1 className="mb-1 text-center text-xl font-bold text-slate-900">VOLTECH Admin</h1>
      <p className="mb-6 text-center text-sm text-slate-500">Sign in with your administrator account</p>
      <LoginForm />
    </main>
  );
}
