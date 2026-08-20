"use server";

import { db } from "@voltech/database";
import { createFirebaseUser, setUserRoleClaims, createCustomToken, deleteFirebaseUser } from "@voltech/core/firebase-admin";

// Registration here creates a plain CUSTOMER-role account — role is only
// promoted to SELLER once an admin approves the application submitted
// afterward on /apply. See proxy.ts for why /apply is public.
export async function registerAction(_prevState: unknown, formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || password.length < 8) {
    return { error: "Please fill in your name, a valid email, and a password of at least 8 characters.", customToken: null };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists.", customToken: null };
  }

  let firebaseUser;
  try {
    firebaseUser = await createFirebaseUser({ email, password, displayName: fullName });
  } catch {
    return { error: "An account with this email already exists.", customToken: null };
  }

  try {
    const user = await db.user.create({
      data: {
        email,
        firebaseUid: firebaseUser.uid,
        fullName,
        phone: phone || undefined,
        role: "CUSTOMER",
        status: "ACTIVE",
      },
    });
    await setUserRoleClaims(firebaseUser.uid, { role: "CUSTOMER", appUserId: user.id });
    const customToken = await createCustomToken(firebaseUser.uid);
    return { error: null, customToken };
  } catch (err) {
    await deleteFirebaseUser(firebaseUser.uid).catch(() => {});
    console.error(err);
    return { error: "Could not create your account. Please try again.", customToken: null };
  }
}
