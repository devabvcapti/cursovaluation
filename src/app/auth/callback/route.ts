import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

/**
 * Supabase Auth's OAuth redirect target (configured as the `redirectTo` in
 * `/admin/login`'s `signInWithOAuth` call). Exchanges the authorization code
 * Microsoft/Supabase appended to the URL for a session, writing the session
 * cookie via `getSupabaseServerClient`'s cookie adapter, then hands off to
 * `/admin/cupons` — `src/proxy.ts` is what actually decides whether the
 * signed-in account is allowed in.
 *
 * The redirect prefers `NEXT_PUBLIC_SITE_URL` over the request's own
 * `origin`: behind a reverse proxy that doesn't forward the real Host (seen
 * on Hostinger — confirmed `origin` there resolves to the Next.js server's
 * own bind address, `http://0.0.0.0:3000`, not the public domain), using
 * `origin` sends the browser to a redirect it can never reach, which it
 * renders as a generic 500. Falls back to `origin` when the env var isn't
 * set (local dev, and any host — e.g. Vercel — that already reports the
 * real public host correctly).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    try {
      const supabase = await getSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("[auth/callback] exchangeCodeForSession returned an error:", error.message);
      }
    } catch (error) {
      // Never block the redirect over this — an unexchanged code just means
      // `src/proxy.ts` sends the visitor back to /admin/login as "not signed
      // in", same as any other failed login. Logged so a real cause (e.g. a
      // misconfigured env var) is diagnosable instead of a silent 500.
      console.error(
        "[auth/callback] exchangeCodeForSession threw:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
  return NextResponse.redirect(`${siteUrl}/admin/cupons`);
}
