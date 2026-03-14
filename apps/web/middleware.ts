import { type NextRequest } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { updateSession } from "@/lib/supabase/proxy";

export async function middleware(request: NextRequest) {
  const limited = await enforceRateLimit(request);

  if (limited) {
    return limited;
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
