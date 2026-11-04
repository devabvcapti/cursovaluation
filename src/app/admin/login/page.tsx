"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { cn } from "@/lib/cn";

type Status = "idle" | "redirecting" | "error";

const ERROR_TEXT_CLASSES = "mt-4 font-body text-sm text-red-600";

const SUBMIT_BUTTON_CLASSES = cn(
  "mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md px-8 py-3.5",
  "bg-brand-green text-brand-navy border-2 border-brand-green",
  "font-heading text-sm font-bold uppercase tracking-[0.08em]",
  "transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
);

const DENIED_MESSAGE =
  "Sua conta entrou com sucesso, mas não tem permissão para gerenciar cupons do Curso Valuation.";

/**
 * Admin sign-in for `/admin/cupons`. Login is Microsoft SSO (Azure, via
 * Supabase Auth's "azure" OAuth provider) — this Supabase project
 * (abvcap-congress-2025) is shared with other ABVCAP systems, so a successful
 * Microsoft sign-in only proves the person has a Microsoft 365 account in
 * ABVCAP's tenant, not that they should manage coupons here. The actual
 * access gate is the 7-account allowlist in `@/lib/admin-allowlist`, enforced
 * by `src/proxy.ts` and `requireAdminSession` — a denied account lands back
 * here with `?denied=1` after successfully authenticating.
 */
export default function LoginPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // One-time, post-mount read of the URL this page was navigated to with
    // (set by src/proxy.ts's redirect) — not reacting to any React state, so
    // the usual "don't setState in an effect" guidance doesn't apply here.
    if (new URLSearchParams(window.location.search).get("denied") === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrorMessage(DENIED_MESSAGE);
    }
  }, []);

  async function handleSignIn() {
    setStatus("redirecting");
    setErrorMessage(null);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: { scopes: "email", redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
    }
    // On success, Supabase redirects the browser to Microsoft; there is
    // nothing more to do here.
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-heading text-xl font-bold text-brand-navy">Acesso administrativo</h1>
        <p className="mt-2 font-body text-sm text-brand-navy/70">
          Entre com sua conta Microsoft da ABVCAP para gerenciar cupons.
        </p>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={status === "redirecting"}
          className={SUBMIT_BUTTON_CLASSES}
        >
          Entrar com Microsoft
        </button>

        {errorMessage ? <p className={ERROR_TEXT_CLASSES}>{errorMessage}</p> : null}
      </div>
    </main>
  );
}
