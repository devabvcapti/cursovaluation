"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { cn } from "@/lib/cn";

type Status = "idle" | "submitting" | "error";

const ERROR_TEXT_CLASSES = "mt-4 font-body text-sm text-red-600";

const FIELD_CLASSES = cn(
  "mt-1 block w-full rounded-lg border border-brand-navy/15 px-4 py-2.5",
  "font-body text-sm text-brand-navy placeholder:text-brand-navy/40",
  "focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-green",
);

const SUBMIT_BUTTON_CLASSES = cn(
  "mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full px-8 py-3",
  "bg-brand-navy text-white",
  "font-body text-sm font-medium",
  "transition-all duration-200 ease-out hover:bg-brand-navy/90 disabled:cursor-not-allowed disabled:opacity-60",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
);

const DENIED_MESSAGE =
  "Sua conta entrou com sucesso, mas não tem permissão para gerenciar cupons do curso Modelagem Financeira e Valuation.";

/**
 * Admin sign-in for `/admin/cupons` — e-mail/senha via Supabase Auth. This
 * project previously used Microsoft SSO (Azure OAuth), but the redirect
 * round-trip through Microsoft's and Supabase's domains depended on a
 * same-browser PKCE cookie that production (Hostinger) was not preserving
 * reliably, causing intermittent failures with nothing logged server-side.
 * Password sign-in is a single same-origin request with no redirect hop, so
 * it isn't exposed to that failure mode. The actual access gate is still the
 * 7-account allowlist in `@/lib/admin-allowlist`, enforced by `src/proxy.ts`
 * and `requireAdminSession` — a correct password only proves the account
 * exists in Supabase Auth, not that it should manage coupons here.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    // Full navigation (not client-side routing) so src/proxy.ts sees the
    // session cookie Supabase just set on the response.
    window.location.assign("/admin/cupons");
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

        <form onSubmit={handleSubmit} className="mt-8 text-left">
          <label htmlFor="email" className="font-body text-sm font-medium text-brand-navy">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(changeEvent) => setEmail(changeEvent.target.value)}
            className={FIELD_CLASSES}
          />

          <label htmlFor="password" className="mt-4 block font-body text-sm font-medium text-brand-navy">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(changeEvent) => setPassword(changeEvent.target.value)}
            className={FIELD_CLASSES}
          />

          <button type="submit" disabled={status === "submitting"} className={SUBMIT_BUTTON_CLASSES}>
            Entrar
          </button>
        </form>

        {errorMessage ? <p className={ERROR_TEXT_CLASSES}>{errorMessage}</p> : null}
      </div>
    </main>
  );
}
