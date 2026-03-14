import { ok } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/route-guard";
import { requireSessionContext } from "@/lib/api/server-context";
import { seedDemoTenantData } from "@/lib/server/demo-seed";

export async function POST() {
  try {
    const session = await requireSessionContext("admin:write");
    const result = await seedDemoTenantData(
      session.tenantId,
      session.tenantSlug ?? "tenant",
      session.userId,
    );

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
