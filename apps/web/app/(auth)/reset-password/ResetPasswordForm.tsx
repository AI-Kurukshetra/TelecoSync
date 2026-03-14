"use client";

import type { FormEvent } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setIsPending(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsPending(false);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setIsPending(false);
      return;
    }

    router.replace("/login" as Route);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium">New password</span>
        <input
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
          name="password"
          type="password"
          minLength={8}
          required
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium">Confirm password</span>
        <input
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
          name="confirmPassword"
          type="password"
          minLength={8}
          required
        />
      </label>

      {error ? (
        <p className="rounded-2xl border border-[rgba(217,72,95,0.2)] bg-[rgba(217,72,95,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <button
        className="w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Updating password..." : "Update password"}
      </button>
    </form>
  );
}
