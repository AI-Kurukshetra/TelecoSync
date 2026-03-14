import { getCurrentSessionContext } from "@/lib/auth/session";
import { assertPermission, type AppPermission } from "@/lib/api/auth-guard";

export async function requireSessionContext(requiredPermission?: AppPermission) {
  const session = await getCurrentSessionContext();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  if (requiredPermission && session.role !== "admin") {
    assertPermission(session.permissions, requiredPermission);
  }

  return session;
}
