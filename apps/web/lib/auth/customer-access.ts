import type { SessionContext } from "@/lib/auth/session";

export function isCustomerSession(session: SessionContext) {
  return session.role === "customer";
}

export function assertCustomerOwnsCustomer(session: SessionContext, customerId: string) {
  if (isCustomerSession(session) && session.customerId !== customerId) {
    throw new Error("FORBIDDEN");
  }
}

export function assertCustomerContext(session: SessionContext) {
  if (isCustomerSession(session) && (!session.customerId || !session.accountId)) {
    throw new Error("FORBIDDEN");
  }
}
