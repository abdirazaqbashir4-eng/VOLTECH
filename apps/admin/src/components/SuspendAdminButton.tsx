"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { suspendAdminAction } from "@/app/actions/admins";

export default function SuspendAdminButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => { await suspendAdminAction(userId); router.refresh(); })}
      className="text-xs text-red-600 hover:underline"
    >
      Suspend
    </button>
  );
}
