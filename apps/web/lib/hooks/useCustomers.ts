"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/hooks/fetcher";

type Customer = {
  id: string;
  href?: string;
  accountNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
};

type CreateCustomerInput = {
  accountNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: () => fetchJson<Customer[]>("/api/customers")
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomerInput) =>
      fetchJson<Customer>("/api/customers", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    }
  });
}
