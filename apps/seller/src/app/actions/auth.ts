"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { db } from "@voltech/database";
import { hashPassword } from "@voltech/core/password";
import { signIn } from "@/auth";

export async function loginAction(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return { error: null };
  } catch (err) {
    if (err instanceof AuthError) return { error: "Invalid email or password." };
    throw err;
  }
}

export async function registerAction(_prevState: unknown, formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || password.length < 8) {
    return { error: "Please fill in your name, a valid email, and a password of at least 8 characters." };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists." };

  await db.user.create({
    data: {
      email,
      fullName,
      phone: phone || undefined,
      passwordHash: await hashPassword(password),
      role: "CUSTOMER",
      status: "ACTIVE",
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/apply" });
  } catch (err) {
    if (err instanceof AuthError) redirect("/login");
    throw err;
  }
  return { error: null };
}
