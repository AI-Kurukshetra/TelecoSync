"use client";

import type { FormEvent } from "react";
import { useState } from "react";

type ForgotPasswordResponse = {
  data?: {
    sent?: boolean;
  };
  error?: {
    message: string;
  };
};

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    setSent(false);
    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: formData.get("email")
      })
    });

    const payload = (await response.json()) as ForgotPasswordResponse;

    if (!response.ok) {
      setError(payload.error?.message ?? "Unable to send recovery email.");
      setIsPending(false);
      return;
    }

    setSent(Boolean(payload.data?.sent));
    setIsPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium">Work email</span>
        <input
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
          name="email"
          placeholder="ops@tenant.com"
          type="email"
          required
        />
      </label>

      {error ? (
        <p className="rounded-2xl border border-[rgba(217,72,95,0.2)] bg-[rgba(217,72,95,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      {sent ? (
        <p className="rounded-2xl border border-[rgba(37,99,235,0.16)] bg-[rgba(37,99,235,0.08)] px-4 py-3 text-sm text-[var(--accent)]">
          Recovery instructions were sent if the account exists for this workspace.
        </p>
      ) : null}

      <button
        className="w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Sending link..." : "Send recovery link"}
      </button>
    </form>
  );
}
