import { getSupabaseServerClient } from "@/lib/supabase/server-client";

/**
 * Independent, server-side session guard for `/api/admin/*` route handlers.
 *
 * `src/middleware.ts` (Task 18) already redirects unauthenticated *page*
 * navigations under `/admin`, but that does not stop a direct HTTP request
 * to an API route — so every admin route handler calls this itself, per
 * request (it is not cached/memoized), before touching any data client.
 *
 * Returns `{ email }` only when Supabase Auth resolves a real user with an
 * email on the current request's session cookie; `null` otherwise, including
 * when anything in the process throws.
 */
export async function requireAdminSession(): Promise<{ email: string } | null> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.email ? { email: user.email } : null;
  } catch {
    return null;
  }
}
