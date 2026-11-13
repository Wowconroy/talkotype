import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function copyCookiesAndCacheHeaders(
  from: NextResponse,
  to: NextResponse,
) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header);
    if (value) to.headers.set(header, value);
  }
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers = {}) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([headerKey, headerValue]) => {
          supabaseResponse.headers.set(headerKey, headerValue);
        });
      },
    },
  });

  // Single auth check — getClaims refreshes when needed and already falls
  // back to Auth API verification for symmetric JWT projects.
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;

  const path = request.nextUrl.pathname;
  const isApi =
    path.startsWith("/api/transcripts") ||
    path.startsWith("/api/account") ||
    path.startsWith("/api/desk") ||
    path.startsWith("/api/folders") ||
    path.startsWith("/api/billing/portal");
  const isProtectedPage =
    path.startsWith("/app") || path.startsWith("/account");

  const isPrefetch =
    request.headers.get("Next-Router-Prefetch") === "1" ||
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("Purpose") === "prefetch" ||
    request.headers.get("Sec-Purpose") === "prefetch";

  if (!userId && isApi) {
    const unauthorized = NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
    copyCookiesAndCacheHeaders(supabaseResponse, unauthorized);
    return unauthorized;
  }

  if (!userId && isProtectedPage && !isPrefetch) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    copyCookiesAndCacheHeaders(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  return supabaseResponse;
}

/** Only run auth proxy on routes that need it — not the whole marketing site. */
export const config = {
  matcher: [
    "/app/:path*",
    "/account/:path*",
    "/api/transcripts/:path*",
    "/api/account/:path*",
    "/api/desk/:path*",
    "/api/folders/:path*",
    "/api/billing/portal",
  ],
};
