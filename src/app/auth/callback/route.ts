import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

/**
 * Supabase Auth's OAuth redirect target (configured as the `redirectTo` in
 * `/admin/login`'s `signInWithOAuth` call). Exchanges the authorization code
 * Microsoft/Supabase appended to the URL for a session, writing the session
 * cookie via `getSupabaseServerClient`'s cookie adapter, then hands off to
 * `/admin/cupons` — `src/proxy.ts` is what actually decides whether the
 * signed-in account is allowed in.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/admin/cupons`);
}
