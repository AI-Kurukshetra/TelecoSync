"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/hooks/fetcher";

type Invoice = {
  id: string;
  accountId: string;
  invoiceNumber: string;
  status: string;
  total: number | null;
  dueDate?: string | null;
  paidAt?: string | null;
};

type CreateInvoiceInput = {
  accountId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  dueDate?: string;
};

export function useBilling() {
  return useQuery({
    queryKey: ["billing", "invoices"],
    queryFn: () => fetchJson<Invoice[]>("/api/billing/invoices")
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInvoiceInput) =>
      fetchJson<Invoice>("/api/billing/invoices", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["billing", "invoices"] });
    }
  });
}
