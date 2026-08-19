"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleCategoryStatusAction } from "@/app/actions/categories";

export default function CategoryStatusToggle({ categoryId, status }: { categoryId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => { await toggleCategoryStatusAction(categoryId); router.refresh(); })}
      className="text-xs text-brand-teal hover:underline"
    >
      {status === "ACTIVE" ? "Deactivate" : "Activate"}
    </button>
  );
}
