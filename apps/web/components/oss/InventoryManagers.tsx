"use client";

import { useEffect, useState } from "react";
import {
  useCreateInventoryAsset,
  useCreateInventoryElement,
  useCreateInventoryInterface,
  useDeleteInventoryAsset,
  useDeleteInventoryElement,
  useDeleteInventoryInterface,
  useInventoryAssets,
  useInventoryElements,
  useInventoryInterfaces,
  useUpdateInventoryAsset,
  useUpdateInventoryElement,
  useUpdateInventoryInterface
} from "@/lib/hooks/useInventory";
import { SectionCard } from "@/components/ui/SectionCard";

const inputClassName = "w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3";
const buttonClassName =
  "rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

function formatMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function ActionButtons({
  isSubmitting,
  canManage,
  onArchive,
  onDelete,
  submitLabel
}: {
  isSubmitting: boolean;
  canManage: boolean;
  onArchive: () => Promise<void>;
  onDelete: () => Promise<void>;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button className={`${buttonClassName} bg-[var(--ink)] text-white`} disabled={isSubmitting} type="submit">
        {submitLabel}
      </button>
      <button
        className={`${buttonClassName} border border-[var(--border)] bg-white text-[var(--ink)]`}
        disabled={!canManage || isSubmitting}
        onClick={() => void onArchive()}
        type="button"
      >
        Archive
      </button>
      <button
        className={`${buttonClassName} bg-[var(--danger)] text-white`}
        disabled={!canManage || isSubmitting}
        onClick={() => void onDelete()}
        type="button"
      >
        Delete
      </button>
    </div>
  );
}

export function InventoryElementManager() {
  const elementsQuery = useInventoryElements();
  const createElement = useCreateInventoryElement();
  const updateElement = useUpdateInventoryElement();
  const deleteElement = useDeleteInventoryElement();
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "",
    model: "",
    serialNumber: "",
    ipAddress: "",
    status: "active"
  });

  const elements = elementsQuery.data ?? [];
  const selected = elements.find((item) => item.id === selectedId) ?? null;
  const isSubmitting = createElement.isPending || updateElement.isPending || deleteElement.isPending;

  useEffect(() => {
    if (!selected) {
      setForm({
        name: "",
        type: "",
        model: "",
        serialNumber: "",
        ipAddress: "",
        status: "active"
      });
      return;
    }

    setForm({
      name: selected.name ?? "",
      type: selected.type ?? "",
      model: selected.model ?? "",
      serialNumber: selected.serial_number ?? "",
      ipAddress: selected.ip_address ?? "",
      status: selected.status ?? "active"
    });
  }, [selected]);

  async function onSubmit(formData: FormData) {
    try {
      setError(null);
      setNotice(null);
      const payload = {
        name: String(formData.get("name") ?? ""),
        type: String(formData.get("type") ?? ""),
        model: String(formData.get("model") ?? "") || undefined,
        serialNumber: String(formData.get("serialNumber") ?? "") || undefined,
        ipAddress: String(formData.get("ipAddress") ?? "") || undefined,
        status: String(formData.get("status") ?? "active")
      };

      if (selectedId) {
        await updateElement.mutateAsync({ id: selectedId, input: payload });
        setNotice("Network element updated.");
      } else {
        const created = await createElement.mutateAsync(payload);
        setSelectedId(created.id);
        setNotice("Network element created.");
      }
    } catch (submissionError) {
      setError(formatMessage(submissionError, "Unable to save network element."));
    }
  }

  async function onArchive() {
    if (!selectedId) {
      return;
    }

    try {
      setError(null);
      setNotice(null);
      await updateElement.mutateAsync({ id: selectedId, input: { status: "archived" } });
      setNotice("Network element archived.");
    } catch (archiveError) {
      setError(formatMessage(archiveError, "Unable to archive network element."));
    }
  }

  async function onDelete() {
    if (!selectedId) {
      return;
    }

    try {
      setError(null);
      setNotice(null);
      await deleteElement.mutateAsync(selectedId);
      setSelectedId("");
      setNotice("Network element deleted.");
    } catch (deleteError) {
      setError(formatMessage(deleteError, "Unable to delete network element."));
    }
  }

  return (
    <SectionCard
      title="Manage network elements"
      description="Create a new element or pick an existing one to update, archive, or delete."
    >
      <form action={onSubmit} className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium">Existing element</span>
          <select
            className={inputClassName}
            disabled={elementsQuery.isLoading}
            name="selectedElement"
            onChange={(event) => setSelectedId(event.target.value)}
            value={selectedId}
          >
            <option value="">Create new element</option>
            {elements.map((element) => (
              <option key={element.id} value={element.id}>
                {element.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Element name</span>
          <input className={inputClassName} name="name" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required value={form.name} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Type</span>
          <input className={inputClassName} name="type" onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} placeholder="router" required value={form.type} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Model</span>
          <input className={inputClassName} name="model" onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))} value={form.model} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Serial number</span>
          <input className={inputClassName} name="serialNumber" onChange={(event) => setForm((current) => ({ ...current, serialNumber: event.target.value }))} value={form.serialNumber} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">IP address</span>
          <input className={inputClassName} name="ipAddress" onChange={(event) => setForm((current) => ({ ...current, ipAddress: event.target.value }))} value={form.ipAddress} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Status</span>
          <select className={inputClassName} name="status" onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} value={form.status}>
            <option value="active">active</option>
            <option value="maintenance">maintenance</option>
            <option value="inactive">inactive</option>
            <option value="archived">archived</option>
          </select>
        </label>
        {notice ? <p className="md:col-span-2 text-sm text-[var(--accent-strong)]">{notice}</p> : null}
        {error ? <p className="md:col-span-2 text-sm text-[var(--danger)]">{error}</p> : null}
        <div className="md:col-span-2">
          <ActionButtons
            canManage={Boolean(selectedId)}
            isSubmitting={isSubmitting}
            onArchive={onArchive}
            onDelete={onDelete}
            submitLabel={selectedId ? "Update element" : "Create element"}
          />
        </div>
      </form>
    </SectionCard>
  );
}

export function InventoryInterfaceManager() {
  const elementsQuery = useInventoryElements();
  const interfacesQuery = useInventoryInterfaces();
  const createInterface = useCreateInventoryInterface();
  const updateInterface = useUpdateInventoryInterface();
  const deleteInterface = useDeleteInventoryInterface();
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    networkElementId: "",
    interfaceName: "",
    type: "",
    bandwidthMbps: "",
    status: "active"
  });

  const interfaces = interfacesQuery.data ?? [];
  const elements = elementsQuery.data ?? [];
  const selected = interfaces.find((item) => item.id === selectedId) ?? null;
  const isSubmitting = createInterface.isPending || updateInterface.isPending || deleteInterface.isPending;

  useEffect(() => {
    if (!selected) {
      setForm({
        networkElementId: "",
        interfaceName: "",
        type: "",
        bandwidthMbps: "",
        status: "active"
      });
      return;
    }

    setForm({
      networkElementId: selected.network_element_id ?? "",
      interfaceName: selected.interface_name ?? "",
      type: selected.type ?? "",
      bandwidthMbps: selected.bandwidth_mbps ? String(selected.bandwidth_mbps) : "",
      status: selected.status ?? "active"
    });
  }, [selected]);

  async function onSubmit(formData: FormData) {
    try {
      setError(null);
      setNotice(null);
      const bandwidthValue = String(formData.get("bandwidthMbps") ?? "").trim();
      const payload = {
        networkElementId: String(formData.get("networkElementId") ?? ""),
        interfaceName: String(formData.get("interfaceName") ?? ""),
        type: String(formData.get("type") ?? "") || undefined,
        bandwidthMbps: bandwidthValue ? Number(bandwidthValue) : undefined,
        status: String(formData.get("status") ?? "active")
      };

      if (selectedId) {
        await updateInterface.mutateAsync({ id: selectedId, input: payload });
        setNotice("Interface updated.");
      } else {
        const created = await createInterface.mutateAsync(payload);
        setSelectedId(created.id);
        setNotice("Interface created.");
      }
    } catch (submissionError) {
      setError(formatMessage(submissionError, "Unable to save interface."));
    }
  }

  async function onArchive() {
    if (!selectedId) {
      return;
    }

    try {
      setError(null);
      setNotice(null);
      await updateInterface.mutateAsync({ id: selectedId, input: { status: "archived" } });
      setNotice("Interface archived.");
    } catch (archiveError) {
      setError(formatMessage(archiveError, "Unable to archive interface."));
    }
  }

  async function onDelete() {
    if (!selectedId) {
      return;
    }

    try {
      setError(null);
      setNotice(null);
      await deleteInterface.mutateAsync(selectedId);
      setSelectedId("");
      setNotice("Interface deleted.");
    } catch (deleteError) {
      setError(formatMessage(deleteError, "Unable to delete interface."));
    }
  }

  return (
    <SectionCard
      title="Manage interfaces"
      description="Create a new port or edit an existing interface on a selected network element."
    >
      <form action={onSubmit} className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium">Existing interface</span>
          <select
            className={inputClassName}
            disabled={interfacesQuery.isLoading}
            name="selectedInterface"
            onChange={(event) => setSelectedId(event.target.value)}
            value={selectedId}
          >
            <option value="">Create new interface</option>
            {interfaces.map((item) => (
              <option key={item.id} value={item.id}>
                {item.interface_name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Network element</span>
          <select className={inputClassName} name="networkElementId" onChange={(event) => setForm((current) => ({ ...current, networkElementId: event.target.value }))} required value={form.networkElementId}>
            <option value="">Select element</option>
            {elements.map((element) => (
              <option key={element.id} value={element.id}>
                {element.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Interface name</span>
          <input className={inputClassName} name="interfaceName" onChange={(event) => setForm((current) => ({ ...current, interfaceName: event.target.value }))} placeholder="ge-0/0/1" required value={form.interfaceName} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Type</span>
          <input className={inputClassName} name="type" onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} placeholder="ethernet" value={form.type} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Bandwidth Mbps</span>
          <input className={inputClassName} min="0" name="bandwidthMbps" onChange={(event) => setForm((current) => ({ ...current, bandwidthMbps: event.target.value }))} step="1" type="number" value={form.bandwidthMbps} />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium">Status</span>
          <select className={inputClassName} name="status" onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} value={form.status}>
            <option value="active">active</option>
            <option value="maintenance">maintenance</option>
            <option value="inactive">inactive</option>
            <option value="archived">archived</option>
          </select>
        </label>
        {notice ? <p className="md:col-span-2 text-sm text-[var(--accent-strong)]">{notice}</p> : null}
        {error ? <p className="md:col-span-2 text-sm text-[var(--danger)]">{error}</p> : null}
        <div className="md:col-span-2">
          <ActionButtons
            canManage={Boolean(selectedId)}
            isSubmitting={isSubmitting}
            onArchive={onArchive}
            onDelete={onDelete}
            submitLabel={selectedId ? "Update interface" : "Create interface"}
          />
        </div>
      </form>
    </SectionCard>
  );
}

export function InventoryAssetManager() {
  const elementsQuery = useInventoryElements();
  const assetsQuery = useInventoryAssets();
  const createAsset = useCreateInventoryAsset();
  const updateAsset = useUpdateInventoryAsset();
  const deleteAsset = useDeleteInventoryAsset();
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    assetType: "",
    locationId: "",
    assignedTo: "",
    status: "active"
  });

  const assets = assetsQuery.data ?? [];
  const elements = elementsQuery.data ?? [];
  const selected = assets.find((item) => item.id === selectedId) ?? null;
  const isSubmitting = createAsset.isPending || updateAsset.isPending || deleteAsset.isPending;

  useEffect(() => {
    if (!selected) {
      setForm({
        name: "",
        assetType: "",
        locationId: "",
        assignedTo: "",
        status: "active"
      });
      return;
    }

    setForm({
      name: selected.name ?? "",
      assetType: selected.asset_type ?? "",
      locationId: selected.location_id ?? "",
      assignedTo: selected.assigned_to ?? "",
      status: selected.status ?? "active"
    });
  }, [selected]);

  async function onSubmit(formData: FormData) {
    try {
      setError(null);
      setNotice(null);
      const payload = {
        name: String(formData.get("name") ?? ""),
        assetType: String(formData.get("assetType") ?? "") || undefined,
        locationId: String(formData.get("locationId") ?? "") || undefined,
        assignedTo: String(formData.get("assignedTo") ?? "") || undefined,
        status: String(formData.get("status") ?? "active")
      };

      if (selectedId) {
        await updateAsset.mutateAsync({ id: selectedId, input: payload });
        setNotice("Asset updated.");
      } else {
        const created = await createAsset.mutateAsync(payload);
        setSelectedId(created.id);
        setNotice("Asset created.");
      }
    } catch (submissionError) {
      setError(formatMessage(submissionError, "Unable to save asset."));
    }
  }

  async function onArchive() {
    if (!selectedId) {
      return;
    }

    try {
      setError(null);
      setNotice(null);
      await updateAsset.mutateAsync({ id: selectedId, input: { status: "archived" } });
      setNotice("Asset archived.");
    } catch (archiveError) {
      setError(formatMessage(archiveError, "Unable to archive asset."));
    }
  }

  async function onDelete() {
    if (!selectedId) {
      return;
    }

    try {
      setError(null);
      setNotice(null);
      await deleteAsset.mutateAsync(selectedId);
      setSelectedId("");
      setNotice("Asset deleted.");
    } catch (deleteError) {
      setError(formatMessage(deleteError, "Unable to delete asset."));
    }
  }

  return (
    <SectionCard
      title="Manage assets"
      description="Create customer-premises or site assets, then update, archive, or delete them as needed."
    >
      <form action={onSubmit} className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium">Existing asset</span>
          <select
            className={inputClassName}
            disabled={assetsQuery.isLoading}
            name="selectedAsset"
            onChange={(event) => setSelectedId(event.target.value)}
            value={selectedId}
          >
            <option value="">Create new asset</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Asset name</span>
          <input className={inputClassName} name="name" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required value={form.name} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Asset type</span>
          <input className={inputClassName} name="assetType" onChange={(event) => setForm((current) => ({ ...current, assetType: event.target.value }))} placeholder="cpe" value={form.assetType} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Location ID</span>
          <input className={inputClassName} name="locationId" onChange={(event) => setForm((current) => ({ ...current, locationId: event.target.value }))} value={form.locationId} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Assigned element</span>
          <select className={inputClassName} name="assignedTo" onChange={(event) => setForm((current) => ({ ...current, assignedTo: event.target.value }))} value={form.assignedTo}>
            <option value="">Unassigned</option>
            {elements.map((element) => (
              <option key={element.id} value={element.id}>
                {element.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium">Status</span>
          <select className={inputClassName} name="status" onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} value={form.status}>
            <option value="active">active</option>
            <option value="in_stock">in_stock</option>
            <option value="inactive">inactive</option>
            <option value="archived">archived</option>
          </select>
        </label>
        {notice ? <p className="md:col-span-2 text-sm text-[var(--accent-strong)]">{notice}</p> : null}
        {error ? <p className="md:col-span-2 text-sm text-[var(--danger)]">{error}</p> : null}
        <div className="md:col-span-2">
          <ActionButtons
            canManage={Boolean(selectedId)}
            isSubmitting={isSubmitting}
            onArchive={onArchive}
            onDelete={onDelete}
            submitLabel={selectedId ? "Update asset" : "Create asset"}
          />
        </div>
      </form>
    </SectionCard>
  );
}
