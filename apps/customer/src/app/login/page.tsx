import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/account";

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center bg-[var(--surface)] px-4 py-12">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm sm:p-8">
          <h1 className="mb-1 text-center font-display text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mb-6 text-center text-sm text-slate-500">Sign in to continue to VOLTECH</p>
          <LoginForm callbackUrl={callbackUrl} />
        </div>
      </main>
      <Footer />
    </>
  );
}
