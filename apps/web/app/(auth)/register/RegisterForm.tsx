"use client";

import type { Route } from "next";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RegisterRole = "admin" | "inventory_manager" | "customer";

type RegisterResponse = {
  data?: {
    nextPath?: string;
  };
  error?: {
    message: string;
  };
};

const roleDescriptions: Record<RegisterRole, string> = {
  admin: "",
  inventory_manager: "",
  customer: ""
};

export function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<RegisterRole>("admin");
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

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        role: getStringValue(formData, "role"),
        fullName: getStringValue(formData, "fullName"),
        department: getStringValue(formData, "department"),
        email: getStringValue(formData, "email"),
        password: getStringValue(formData, "password"),
        tenantName: getStringValue(formData, "tenantName"),
        tenantSlug: getStringValue(formData, "tenantSlug"),
        phone: getStringValue(formData, "phone")
      })
    });

    const payload = (await response.json()) as RegisterResponse;

    if (!response.ok) {
      setError(payload.error?.message ?? "Unable to complete signup.");
      setIsPending(false);
      return;
    }

    router.replace((payload.data?.nextPath ?? "/workspace") as Route);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium">Role</span>
        <select
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
          name="role"
          onChange={(event) => setRole(event.target.value as RegisterRole)}
          value={role}
        >
          <option value="admin">Admin</option>
          <option value="inventory_manager">Inventory manager</option>
          <option value="customer">Customer</option>
        </select>
      </label>

      {roleDescriptions[role] ? (
        <p className="rounded-2xl border border-[var(--border)] bg-white/60 px-4 py-3 text-sm leading-6 text-[var(--muted)]">
          {roleDescriptions[role]}
        </p>
      ) : null}

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

      {role !== "customer" ? (
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Department</span>
          <input
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
            defaultValue={role === "admin" ? "Administration" : "Inventory"}
            name="department"
            placeholder={role === "admin" ? "Administration" : "Inventory"}
            required
          />
        </label>
      ) : null}

      {role === "customer" ? (
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Phone</span>
          <input
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
            name="phone"
            placeholder="+1 555 010 0042"
          />
        </label>
      ) : null}

      <label className="block">
        <span className="mb-2 block text-sm font-medium">Password</span>
        <input
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
          minLength={8}
          name="password"
          type="password"
          required
        />
      </label>

      {role === "admin" ? (
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Tenant name</span>
          <input
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
            name="tenantName"
            placeholder="Demo Telecom"
            required
          />
        </label>
      ) : null}

      <label className="block">
        <span className="mb-2 block text-sm font-medium">
          {role === "admin" ? "Tenant slug" : "Existing tenant slug"}
        </span>
        <input
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
          name="tenantSlug"
          pattern="[a-z0-9-]+"
          placeholder="demo-telecom"
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
        {isPending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
