import { unstable_rethrow } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { isAllowedAdminEmail } from "@/lib/admin-allowlist";

/**
 * Independent, server-side session guard for `/api/admin/*` route handlers
 * and the `/admin/cupons` page.
 *
 * `src/proxy.ts` (Task 18) already redirects unauthenticated *page*
 * navigations under `/admin`, but that does not stop a direct HTTP request
 * to an API route — so every admin route handler calls this itself, per
 * request (it is not cached/memoized), before touching any data client.
 *
 * Returns `{ email }` only when Supabase Auth resolves a real user with an
 * email on the current request's session cookie AND that email is on
 * `admin-allowlist.ts` — this Supabase project (abvcap-congress-2025) is
 * shared with other ABVCAP systems via Microsoft SSO, so successfully
 * authenticating is not enough; only the 7 accounts decided on 2026-11-04 may
 * manage coupons. Returns `null` otherwise, including when anything in the
 * process throws — EXCEPT Next.js's own framework-controlled throws
 * (`unstable_rethrow`): during a build-time prerender, `cookies()` throws to
 * mark the page as request-time. Swallowing that would make a page caller
 * "see" no session at build time and bake a static redirect to /admin/login
 * into the route.
 */
export async function requireAdminSession(): Promise<{ email: string } | null> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.email && isAllowedAdminEmail(user.email) ? { email: user.email } : null;
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}
