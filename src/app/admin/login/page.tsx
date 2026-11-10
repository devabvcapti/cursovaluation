"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { cn } from "@/lib/cn";

type Status = "idle" | "redirecting" | "error";

const ERROR_TEXT_CLASSES = "mt-4 font-body text-sm text-red-600";

const SUBMIT_BUTTON_CLASSES = cn(
  "mt-8 inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-full px-8 py-3",
  "border border-brand-navy/15 bg-white text-brand-navy",
  "font-body text-sm font-medium",
  "transition-all duration-200 ease-out hover:bg-brand-navy/5 disabled:cursor-not-allowed disabled:opacity-60",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
);

function MicrosoftLogo() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 21 21" className="shrink-0">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

const DENIED_MESSAGE =
  "Sua conta entrou com sucesso, mas não tem permissão para gerenciar cupons do curso Modelagem Financeira e Valuation.";

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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm text-center">
        <Image
          src="/brand/abvcap-logo-color.png"
          alt="ABVCAP"
          width={168}
          height={70}
          priority
          className="mx-auto h-10 w-auto"
        />

        <h1 className="mt-6 font-heading text-2xl font-semibold text-brand-navy">
          Painel de Cupons
        </h1>
        <p className="mt-2 font-body text-sm text-brand-navy/60">
          Acesso restrito a colaboradores ABVCAP.
        </p>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={status === "redirecting"}
          className={SUBMIT_BUTTON_CLASSES}
        >
          <MicrosoftLogo />
          Entrar com Microsoft
        </button>

        {errorMessage ? <p className={ERROR_TEXT_CLASSES}>{errorMessage}</p> : null}
      </div>
    </main>
  );
}
