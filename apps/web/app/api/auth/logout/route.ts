import { NextResponse } from "next/server";
import { recordDomainEvent } from "@/lib/api/events";
import { getCurrentSessionContext } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const session = await getCurrentSessionContext();
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut({ scope: "local" });

  const response = NextResponse.json({
    data: {
      success: true
    }
  });

  response.cookies.delete("telecosync-tenant");

  if (session) {
    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "auth.logout",
      entityType: "user",
      entityId: session.userId,
      payload: {
        email: session.email
      }
    });
  }

  return response;
}
