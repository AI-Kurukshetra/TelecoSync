import { redirect } from "next/navigation";
import { getDefaultRouteForRole } from "@/lib/auth/access";
import { getCurrentSessionContext } from "@/lib/auth/session";
export default async function WorkspacePage() {
  const session = await getCurrentSessionContext();
  const destination = getDefaultRouteForRole(session?.role, session?.permissions ?? []);
  redirect(destination);
}
