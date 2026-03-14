"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCreateProduct } from "@/lib/hooks/useProducts";

export function ProductCreateForm() {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    try {
      setError(null);
      const priceValue = String(formData.get("price") ?? "").trim();
      const created = await createProduct.mutateAsync({
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
        category: String(formData.get("category") ?? ""),
        price: priceValue ? Number(priceValue) : undefined,
        currency: String(formData.get("currency") ?? "USD"),
        billingCycle: String(formData.get("billingCycle") ?? ""),
        lifecycleStatus: String(formData.get("lifecycleStatus") ?? "Active"),
        version: String(formData.get("version") ?? "1.0")
      });

      router.replace(`/products/${created.id}`);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Unable to create product."
      );
    }
  }

  return (
    <form action={onSubmit} className="grid gap-4 md:grid-cols-2">
      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium">Product name</span>
        <input className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" name="name" required />
      </label>
      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium">Description</span>
        <textarea className="min-h-[120px] w-full rounded-2xl border border-[var(--border)] px-4 py-3" name="description" />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Category</span>
        <input className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" name="category" placeholder="data" />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Price</span>
        <input className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" min="0" name="price" step="0.01" type="number" />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Currency</span>
        <input className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" defaultValue="USD" name="currency" />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Billing cycle</span>
        <input className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" defaultValue="monthly" name="billingCycle" />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Lifecycle</span>
        <input className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" defaultValue="Active" name="lifecycleStatus" />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Version</span>
        <input className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" defaultValue="1.0" name="version" />
      </label>
      {error ? <p className="md:col-span-2 text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="md:col-span-2">
        <button
          className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          disabled={createProduct.isPending}
          type="submit"
        >
          {createProduct.isPending ? "Creating..." : "Create product"}
        </button>
      </div>
    </form>
  );
}
