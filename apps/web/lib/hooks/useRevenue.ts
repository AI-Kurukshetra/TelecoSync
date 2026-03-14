"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/hooks/fetcher";

type RevenueJob = {
  id: string;
  status: string;
  leakagePct: number | null;
};

export function useRevenue() {
  return useQuery({
    queryKey: ["revenue", "assurance"],
    queryFn: () => fetchJson<RevenueJob[]>("/api/revenue/assurance")
  });
}
