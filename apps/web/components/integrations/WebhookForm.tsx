"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCreateWebhook } from "@/lib/hooks/useIntegrations";

function parseHeaders(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = JSON.parse(value) as Record<string, unknown>;

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Headers must be a JSON object.");
  }

  return Object.fromEntries(
    Object.entries(parsed).map(([key, headerValue]) => [key, String(headerValue)])
  );
}

export function WebhookForm() {
  const router = useRouter();
  const createWebhook = useCreateWebhook();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    try {
      setError(null);

      const created = await createWebhook.mutateAsync({
        name: String(formData.get("name") ?? ""),
        targetUrl: String(formData.get("targetUrl") ?? ""),
        eventTypes: String(formData.get("eventTypes") ?? "")
          .split(",")
          .map((eventType) => eventType.trim())
          .filter(Boolean),
        headers: parseHeaders(String(formData.get("headers") ?? "")),
        secret: String(formData.get("secret") ?? "").trim() || undefined,
        enabled: formData.get("enabled") === "on"
      });

      router.replace(`/integrations/webhooks/${created.id}`);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to create webhook subscription."
      );
    }
  }

  return (
    <form action={onSubmit} className="panel grid gap-4 p-5 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <h3 className="text-lg font-semibold">Create webhook subscription</h3>
        <p className="text-sm text-[var(--muted)]">
          Configure the outbound target, event filters, and optional signed delivery secret.
        </p>
      </div>
      <label className="space-y-2">
        <span className="text-sm font-medium">Name</span>
        <input className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" name="name" required />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Target URL</span>
        <input
          className="w-full rounded-2xl border border-[var(--border)] px-4 py-3"
          name="targetUrl"
          required
          type="url"
        />
      </label>
      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium">Event types</span>
        <input
          className="w-full rounded-2xl border border-[var(--border)] px-4 py-3"
          defaultValue="order.created, invoice.created"
          name="eventTypes"
          required
        />
        <p className="text-xs text-[var(--muted)]">Comma-separated dot-notation event types.</p>
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Secret</span>
        <input className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" name="secret" />
      </label>
      <label className="flex items-center gap-3 self-end rounded-2xl border border-[var(--border)] px-4 py-3">
        <input defaultChecked name="enabled" type="checkbox" />
        <span className="text-sm font-medium">Enabled immediately</span>
      </label>
      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium">Headers JSON</span>
        <textarea
          className="min-h-[120px] w-full rounded-2xl border border-[var(--border)] px-4 py-3"
          defaultValue={"{\n  \"x-source\": \"telecosync\"\n}"}
          name="headers"
        />
      </label>
      {error ? <p className="text-sm text-[var(--danger)] md:col-span-2">{error}</p> : null}
      <div className="md:col-span-2">
        <button
          className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          disabled={createWebhook.isPending}
          type="submit"
        >
          {createWebhook.isPending ? "Creating..." : "Create webhook"}
        </button>
      </div>
    </form>
  );
}
