"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCreateCustomer } from "@/lib/hooks/useCustomers";

export function CustomerCreateForm() {
  const router = useRouter();
  const createCustomer = useCreateCustomer();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    try {
      setError(null);
      const created = await createCustomer.mutateAsync({
        accountNumber: String(formData.get("accountNumber") ?? ""),
        firstName: String(formData.get("firstName") ?? ""),
        lastName: String(formData.get("lastName") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? "")
      });

      router.replace(`/customers/${created.id}`);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Unable to create customer."
      );
    }
  }

  return (
    <form action={onSubmit} className="grid gap-4 md:grid-cols-2">
      <label className="space-y-2">
        <span className="text-sm font-medium">Account number</span>
        <input className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" name="accountNumber" required />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Email</span>
        <input className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" name="email" type="email" required />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">First name</span>
        <input className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" name="firstName" required />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Last name</span>
        <input className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" name="lastName" required />
      </label>
      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium">Phone</span>
        <input className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" name="phone" />
      </label>
      {error ? <p className="md:col-span-2 text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="md:col-span-2">
        <button
          className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          disabled={createCustomer.isPending}
          type="submit"
        >
          {createCustomer.isPending ? "Creating..." : "Create customer"}
        </button>
      </div>
    </form>
  );
}
