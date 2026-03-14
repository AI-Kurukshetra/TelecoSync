"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { SectionCard } from "@/components/ui/SectionCard";

const importableResources = ["customers", "products", "network_elements"] as const;
const exportableResources = [
  "customers",
  "products",
  "orders",
  "invoices",
  "network_elements"
] as const;

export function DataOpsPanel() {
  const [exportResource, setExportResource] =
    useState<(typeof exportableResources)[number]>("customers");
  const [importResource, setImportResource] =
    useState<(typeof importableResources)[number]>("customers");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  async function onImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsImporting(true);

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");

    if (!(file instanceof File)) {
      setError("Select a CSV file before importing.");
      setIsImporting(false);
      return;
    }

    formData.set("resource", importResource);

    const response = await fetch("/api/admin/import", {
      method: "POST",
      body: formData
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload?.error?.message ?? "Import failed.");
      setIsImporting(false);
      return;
    }

    setMessage(`Imported ${payload.data?.imported ?? 0} ${importResource} rows.`);
    setIsImporting(false);
    event.currentTarget.reset();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SectionCard
        title="CSV export"
        description="Generate tenant-scoped CSV extracts for bulk reconciliation, audits, and downstream exchange."
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Resource</span>
            <select
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
              onChange={(event) =>
                setExportResource(
                  event.target.value as (typeof exportableResources)[number]
                )
              }
              value={exportResource}
            >
              {exportableResources.map((resource) => (
                <option key={resource} value={resource}>
                  {resource}
                </option>
              ))}
            </select>
          </label>
          <a
            className="inline-flex rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white"
            href={`/api/admin/export?resource=${exportResource}`}
          >
            Download CSV
          </a>
        </div>
      </SectionCard>

      <SectionCard
        title="CSV import"
        description="Upload tenant-scoped CSV payloads to seed or bulk-update operational data sets."
      >
        <form className="space-y-4" onSubmit={onImport}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Resource</span>
            <select
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
              onChange={(event) =>
                setImportResource(
                  event.target.value as (typeof importableResources)[number]
                )
              }
              value={importResource}
            >
              {importableResources.map((resource) => (
                <option key={resource} value={resource}>
                  {resource}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">CSV file</span>
            <input
              accept=".csv,text/csv"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm outline-none"
              name="file"
              type="file"
              required
            />
          </label>

          {message ? (
            <p className="rounded-2xl border border-[rgba(0,127,115,0.2)] bg-[rgba(0,127,115,0.08)] px-4 py-3 text-sm text-[var(--accent-strong)]">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-2xl border border-[rgba(217,72,95,0.2)] bg-[rgba(217,72,95,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
              {error}
            </p>
          ) : null}

          <button
            className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isImporting}
            type="submit"
          >
            {isImporting ? "Importing..." : "Import CSV"}
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
