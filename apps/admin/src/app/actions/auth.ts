"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function loginAction(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return { error: null };
  } catch (err) {
    if (err instanceof AuthError) return { error: "Invalid email or password, or this account is not an administrator." };
    throw err;
  }
}
