import { requireSessionContext } from "@/lib/api/server-context";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";

export async function getTenantPageContext() {
  const session = await requireSessionContext();
  const supabase = adminTenantClient();

  return { session, supabase };
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

export function formatMoney(amount: number | null | undefined, currency = "USD") {
  return amount === null || amount === undefined ? "—" : formatCurrency(amount, currency);
}

export function formatPercent(value: number | null | undefined, digits = 2) {
  return `${Number(value ?? 0).toFixed(digits)}%`;
}

export function formatDateTime(value: string | null | undefined) {
  return value ? formatDate(value) : "—";
}

export function getStatusTone(status: string | null | undefined) {
  const normalized = (status ?? "").toLowerCase();

  if (["active", "paid", "sent", "completed", "resolved", "success", "enabled"].includes(normalized)) {
    return "success" as const;
  }

  if (["pending", "draft", "queued", "running", "warning"].includes(normalized)) {
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

export function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    const lower = sorted[midpoint - 1] ?? 0;
    const upper = sorted[midpoint] ?? 0;
    return (lower + upper) / 2;
  }

  return sorted[midpoint] ?? 0;
}

export function hoursBetween(from: string | null | undefined, to: string | null | undefined) {
  if (!from || !to) {
    return null;
  }

  return (new Date(to).getTime() - new Date(from).getTime()) / 1000 / 60 / 60;
}
