"use client";

import { useEffect } from "react";
import type { QueryKey } from "@tanstack/react-query";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ModulePage } from "@/components/layout/ModulePage";
import { SectionCard } from "@/components/ui/SectionCard";
import { fetchJson } from "@/lib/hooks/fetcher";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";

type LiveSubscription = {
  channelName: string;
  queryKeys: QueryKey[];
  table: string;
  schema?: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
};

type LiveModuleStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  message: string;
};

export function formatMoney(value: number | null | undefined, currency = "USD") {
  return value === null || value === undefined ? "—" : formatCurrency(value, currency);
}

export function formatDateTime(value: string | null | undefined) {
  return value ? formatDate(value) : "—";
}

export function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US").format(value);
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export function formatPercent(value: number | null | undefined, digits = 2) {
  return `${Number(value ?? 0).toFixed(digits)}%`;
}

export function getStatusTone(status: string | null | undefined) {
  const normalized = (status ?? "").toLowerCase();

  if (["active", "paid", "sent", "completed", "resolved", "success", "enabled", "processed"].includes(normalized)) {
    return "success" as const;
  }

  if (["pending", "draft", "queued", "running", "warning", "retrying"].includes(normalized)) {
    return "warning" as const;
  }

  if (["failed", "inactive", "open", "critical", "disabled", "cancelled"].includes(normalized)) {
    return "danger" as const;
  }

  return "neutral" as const;
}

export function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function hoursBetween(from: string | null | undefined, to: string | null | undefined) {
  if (!from || !to) {
    return null;
  }

  return (new Date(to).getTime() - new Date(from).getTime()) / 1000 / 60 / 60;
}

export function useLiveSubscriptions(subscriptions: LiveSubscription[]) {
  const queryClient = useQueryClient();
  const subscriptionsHash = JSON.stringify(subscriptions);

  useEffect(() => {
    const parsed = JSON.parse(subscriptionsHash) as LiveSubscription[];
    const supabase = createBrowserSupabaseClient();
    const channels = parsed.map((subscription) =>
      supabase
        .channel(subscription.channelName)
        .on(
          "postgres_changes",
          {
            schema: subscription.schema ?? "public",
            table: subscription.table,
            event: subscription.event ?? "*"
          },
          () => {
            subscription.queryKeys.forEach((queryKey) => {
              void queryClient.invalidateQueries({ queryKey });
            });
          }
        )
        .subscribe()
    );

    return () => {
      channels.forEach((channel) => {
        void supabase.removeChannel(channel);
      });
    };
  }, [queryClient, subscriptionsHash]);
}

export function useLiveRestResource<T>({
  endpoint,
  queryKey,
  subscriptions
}: {
  endpoint: string;
  queryKey: QueryKey;
  subscriptions: LiveSubscription[];
}) {
  useLiveSubscriptions(subscriptions);

  return useQuery({
    queryKey,
    queryFn: () => fetchJson<T>(endpoint)
  });
}

export function useLiveRestCollection<T>({
  endpoint,
  queryKey,
  subscriptions
}: {
  endpoint: string;
  queryKey: QueryKey;
  subscriptions: LiveSubscription[];
}) {
  useLiveSubscriptions(subscriptions);

  return useQuery({
    queryKey,
    queryFn: () => fetchJson<T[]>(endpoint)
  });
}

export function LoadingModulePage({
  eyebrow,
  title,
  description,
  message
}: LiveModuleStateProps) {
  return (
    <ModulePage
      eyebrow={eyebrow}
      title={title}
      description={description}
      stats={[{ label: "State", value: "Loading" }]}
    >
      <SectionCard title="Live state" description="Fetching the latest tenant-scoped data for this view.">
        <p className="text-sm text-[var(--muted)]">{message}</p>
      </SectionCard>
    </ModulePage>
  );
}

export function ErrorModulePage({
  eyebrow,
  title,
  description,
  message
}: LiveModuleStateProps) {
  return (
    <ModulePage
      eyebrow={eyebrow}
      title={title}
      description={description}
      stats={[{ label: "State", value: "Error" }]}
    >
      <SectionCard title="Live state" description="The UI is connected to live sources, but this request failed.">
        <p className="text-sm text-[var(--danger)]">{message}</p>
      </SectionCard>
    </ModulePage>
  );
}

export function NotFoundModulePage({
  eyebrow,
  title,
  description,
  message
}: LiveModuleStateProps) {
  return (
    <ModulePage
      eyebrow={eyebrow}
      title={title}
      description={description}
      stats={[{ label: "State", value: "Not found" }]}
    >
      <SectionCard title="Live state" description="No tenant-scoped record was returned for this route.">
        <p className="text-sm text-[var(--muted)]">{message}</p>
      </SectionCard>
    </ModulePage>
  );
}

export function getQueryErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
