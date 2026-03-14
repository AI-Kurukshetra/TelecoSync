"use client";

import type { Route } from "next";
import type { FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

type LoginResponse = {
  data?: {
    nextPath?: string;
  };
  error?: {
    message: string;
  };
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/workspace";
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
        next: nextPath
      })
    });

    const payload = (await response.json()) as LoginResponse;

    if (!response.ok) {
      setError(payload.error?.message ?? "Unable to sign in.");
      setIsPending(false);
      return;
    }

    router.replace((payload.data?.nextPath ?? nextPath) as Route);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium">Email</span>
        <input
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
          name="email"
          placeholder="ops@tenant.com"
          type="email"
          required
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium">Password</span>
        <input
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
          name="password"
          type="password"
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
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
