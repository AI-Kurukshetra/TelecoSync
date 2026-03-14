export const EVENT_TYPES = [
  "customer.created",
  "customer.updated",
  "customer.deleted",
  "product.created",
  "product.updated",
  "order.created",
  "order.updated",
  "order.status.changed",
  "invoice.created",
  "invoice.generated",
  "payment.created",
  "alarm.raised",
  "workflow.triggered",
  "revenue.assurance.completed",
  "webhook.delivery.failed",
  "notification.created",
  "document.created"
] as const;
