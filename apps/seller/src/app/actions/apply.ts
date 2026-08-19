"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { submitSellerApplication } from "@voltech/core/marketplace/sellers";

export async function submitApplicationAction(_prevState: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Please sign in first." };

  const businessType = String(formData.get("businessType") ?? "INDIVIDUAL") as "INDIVIDUAL" | "REGISTERED_BUSINESS";
  const idType = String(formData.get("idType") ?? "NATIONAL_ID") as "NATIONAL_ID" | "PASSPORT";
  const payoutMethod = String(formData.get("payoutMethod") ?? "MPESA") as "MPESA" | "BANK";

  const payoutDetails =
    payoutMethod === "MPESA"
      ? JSON.stringify({ phone: String(formData.get("mpesaPhone") ?? "") })
      : JSON.stringify({
          bankName: String(formData.get("bankName") ?? ""),
          accountNumber: String(formData.get("accountNumber") ?? ""),
          accountName: String(formData.get("accountName") ?? ""),
        });

  try {
    await submitSellerApplication({
      userId: session.user.id,
      storeName: String(formData.get("storeName") ?? "").trim(),
      storeDescription: String(formData.get("storeDescription") ?? "").trim(),
      businessType,
      businessRegistrationNumber: (String(formData.get("businessRegistrationNumber") ?? "").trim() || undefined),
      idType,
      idNumber: String(formData.get("idNumber") ?? "").trim(),
      idDocumentUrl: String(formData.get("idDocumentUrl") ?? "").trim(),
      proofOfAddressUrl: (String(formData.get("proofOfAddressUrl") ?? "").trim() || undefined),
      payoutMethod,
      payoutDetails,
    });
  } catch (err) {
    return { error: (err as Error).message };
  }

  redirect("/apply/submitted");
}
