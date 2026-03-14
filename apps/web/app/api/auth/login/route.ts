import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/errors";
import { getDefaultRouteForRole } from "@/lib/auth/access";
import { loginSchema } from "@/lib/auth/schemas";
import { resolveTenantContext } from "@/lib/auth/session";
import { recordDomainEvent } from "@/lib/api/events";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid login payload.");
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error || !data.user) {
    return apiError("UNAUTHORIZED", error?.message ?? "Invalid credentials.");
  }

  const tenantContext = resolveTenantContext(data.user);

  if (!tenantContext) {
    await supabase.auth.signOut({ scope: "local" });
    return apiError(
      "FORBIDDEN",
      "This account is missing tenant metadata. Add tenant_id to app_metadata or user_metadata."
    );
  }

  const nextPath =
    parsed.data.next && parsed.data.next.startsWith("/")
      ? parsed.data.next
      : getDefaultRouteForRole(tenantContext.role);

  const response = NextResponse.json({
    data: {
      user: {
        id: data.user.id,
        email: data.user.email ?? null
      },
      tenant: tenantContext,
      nextPath
    }
  });

  response.cookies.set("telecosync-tenant", tenantContext.tenantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });

  await recordDomainEvent({
    tenantId: tenantContext.tenantId,
    eventType: "auth.login",
    entityType: "user",
    entityId: data.user.id,
    payload: {
      email: data.user.email ?? null,
      nextPath
    }
  });

  return response;
}
