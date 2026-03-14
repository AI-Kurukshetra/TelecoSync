"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/hooks/fetcher";

export type InventoryElement = {
  id: string;
  href?: string;
  name: string;
  type: string;
  status: string;
  model?: string | null;
  serial_number?: string | null;
  ip_address?: string | null;
  location_id?: string | null;
  vendor_id?: string | null;
  commissioned_at?: string | null;
  metadata_json?: Record<string, unknown> | null;
};

export type InventoryInterface = {
  id: string;
  network_element_id: string;
  interface_name: string;
  type?: string | null;
  bandwidth_mbps?: number | null;
  status: string;
};

export type InventoryAsset = {
  id: string;
  name: string;
  asset_type?: string | null;
  status: string;
  location_id?: string | null;
  assigned_to?: string | null;
  metadata_json?: Record<string, unknown> | null;
};

type InventoryElementInput = {
  name: string;
  type: string;
  vendorId?: string;
  model?: string;
  serialNumber?: string;
  ipAddress?: string;
  locationId?: string;
  status?: string;
};

type InventoryInterfaceInput = {
  networkElementId: string;
  interfaceName: string;
  type?: string;
  bandwidthMbps?: number;
  status?: string;
};

type InventoryAssetInput = {
  name: string;
  assetType?: string;
  status?: string;
  locationId?: string;
  assignedTo?: string;
  metadata?: Record<string, unknown>;
};

function inventoryListUrl(path: string, limit = 100) {
  return `${path}?limit=${limit}`;
}

async function invalidateInventoryQueries(queryClient: ReturnType<typeof useQueryClient>, key: string) {
  await queryClient.invalidateQueries({ queryKey: ["oss", key] });
  await queryClient.invalidateQueries({ queryKey: ["inventory", key] });
}

export function useInventoryElements(limit = 100) {
  return useQuery({
    queryKey: ["oss", "elements"],
    queryFn: () => fetchJson<InventoryElement[]>(inventoryListUrl("/api/inventory/elements", limit))
  });
}

export function useCreateInventoryElement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InventoryElementInput) =>
      fetchJson<InventoryElement>("/api/inventory/elements", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    onSuccess: async () => {
      await invalidateInventoryQueries(queryClient, "elements");
    }
  });
}

export function useUpdateInventoryElement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<InventoryElementInput> }) =>
      fetchJson<InventoryElement>(`/api/inventory/elements/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input)
      }),
    onSuccess: async (_, variables) => {
      await invalidateInventoryQueries(queryClient, "elements");
      await queryClient.invalidateQueries({ queryKey: ["inventory", "elements", variables.id] });
    }
  });
}

export function useDeleteInventoryElement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string; deleted: boolean }>(`/api/inventory/elements/${id}`, {
        method: "DELETE"
      }),
    onSuccess: async (_, id) => {
      await invalidateInventoryQueries(queryClient, "elements");
      await queryClient.invalidateQueries({ queryKey: ["inventory", "elements", id] });
    }
  });
}

export function useInventoryInterfaces(limit = 100) {
  return useQuery({
    queryKey: ["oss", "interfaces"],
    queryFn: () => fetchJson<InventoryInterface[]>(inventoryListUrl("/api/inventory/interfaces", limit))
  });
}

export function useCreateInventoryInterface() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InventoryInterfaceInput) =>
      fetchJson<InventoryInterface>("/api/inventory/interfaces", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    onSuccess: async () => {
      await invalidateInventoryQueries(queryClient, "interfaces");
    }
  });
}

export function useUpdateInventoryInterface() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<InventoryInterfaceInput> }) =>
      fetchJson<InventoryInterface>(`/api/inventory/interfaces/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input)
      }),
    onSuccess: async () => {
      await invalidateInventoryQueries(queryClient, "interfaces");
    }
  });
}

export function useDeleteInventoryInterface() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string; deleted: boolean }>(`/api/inventory/interfaces/${id}`, {
        method: "DELETE"
      }),
    onSuccess: async () => {
      await invalidateInventoryQueries(queryClient, "interfaces");
    }
  });
}

export function useInventoryAssets(limit = 100) {
  return useQuery({
    queryKey: ["oss", "assets"],
    queryFn: () => fetchJson<InventoryAsset[]>(inventoryListUrl("/api/inventory/assets", limit))
  });
}

export function useCreateInventoryAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InventoryAssetInput) =>
      fetchJson<InventoryAsset>("/api/inventory/assets", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    onSuccess: async () => {
      await invalidateInventoryQueries(queryClient, "assets");
    }
  });
}

export function useUpdateInventoryAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<InventoryAssetInput> }) =>
      fetchJson<InventoryAsset>(`/api/inventory/assets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input)
      }),
    onSuccess: async () => {
      await invalidateInventoryQueries(queryClient, "assets");
    }
  });
}

export function useDeleteInventoryAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string; deleted: boolean }>(`/api/inventory/assets/${id}`, {
        method: "DELETE"
      }),
    onSuccess: async () => {
      await invalidateInventoryQueries(queryClient, "assets");
    }
  });
}
