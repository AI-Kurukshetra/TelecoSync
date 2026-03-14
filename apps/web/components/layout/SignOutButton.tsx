"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function onClick() {
    setIsPending(true);
    await fetch("/api/auth/logout", {
      method: "POST"
    });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="min-h-[4.625rem] rounded-[22px] border border-[var(--border)] bg-white/72 px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--signal-soft)]"
      disabled={isPending}
      onClick={onClick}
      type="button"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
