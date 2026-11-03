import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cookie-bound Supabase client for Server Components, Route Handlers and
 * Server Actions under `/admin`. Uses the anon key plus the caller's
 * session cookie — Row Level Security still applies.
 *
 * `setAll` is wrapped in try/catch because Server Components can call this
 * (to read the session) but cannot write cookies; when that happens, the
 * middleware from Task 18 is responsible for refreshing the session cookie.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component where cookie writes aren't
          // allowed; the middleware refreshes the session cookie instead.
        }
      },
    },
  });
}
