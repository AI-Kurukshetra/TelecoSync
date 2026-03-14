"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/hooks/fetcher";

type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  orderType: string;
  status: string;
  totalAmount?: number | null;
  currency?: string | null;
  requestedStartDate?: string;
  completionDate?: string | null;
};

type CreateOrderInput = {
  customerId: string;
  orderType: "new" | "modify" | "cancel" | "suspend";
  items: Array<Record<string, unknown>>;
};

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchJson<Order[]>("/api/orders")
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) =>
      fetchJson<Order>("/api/orders", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
  });
}
