import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { paginationMeta, parsePagination } from "@/lib/api/pagination";
import { tmfEnvelope, tmfHref } from "@/lib/integrations/tmf";

export async function GET(request: Request) {
  try {
    const session = await requireSessionContext("admin:read");
    const pagination = parsePagination(request);
    const supabase = adminTenantClient();
    const { data, error, count } = await supabase
      .from("user_profiles")
      .select("id, full_name, department, status, role_id, created_at", {
        count: "exact"
      })
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(
      (data ?? []).map((user) =>
        tmfEnvelope("PartyRole", {
          id: user.id,
          href: tmfHref("admin/users", user.id),
          name: user.full_name,
          full_name: user.full_name,
          department: user.department,
          status: user.status,
          roleId: user.role_id,
          created_at: user.created_at,
          createdAt: user.created_at,
          engagedParty: {
            id: user.id
          }
        })
      ),
      paginationMeta(pagination, count)
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
