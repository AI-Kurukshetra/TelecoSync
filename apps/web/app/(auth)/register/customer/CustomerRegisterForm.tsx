"use client";

import type { Route } from "next";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RegisterResponse = {
  data?: {
    nextPath?: string;
  };
  error?: {
    message: string;
  };
};

export function CustomerRegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function getStringValue(formData: FormData, key: string) {
    const value = formData.get(key);
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/register/customer", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        fullName: getStringValue(formData, "fullName"),
        email: getStringValue(formData, "email"),
        password: getStringValue(formData, "password"),
        tenantSlug: getStringValue(formData, "tenantSlug"),
        phone: getStringValue(formData, "phone"),
      }),
    });

    const payload = (await response.json()) as RegisterResponse;

    if (!response.ok) {
      setError(payload.error?.message ?? "Unable to create customer.");
      setIsPending(false);
      return;
    }

    router.replace((payload.data?.nextPath ?? "/dashboard") as Route);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium">Full name</span>
        <input
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
          name="fullName"
          required
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium">Email</span>
        <input
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
          name="email"
          type="email"
          required
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium">Phone</span>
        <input
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
          name="phone"
          placeholder="+1 555 010 0042"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium">
          Carrier tenant slug
        </span>
        <input
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
          name="tenantSlug"
          placeholder="demo-telecom"
          pattern="[a-z0-9-]+"
          required
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium">Password</span>
        <input
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
          name="password"
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
        {isPending ? "Creating customer..." : "Create customer"}
      </button>
    </form>
  );
}
