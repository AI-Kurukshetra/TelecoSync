"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/hooks/fetcher";

type CreateWebhookInput = {
  name: string;
  targetUrl: string;
  eventTypes: string[];
  headers?: Record<string, string>;
  secret?: string;
  enabled?: boolean;
};

type WebhookRecord = {
  id: string;
  name: string;
  target_url: string;
  event_types: string[];
  enabled: boolean;
  created_at?: string;
};

type EventLogRecord = {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  source_service: string;
  processed: boolean;
  fired_at: string;
};

type ConnectorRecord = {
  id: string;
  name: string;
  connector_type: string;
  direction: string;
  system_type: string;
  enabled: boolean;
  last_run_at?: string | null;
  last_run_status?: string | null;
};

type ApiRegistryRecord = {
  id: string;
  name: string;
  slug: string;
  version: string;
  standard?: string | null;
  auth_type: string;
  status: string;
  owner_team?: string | null;
};

type AnalyticsSnapshot = {
  uptimePct30d: number;
  medianOrderProcessingHours: number;
  invoiceToPaymentHours: number;
  faultResolutionHours: number;
  billingAccuracyRate: number;
  revenueLeakagePct: number;
  webhookDeliverySuccessPct: number;
  activeTenants: number;
  connectorExecutionSuccessRate: number;
  dailyActiveUsers: number;
  vercelP95Ms: number;
};

export function useWebhooks() {
  return useQuery({
    queryKey: ["integrations", "webhooks"],
    queryFn: () => fetchJson<WebhookRecord[]>("/api/integrations/webhooks")
  });
}

export function useIntegrationEvents() {
  return useQuery({
    queryKey: ["integrations", "events"],
    queryFn: () => fetchJson<EventLogRecord[]>("/api/integrations/events")
  });
}

export function useConnectors() {
  return useQuery({
    queryKey: ["integrations", "connectors"],
    queryFn: () => fetchJson<ConnectorRecord[]>("/api/integrations/connectors")
  });
}

export function useApiRegistry() {
  return useQuery({
    queryKey: ["integrations", "registry"],
    queryFn: () => fetchJson<ApiRegistryRecord[]>("/api/integrations/registry")
  });
}

export function useAnalyticsSnapshot() {
  return useQuery({
    queryKey: ["analytics", "snapshot"],
    queryFn: () => fetchJson<AnalyticsSnapshot>("/api/analytics")
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWebhookInput) =>
      fetchJson<WebhookRecord>("/api/integrations/webhooks", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["integrations", "webhooks"] });
    }
  });
}
