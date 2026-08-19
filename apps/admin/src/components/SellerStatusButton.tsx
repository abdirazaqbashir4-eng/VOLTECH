"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSellerStatusAction } from "@/app/actions/sellers";

export default function SellerStatusButton({ sellerId, status }: { sellerId: string; status: "APPROVED" | "SUSPENDED" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const next = status === "APPROVED" ? "SUSPENDED" : "APPROVED";

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await setSellerStatusAction(sellerId, next);
          router.refresh();
        })
      }
      className={`rounded-md px-4 py-2 text-sm font-medium ${next === "SUSPENDED" ? "bg-red-600 text-white hover:bg-red-700" : "bg-brand-teal text-white hover:bg-brand-teal-dark"}`}
    >
      {next === "SUSPENDED" ? "Suspend store" : "Reinstate store"}
    </button>
  );
}
