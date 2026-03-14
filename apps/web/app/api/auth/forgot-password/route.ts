import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { forgotPasswordSchema } from "@/lib/auth/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { recordDomainEvent } from "@/lib/api/events";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid forgot-password payload.");
  }

  const supabase = createServerSupabaseClient();
  const origin =
    process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.length > 0
      ? process.env.NEXT_PUBLIC_APP_URL
      : new URL(request.url).origin;

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password`
  });

  if (error) {
    return apiError("INTERNAL_ERROR", error.message);
  }

  const adminClient = createAdminSupabaseClient();
  const { data: userLookup } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 200
  });
  const matchedUser = userLookup?.users.find((user) => user.email === parsed.data.email);

  if (matchedUser) {
    const tenantId =
      typeof matchedUser.app_metadata.tenant_id === "string"
        ? matchedUser.app_metadata.tenant_id
        : typeof matchedUser.user_metadata.tenant_id === "string"
          ? matchedUser.user_metadata.tenant_id
          : null;

    if (tenantId) {
      await recordDomainEvent({
        tenantId,
        eventType: "auth.password_reset_requested",
        entityType: "user",
        entityId: matchedUser.id,
        payload: {
          email: parsed.data.email
        }
      });
    }
  }

  return ok({ sent: true });
}
