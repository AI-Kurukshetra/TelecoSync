import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canAccessAppPath, getDefaultRouteForRole, normalizeAppRole } from "@/lib/auth/access";
import { getSupabaseBrowserConfig } from "@/lib/supabase/config";
import {
  AUTH_API_PUBLIC_PATHS,
  AUTH_PAGE_PATHS,
  DEFAULT_AUTH_REDIRECT,
  resolveTenantContext
} from "@/lib/auth/session";

function isProtectedPath(pathname: string) {
  if (pathname === "/") {
    return false;
  }

  if (AUTH_PAGE_PATHS.includes(pathname)) {
    return false;
  }

  if (pathname.startsWith("/api/")) {
    return !AUTH_API_PUBLIC_PATHS.includes(pathname);
  }

  return true;
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);

  if (request.nextUrl.pathname !== "/login") {
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
  }

  return NextResponse.redirect(loginUrl);
}

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const cookieOperations: Array<{
    name: string;
    value: string;
    options?: any;
  }> = [];
  let response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  const { url, publishableKey } = getSupabaseBrowserConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          cookieOperations.push({ name, value, options });
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const tenantContext = resolveTenantContext(user);
  const pathname = request.nextUrl.pathname;

  if (!user && isProtectedPath(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required."
          }
        },
        { status: 401 }
      );
    }

    return redirectToLogin(request);
  }

  if (user && AUTH_PAGE_PATHS.includes(pathname)) {
    const redirectPath = tenantContext ? getDefaultRouteForRole(tenantContext.role) : DEFAULT_AUTH_REDIRECT;
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  if (tenantContext) {
    const normalizedRole = normalizeAppRole(tenantContext.role);

    if (!pathname.startsWith("/api/") && !canAccessAppPath(pathname, normalizedRole)) {
      const deniedUrl = new URL("/access-denied", request.url);
      deniedUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(deniedUrl);
    }

    requestHeaders.set("x-tenant-id", tenantContext.tenantId);
    requestHeaders.set("x-tenant-role", normalizedRole);
  }

  response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  cookieOperations.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  if (tenantContext) {
    response.headers.set("x-telecosync-tenant", tenantContext.tenantId);
    response.cookies.set("telecosync-tenant", tenantContext.tenantId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
  } else {
    response.cookies.delete("telecosync-tenant");
  }

  response.headers.set("Cache-Control", "private, no-store");

  return response;
}
