import { apiError } from "@/lib/api/errors";
import { recordDomainEvent } from "@/lib/api/events";
import { ok } from "@/lib/api/response";
import { getCurrentSessionContext } from "@/lib/auth/session";

export async function POST() {
  const session = await getCurrentSessionContext();

  if (!session) {
    return apiError("UNAUTHORIZED", "No active session.");
  }

  await recordDomainEvent({
    tenantId: session.tenantId,
    eventType: "auth.refresh",
    entityType: "user",
    entityId: session.userId,
    payload: {
      email: session.email
    }
  });

  return ok(session);
}
