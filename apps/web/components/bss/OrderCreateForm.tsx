"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useCreateOrder } from "@/lib/hooks/useOrders";
import { useProducts } from "@/lib/hooks/useProducts";
import { useLiveQueryInvalidation } from "@/lib/hooks/useLiveQueryInvalidation";

type Option = {
  id: string;
  label: string;
};

export function OrderCreateForm({
  customers = [],
  products = []
}: {
  customers?: Option[];
  products?: Option[];
}) {
  const router = useRouter();
  const createOrder = useCreateOrder();
  const [error, setError] = useState<string | null>(null);
  const customersQuery = useCustomers();
  const productsQuery = useProducts();

  useLiveQueryInvalidation({
    channelName: "order-create-customers",
    queryKeys: [["customers"]],
    table: "customers"
  });
  useLiveQueryInvalidation({
    channelName: "order-create-products",
    queryKeys: [["products"]],
    table: "products"
  });

  const customerOptions =
    customers.length > 0
      ? customers
      : (customersQuery.data ?? []).map((customer) => ({
          id: customer.id,
          label: `${customer.firstName} ${customer.lastName}`
        }));
  const productOptions =
    products.length > 0
      ? products
      : (productsQuery.data ?? []).map((product) => ({
          id: product.id,
          label: product.name
        }));
  const isLoadingOptions =
    customers.length === 0 && products.length === 0 && (customersQuery.isLoading || productsQuery.isLoading);

  async function onSubmit(formData: FormData) {
    try {
      setError(null);
      const productId = String(formData.get("productId") ?? "");
      const quantity = Number(String(formData.get("quantity") ?? "1"));
      const created = await createOrder.mutateAsync({
        customerId: String(formData.get("customerId") ?? ""),
        orderType: String(formData.get("orderType") ?? "new") as
          | "new"
          | "modify"
          | "cancel"
          | "suspend",
        items: [
          {
            productId,
            quantity,
            note: String(formData.get("note") ?? "")
          }
        ]
      });

      router.replace(`/orders/${created.id}`);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Unable to create order."
      );
    }
  }

  return (
    <form action={onSubmit} className="grid gap-4 md:grid-cols-2">
      <label className="space-y-2">
        <span className="text-sm font-medium">Customer</span>
        <select
          className="w-full rounded-2xl border border-[var(--border)] px-4 py-3"
          disabled={isLoadingOptions}
          name="customerId"
          required
        >
          <option value="">Select customer</option>
          {customerOptions.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Order type</span>
        <select className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" defaultValue="new" name="orderType">
          <option value="new">new</option>
          <option value="modify">modify</option>
          <option value="cancel">cancel</option>
          <option value="suspend">suspend</option>
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Product</span>
        <select
          className="w-full rounded-2xl border border-[var(--border)] px-4 py-3"
          disabled={isLoadingOptions}
          name="productId"
          required
        >
          <option value="">Select product</option>
          {productOptions.map((product) => (
            <option key={product.id} value={product.id}>
              {product.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Quantity</span>
        <input
          className="w-full rounded-2xl border border-[var(--border)] px-4 py-3"
          defaultValue="1"
          min="1"
          name="quantity"
          type="number"
        />
      </label>
      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium">Note</span>
        <textarea className="min-h-[120px] w-full rounded-2xl border border-[var(--border)] px-4 py-3" name="note" />
      </label>
      {isLoadingOptions ? <p className="md:col-span-2 text-sm text-[var(--muted)]">Loading customer and product options...</p> : null}
      {error ? <p className="md:col-span-2 text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="md:col-span-2">
        <button
          className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          disabled={createOrder.isPending}
          type="submit"
        >
          {createOrder.isPending ? "Creating..." : "Create order"}
        </button>
      </div>
    </form>
  );
}
