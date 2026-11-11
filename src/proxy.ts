import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedAdminEmail } from "@/lib/admin-allowlist";

/**
 * Gates `/admin/*` behind Supabase Auth and refreshes the session cookie on
 * every matched request — the standard `@supabase/ssr` Next.js middleware
 * recipe, under Next 16's `proxy` file convention (formerly `middleware`; see
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md) (see `src/lib/supabase/server-client.ts` for the Server Component /
 * Route Handler counterpart). `/admin/login` itself is exempt so there's
 * always a way to reach the sign-in form.
 *
 * A successful sign-in is not enough on its own: this Supabase project is
 * shared with other ABVCAP systems, so any account that exists in it can
 * authenticate. Only the 7 accounts on `admin-allowlist.ts` may actually
 * reach `/admin/*` — anyone else is sent back to `/admin/login?denied=1`
 * even though they're signed in.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const isLoginPath = request.nextUrl.pathname === "/admin/login";

  // Hostinger reverse-proxy gotcha: `request.url`'s origin can resolve to
  // the Next.js server's own bind address (http://0.0.0.0:3000) instead of
  // the public domain, sending the browser to a redirect it can never reach
  // (rendered as a generic 500).
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

  if (isAdminPath && !isLoginPath && !user) {
    const loginUrl = new URL("/admin/login", siteUrl);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPath && !isLoginPath && user && !isAllowedAdminEmail(user.email)) {
    const deniedUrl = new URL("/admin/login", siteUrl);
    deniedUrl.searchParams.set("denied", "1");
    return NextResponse.redirect(deniedUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
