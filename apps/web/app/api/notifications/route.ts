import { ok, created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { assertPermission } from "@/lib/api/auth-guard";
import { isCustomerSession } from "@/lib/auth/customer-access";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { notificationSchema } from "@/lib/utils/zod-schemas/admin";
import { recordDomainEvent } from "@/lib/api/events";

export async function GET() {
  try {
    const session = await requireSessionContext();
    if (!isCustomerSession(session) && session.role !== "admin") {
      assertPermission(session.permissions, "admin:read");
    }
    const supabase = adminTenantClient();
    let query = supabase
      .from("notifications")
      .select("id, user_id, channel, title, body, status, sent_at, read_at, created_at")
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false });

    if (isCustomerSession(session)) {
      query = query.or(`user_id.is.null,user_id.eq.${session.userId}`);
    }

    const { data, error } = await query;

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(data ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionContext("admin:write");
    const json = await request.json().catch(() => null);
    const result = notificationSchema.safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid notification payload.");

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("notifications")
      .insert(
        withTenantScope(session, {
          user_id: result.data.userId ?? null,
          channel: result.data.channel,
          title: result.data.title,
          body: result.data.body ?? null,
          status: "pending"
        })
      )
      .select("id, user_id, channel, title, body, status, sent_at")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create notification.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "notification.created",
      entityType: "notification",
      entityId: data.id,
      payload: data
    });

    return created(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
