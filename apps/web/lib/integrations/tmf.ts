export function tmfHref(entity: string, id: string) {
  return `/${entity}/${id}`;
}

export function tmfEnvelope<T extends Record<string, unknown>>(
  entity: string,
  payload: T
) {
  return {
    "@type": entity,
    ...payload
  };
}

export function tmfEventType(eventType: string) {
  return eventType
    .split(".")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

export function tmfService(payload: {
  id: string;
  customerId?: string | null;
  productId?: string | null;
  networkElementId?: string | null;
  status?: string | null;
  activatedAt?: string | null;
  deactivatedAt?: string | null;
  config?: unknown;
}) {
  return tmfEnvelope("Service", {
    id: payload.id,
    href: tmfHref("services", payload.id),
    serviceDate: payload.activatedAt ?? payload.deactivatedAt ?? null,
    state: payload.status ?? null,
    serviceCharacteristic: payload.config ?? {},
    relatedParty: payload.customerId
      ? [{ role: "customer", id: payload.customerId }]
      : [],
    supportingResource: payload.networkElementId
      ? [{ id: payload.networkElementId }]
      : [],
    product: payload.productId ? { id: payload.productId } : null
  });
}

export function tmfResource(payload: {
  id: string;
  name?: string | null;
  type?: string | null;
  status?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  ipAddress?: string | null;
  resourceVersion?: string | null;
  characteristics?: unknown;
}) {
  return tmfEnvelope("Resource", {
    id: payload.id,
    href: tmfHref("inventory/elements", payload.id),
    name: payload.name ?? null,
    category: payload.type ?? null,
    operationalState: payload.status ?? null,
    resourceVersion: payload.resourceVersion ?? "1.0",
    resourceCharacteristic: {
      model: payload.model ?? null,
      serialNumber: payload.serialNumber ?? null,
      ipAddress: payload.ipAddress ?? null,
      metadata: payload.characteristics ?? null
    }
  });
}

export function tmfTroubleTicket(payload: {
  id: string;
  ticketNumber?: string | null;
  title?: string | null;
  description?: string | null;
  severity?: string | null;
  status?: string | null;
  createdAt?: string | null;
  resolvedAt?: string | null;
}) {
  return tmfEnvelope("TroubleTicket", {
    id: payload.id,
    href: tmfHref("faults/tickets", payload.id),
    ticketNumber: payload.ticketNumber ?? null,
    name: payload.title ?? null,
    description: payload.description ?? null,
    severity: payload.severity ?? null,
    status: payload.status ?? null,
    ticketType: "incident",
    creationDate: payload.createdAt ?? null,
    resolutionDate: payload.resolvedAt ?? null
  });
}

export function tmfSla(payload: {
  id: string;
  name?: string | null;
  metricType?: string | null;
  targetValue?: number | null;
  measurementWindow?: string | null;
  penalty?: unknown;
}) {
  return tmfEnvelope("ServiceLevelAgreement", {
    id: payload.id,
    href: tmfHref("sla", payload.id),
    name: payload.name ?? null,
    slaObjective: {
      metricType: payload.metricType ?? null,
      targetValue: payload.targetValue ?? null,
      measurementWindow: payload.measurementWindow ?? null
    },
    rule: payload.penalty ?? {}
  });
}

export function tmfEvent(payload: {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  sourceService?: string | null;
  firedAt?: string | null;
  processed?: boolean | null;
  payload?: unknown;
}) {
  return tmfEnvelope("Event", {
    id: payload.id,
    href: tmfHref("integrations/events", payload.id),
    eventType: payload.eventType,
    correlationId: payload.entityId,
    eventTime: payload.firedAt ?? null,
    source: payload.sourceService ?? null,
    domain: payload.entityType,
    processed: payload.processed ?? null,
    event: {
      "@type": tmfEventType(payload.eventType),
      payload: payload.payload ?? {}
    }
  });
}
