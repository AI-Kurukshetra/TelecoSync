import { apiError } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { getCurrentSessionContext } from "@/lib/auth/session";

export async function GET() {
  const session = await getCurrentSessionContext();

  if (!session) {
    return apiError("UNAUTHORIZED", "No active session.");
  }

  return ok(session);
}
