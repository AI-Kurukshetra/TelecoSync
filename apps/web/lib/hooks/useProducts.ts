"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/hooks/fetcher";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price?: number | null;
  currency?: string | null;
  billingCycle?: string | null;
  lifecycleStatus?: string | null;
  version?: string | null;
};

type CreateProductInput = {
  name: string;
  description?: string;
  category?: string;
  price?: number;
  currency?: string;
  billingCycle?: string;
  lifecycleStatus?: string;
  version?: string;
};

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => fetchJson<Product[]>("/api/products")
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) =>
      fetchJson<Product>("/api/products", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  });
}
